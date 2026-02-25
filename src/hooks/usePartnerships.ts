import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Partner {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  rif: string | null;
  address: string | null;
  category: string | null;
  logo_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  services?: PartnerService[];
}

export interface PartnerService {
  id: string;
  partner_id: string;
  name: string;
  description: string | null;
  discount_type: 'porcentaje' | 'monto_fijo';
  discount_value: number;
  is_active: boolean;
  created_at: string;
  partner?: Partner;
}

export interface DiscountCode {
  id: string;
  service_id: string;
  client_id: string | null;
  code: string;
  max_uses: number;
  current_uses: number;
  status: 'generado' | 'enviado' | 'utilizado' | 'expirado';
  expires_at: string | null;
  sent_at: string | null;
  used_at: string | null;
  notes: string | null;
  created_at: string;
  service?: PartnerService & { partner?: Partner };
  client?: { id: string; first_name: string; last_name: string; email: string | null };
}

export function usePartners() {
  return useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*, services:partner_services(*)')
        .order('name');
      if (error) throw error;
      return data as unknown as Partner[];
    },
  });
}

export function usePartnerServices() {
  return useQuery({
    queryKey: ['partner-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_services')
        .select('*, partner:partners(id, name)')
        .order('name');
      if (error) throw error;
      return data as unknown as PartnerService[];
    },
  });
}

export function useDiscountCodes() {
  return useQuery({
    queryKey: ['discount-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*, service:partner_services(id, name, discount_type, discount_value, partner:partners(id, name)), client:clients(id, first_name, last_name, email)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as DiscountCode[];
    },
  });
}

export function useSavePartner() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (partner: Partial<Partner> & { id?: string }) => {
      const { id, services, ...data } = partner as any;
      if (id) {
        const { error } = await supabase.from('partners').update(data).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('partners').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] });
      toast({ title: 'Aliado guardado correctamente' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useSaveService() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (service: Partial<PartnerService> & { id?: string }) => {
      const { id, partner, ...data } = service as any;
      if (id) {
        const { error } = await supabase.from('partner_services').update(data).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('partner_services').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner-services'] });
      qc.invalidateQueries({ queryKey: ['partners'] });
      toast({ title: 'Servicio guardado correctamente' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'KVR-';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function useGenerateCode() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (params: { service_id: string; client_id?: string; max_uses?: number; expires_at?: string; notes?: string }) => {
      const code = generateCode();
      const { error } = await supabase.from('discount_codes').insert({
        service_id: params.service_id,
        client_id: params.client_id || null,
        code,
        max_uses: params.max_uses || 1,
        expires_at: params.expires_at || null,
        notes: params.notes || null,
        status: 'generado',
      });
      if (error) throw error;
      return code;
    },
    onSuccess: (code) => {
      qc.invalidateQueries({ queryKey: ['discount-codes'] });
      toast({ title: 'Código generado', description: code });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateCodeStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'enviado') updates.sent_at = new Date().toISOString();
      if (status === 'utilizado') {
        updates.used_at = new Date().toISOString();
        // Increment current_uses
        const { data: current } = await supabase.from('discount_codes').select('current_uses').eq('id', id).single();
        updates.current_uses = (current?.current_uses || 0) + 1;
      }
      const { error } = await supabase.from('discount_codes').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discount-codes'] });
      toast({ title: 'Estado actualizado' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}
