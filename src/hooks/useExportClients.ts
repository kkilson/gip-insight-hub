import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface ExportFilters {
  search?: string;
  insurerId?: string | null;
  productId?: string | null;
  status?: string | null;
  advisorId?: string | null;
  dateFrom?: string;
  dateTo?: string;
}

const STATUS_LABELS: Record<string, string> = {
  vigente: 'Vigente',
  pendiente: 'Pendiente',
  cancelada: 'Cancelada',
  vencida: 'Vencida',
  en_tramite: 'En trámite',
};

const FREQUENCY_LABELS: Record<string, string> = {
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

const ID_TYPE_LABELS: Record<string, string> = {
  cedula: 'Cédula',
  pasaporte: 'Pasaporte',
  rif: 'RIF',
  otro: 'Otro',
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  tomador_titular: 'Tomador y Titular',
  conyuge: 'Cónyuge',
  hijo: 'Hijo/a',
  padre: 'Padre',
  madre: 'Madre',
  hermano: 'Hermano/a',
  otro: 'Otro',
};

export function useExportClients() {
  const { toast } = useToast();

  // Fetch insurers for name resolution
  const { data: insurers = [] } = useQuery({
    queryKey: ['insurers-export'],
    queryFn: async () => {
      const { data } = await supabase.from('insurers').select('id, name');
      return data || [];
    },
  });

  // Fetch products for name resolution
  const { data: products = [] } = useQuery({
    queryKey: ['products-export'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name, insurer_id');
      return data || [];
    },
  });

  // Fetch advisors for name resolution
  const { data: advisors = [] } = useQuery({
    queryKey: ['advisors-export'],
    queryFn: async () => {
      const { data } = await supabase.from('advisors').select('id, full_name');
      return data || [];
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (filters?: ExportFilters) => {
      // Fetch all clients with their policies, beneficiaries, and advisors
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          policies:policies(
            *,
            policy_advisors:policy_advisors(
              advisor_role,
              advisor_id
            ),
            beneficiaries:beneficiaries(*)
          )
        `)
        .order('last_name', { ascending: true });

      if (clientsError) throw clientsError;

      // Apply filters client-side if provided
      let filteredClients = clients || [];

      if (filters?.search) {
        const search = filters.search.toLowerCase();
        filteredClients = filteredClients.filter(
          (c) =>
            c.first_name.toLowerCase().includes(search) ||
            c.last_name.toLowerCase().includes(search) ||
            c.identification_number.toLowerCase().includes(search)
        );
      }

      if (filters?.insurerId) {
        filteredClients = filteredClients.filter((c) =>
          c.policies?.some((p: any) => p.insurer_id === filters.insurerId)
        );
      }

      if (filters?.productId) {
        filteredClients = filteredClients.filter((c) =>
          c.policies?.some((p: any) => p.product_id === filters.productId)
        );
      }

      if (filters?.status) {
        filteredClients = filteredClients.filter((c) =>
          c.policies?.some((p: any) => p.status === filters.status)
        );
      }

      if (filters?.advisorId) {
        filteredClients = filteredClients.filter((c) =>
          c.policies?.some((p: any) =>
            p.policy_advisors?.some((pa: any) => pa.advisor_id === filters.advisorId)
          )
        );
      }

      // Build export rows - one row per policy (with beneficiaries in columns)
      const exportRows: Record<string, any>[] = [];

      filteredClients.forEach((client) => {
        const policies = client.policies || [];

        if (policies.length === 0) {
          // Client without policies
          exportRows.push({
            'Número Póliza': '',
            'Aseguradora': '',
            'Producto': '',
            'Fecha Inicio': '',
            'Fecha Renovación': '',
            'Estado': '',
            'Prima Anual': '',
            'Frecuencia Pago': '',
            'Fecha Pago Prima': '',
            'Suma Asegurada': '',
            'Deducible': '',
            'Asesor Principal': '',
            'Asesor Secundario': '',
            'Notas Póliza': '',
            'Tipo ID Tomador': ID_TYPE_LABELS[client.identification_type] || client.identification_type,
            'Cédula Tomador': client.identification_number,
            'Nombres Tomador': client.first_name,
            'Apellidos Tomador': client.last_name,
            'Email Tomador': client.email || '',
            'Teléfono Tomador': client.phone || '',
            'Móvil Tomador': client.mobile || '',
            'Dirección Tomador': client.address || '',
            'Ciudad Tomador': client.city || '',
            'Estado/Provincia Tomador': client.province || '',
            'F. Nacimiento Tomador': client.birth_date || '',
            'Ocupación Tomador': client.occupation || '',
            'Lugar Trabajo Tomador': client.workplace || '',
          });
        } else {
          policies.forEach((policy: any) => {
            // Resolve names
            const insurerName = insurers.find((i) => i.id === policy.insurer_id)?.name || '';
            const productName = products.find((p) => p.id === policy.product_id)?.name || '';
            
            // Resolve advisors
            const primaryAdvisorId = policy.policy_advisors?.find((pa: any) => pa.advisor_role === 'principal')?.advisor_id;
            const secondaryAdvisorId = policy.policy_advisors?.find((pa: any) => pa.advisor_role === 'secundario')?.advisor_id;
            const primaryAdvisorName = advisors.find((a) => a.id === primaryAdvisorId)?.full_name || '';
            const secondaryAdvisorName = advisors.find((a) => a.id === secondaryAdvisorId)?.full_name || '';

            const beneficiaries = policy.beneficiaries || [];

            const row: Record<string, any> = {
              'Número Póliza': policy.policy_number || '',
              'Aseguradora': insurerName,
              'Producto': productName,
              'Fecha Inicio': policy.start_date || '',
              'Fecha Renovación': policy.end_date || '',
              'Estado': STATUS_LABELS[policy.status] || policy.status || '',
              'Prima Anual': policy.premium || '',
              'Frecuencia Pago': FREQUENCY_LABELS[policy.payment_frequency] || policy.payment_frequency || '',
              'Fecha Pago Prima': policy.premium_payment_date || '',
              'Suma Asegurada': policy.coverage_amount || '',
              'Deducible': policy.deductible || '',
              'Asesor Principal': primaryAdvisorName,
              'Asesor Secundario': secondaryAdvisorName,
              'Notas Póliza': policy.notes || '',
              'Tipo ID Tomador': ID_TYPE_LABELS[client.identification_type] || client.identification_type,
              'Cédula Tomador': client.identification_number,
              'Nombres Tomador': client.first_name,
              'Apellidos Tomador': client.last_name,
              'Email Tomador': client.email || '',
              'Teléfono Tomador': client.phone || '',
              'Móvil Tomador': client.mobile || '',
              'Dirección Tomador': client.address || '',
              'Ciudad Tomador': client.city || '',
              'Estado/Provincia Tomador': client.province || '',
              'F. Nacimiento Tomador': client.birth_date || '',
              'Ocupación Tomador': client.occupation || '',
              'Lugar Trabajo Tomador': client.workplace || '',
            };

            // Add beneficiary columns (up to 7)
            for (let i = 1; i <= 7; i++) {
              const ben = beneficiaries[i - 1];
              row[`Nombres Beneficiario ${i}`] = ben?.first_name || '';
              row[`Apellidos Beneficiario ${i}`] = ben?.last_name || '';
              row[`Tipo ID Beneficiario ${i}`] = ben ? (ID_TYPE_LABELS[ben.identification_type] || ben.identification_type || '') : '';
              row[`Cédula Beneficiario ${i}`] = ben?.identification_number || '';
              row[`Parentesco Beneficiario ${i}`] = ben ? (RELATIONSHIP_LABELS[ben.relationship] || ben.relationship || '') : '';
              row[`F. Nacimiento Beneficiario ${i}`] = ben?.birth_date || '';
              row[`Teléfono Beneficiario ${i}`] = ben?.phone || '';
              row[`Email Beneficiario ${i}`] = ben?.email || '';
            }

            exportRows.push(row);
          });
        }
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportRows);

      // Set column widths
      const colWidths = Object.keys(exportRows[0] || {}).map(() => ({ wch: 18 }));
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

      // Generate filename with date
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const filename = `clientes_export_${dateStr}.xlsx`;

      // Download
      XLSX.writeFile(wb, filename);

      return { count: exportRows.length };
    },
    onSuccess: (result) => {
      toast({
        title: 'Exportación completada',
        description: `Se exportaron ${result.count} registros.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al exportar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    exportClients: exportMutation.mutate,
    isExporting: exportMutation.isPending,
  };
}
