export interface ClientFormData {
  identification_type: 'cedula' | 'pasaporte' | 'rif' | 'otro';
  identification_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  province?: string;
  birth_date?: string;
  occupation?: string;
  workplace?: string;
  notes?: string;
}

export interface PolicyFormData {
  insurer_id?: string;
  product_id?: string;
  policy_number?: string;
  start_date: string;
  end_date: string;
  status: 'vigente' | 'pendiente' | 'cancelada' | 'vencida' | 'en_tramite';
  premium?: string;
  payment_frequency: 'mensual' | 'mensual_10_cuotas' | 'mensual_12_cuotas' | 'bimensual' | 'trimestral' | 'semestral' | 'anual';
  coverage_amount?: string;
  deductible?: string;
  notes?: string;
  premium_payment_date?: string;
}

export interface BeneficiaryFormData {
  id: string;
  first_name: string;
  last_name: string;
  identification_type?: 'cedula' | 'pasaporte' | 'rif' | 'otro';
  identification_number?: string;
  relationship: 'conyuge' | 'hijo' | 'padre' | 'madre' | 'hermano' | 'tomador_titular' | 'otro';
  birth_date?: string;
  phone?: string;
  email?: string;
}

export interface Insurer {
  id: string;
  name: string;
  short_name: string | null;
}

export interface Product {
  id: string;
  name: string;
  category: string | null;
  insurer_id: string | null;
}
