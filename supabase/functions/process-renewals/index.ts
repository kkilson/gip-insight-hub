// @ts-nocheck - Edge function with Deno types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RenewalToProcess {
  id: string;
  policy_id: string;
  renewal_date: string;
  current_amount: number;
  new_amount: number;
  percentage: number;
  scheduled_send_date: string;
  policy: {
    policy_number: string;
    client: {
      first_name: string;
      last_name: string;
      email: string;
    };
    insurer: {
      name: string;
    };
    product: {
      name: string;
    };
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // ============================================
    // AUTHENTICATION: Validate JWT token
    // ============================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[process-renewals] Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Missing authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth token to validate JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('[process-renewals] Invalid JWT token:', claimsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`[process-renewals] Authenticated user: ${userId}`);

    // ============================================
    // AUTHORIZATION: Check user has required role
    // ============================================
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError || !userRole) {
      console.error('[process-renewals] User has no role assigned:', roleError);
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: No role assigned to user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only allow users with acceso_total or revision_edicion_1 roles
    const allowedRoles = ['acceso_total', 'revision_edicion_1'];
    if (!allowedRoles.includes(userRole.role)) {
      console.error(`[process-renewals] User role '${userRole.role}' not authorized`);
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: Insufficient permissions to process renewals' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[process-renewals] User authorized with role: ${userRole.role}`);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    console.log(`[process-renewals] Running for date: ${today}`);

    // Find renewals scheduled to be sent today that haven't been sent yet
    const { data: renewals, error: fetchError } = await supabase
      .from('renewal_configs')
      .select(`
        id,
        policy_id,
        renewal_date,
        current_amount,
        new_amount,
        percentage,
        scheduled_send_date,
        policy:policies(
          policy_number,
          client:clients(
            first_name,
            last_name,
            email
          ),
          insurer:insurers(
            name
          ),
          product:products(
            name
          )
        )
      `)
      .eq('scheduled_send_date', today)
      .eq('status', 'programada')
      .eq('email_sent', false);

    if (fetchError) {
      console.error('[process-renewals] Error fetching renewals:', fetchError);
      throw fetchError;
    }

    console.log(`[process-renewals] Found ${renewals?.length || 0} renewals to process`);

    const results = {
      processed: 0,
      sent: 0,
      errors: [] as string[],
    };

    if (!renewals || renewals.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No renewals to process today',
          results 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Process each renewal
    for (const renewal of renewals) {
      results.processed++;
      
      try {
        const policy = Array.isArray(renewal.policy) ? renewal.policy[0] : renewal.policy;
        const client = Array.isArray(policy?.client) ? policy.client[0] : policy?.client;
        const insurer = Array.isArray(policy?.insurer) ? policy.insurer[0] : policy?.insurer;
        const product = Array.isArray(policy?.product) ? policy.product[0] : policy?.product;

        if (!client?.email) {
          console.warn(`[process-renewals] Renewal ${renewal.id}: No client email, skipping`);
          results.errors.push(`${renewal.id}: No email for client`);
          
          await supabase
            .from('renewal_configs')
            .update({ 
              status: 'error',
              notes: 'No se encontró email del cliente'
            })
            .eq('id', renewal.id);
          
          continue;
        }

        // Get broker settings for the email
        const { data: brokerSettings } = await supabase
          .from('broker_settings')
          .select('name, email, phone, logo_url')
          .limit(1)
          .single();

        // Build email content
        const emailSubject = `Renovación de su póliza ${policy.policy_number || ''} - ${client.first_name} ${client.last_name}`;
        
        const percentageText = renewal.percentage > 0 
          ? `+${renewal.percentage.toFixed(2)}%`
          : `${renewal.percentage.toFixed(2)}%`;

        const emailBody = `
Estimado/a ${client.first_name} ${client.last_name},

Esperamos que se encuentre muy bien.

Le enviamos el aviso de renovación de su póliza ${policy.policy_number || ''}, la cual vence el ${new Date(renewal.renewal_date).toLocaleDateString('es-ES')}.

RESUMEN DE RENOVACIÓN:
• Aseguradora: ${insurer?.name || '-'}
• Producto: ${product?.name || '-'}
• Prima actual: $${renewal.current_amount.toFixed(2)}
• Prima nuevo período: $${renewal.new_amount.toFixed(2)}
• Variación: ${percentageText}

Si tiene alguna consulta o requiere asistencia, estamos a su disposición.

Atentamente,
${brokerSettings?.name || 'GIP Asesores Integrales'}
${brokerSettings?.email ? `Email: ${brokerSettings.email}` : ''}
${brokerSettings?.phone ? `Teléfono: ${brokerSettings.phone}` : ''}

---
Este es un mensaje automático generado por el sistema.
        `.trim();

        // Send email via Resend
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        if (!RESEND_API_KEY) {
          console.warn(`[process-renewals] RESEND_API_KEY not configured, skipping email for ${renewal.id}`);
          results.errors.push(`${renewal.id}: RESEND_API_KEY not configured`);
          continue;
        }

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'GIP Asesores <onboarding@resend.dev>',
            to: [client.email],
            subject: emailSubject,
            text: emailBody,
          }),
        });

        const resendData = await resendResponse.json();
        
        if (!resendResponse.ok) {
          console.error(`[process-renewals] Resend error for ${renewal.id}:`, resendData);
          throw new Error(resendData.message || 'Failed to send email');
        }

        console.log(`[process-renewals] Email sent for renewal ${renewal.id}, Resend ID: ${resendData.id}`);

        // Update renewal status
        const { error: updateError } = await supabase
          .from('renewal_configs')
          .update({
            status: 'enviada',
            email_sent: true,
            email_sent_at: new Date().toISOString(),
          })
          .eq('id', renewal.id);

        if (updateError) {
          console.error(`[process-renewals] Error updating renewal ${renewal.id}:`, updateError);
          results.errors.push(`${renewal.id}: Error updating status`);
          continue;
        }

        // Log to audit
        await supabase.from('audit_logs').insert({
          module: 'renovaciones',
          action: 'renewal_sent',
          record_type: 'renewal_configs',
          record_id: renewal.id,
          details: {
            policy_id: renewal.policy_id,
            policy_number: policy.policy_number,
            client_email: client.email,
            renewal_date: renewal.renewal_date,
          },
        });

        results.sent++;
        console.log(`[process-renewals] Successfully processed renewal ${renewal.id}`);

      } catch (err) {
        console.error(`[process-renewals] Error processing renewal ${renewal.id}:`, err);
        results.errors.push(`${renewal.id}: ${err.message}`);
        
        await supabase
          .from('renewal_configs')
          .update({ 
            status: 'error',
            notes: `Error: ${err.message}`
          })
          .eq('id', renewal.id);
      }
    }

    console.log(`[process-renewals] Completed. Processed: ${results.processed}, Sent: ${results.sent}, Errors: ${results.errors.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${results.processed} renewals, sent ${results.sent}`,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[process-renewals] Fatal error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
