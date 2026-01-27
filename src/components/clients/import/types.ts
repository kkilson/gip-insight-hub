export interface ParsedRow {
  [key: string]: string | number | null;
}

export interface ColumnMapping {
  excelColumn: string;
  dbField: string | null;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

// Client types
export interface ValidatedClient {
  row: number;
  data: {
    identification_type: string;
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
  };
  errors: ValidationError[];
  isValid: boolean;
}

// Policy types
export interface ValidatedPolicy {
  row: number;
  data: {
    client_identification: string;
    insurer_name?: string;
    product_name?: string;
    policy_number?: string;
    start_date: string;
    end_date: string;
    status?: string;
    premium?: string;
    payment_frequency?: string;
    coverage_amount?: string;
    deductible?: string;
    premium_payment_date?: string;
    notes?: string;
  };
  errors: ValidationError[];
  isValid: boolean;
  resolvedClientId?: string;
  resolvedInsurerId?: string;
  resolvedProductId?: string;
}

// Beneficiary types
export interface ValidatedBeneficiary {
  row: number;
  data: {
    policy_number: string;
    first_name: string;
    last_name: string;
    identification_type?: string;
    identification_number?: string;
    relationship: string;
    percentage?: string;
    birth_date?: string;
    phone?: string;
    email?: string;
  };
  errors: ValidationError[];
  isValid: boolean;
  resolvedPolicyId?: string;
}

export interface DBField {
  value: string;
  label: string;
  required: boolean;
}

export interface ImportSection {
  id: 'client' | 'policy' | 'beneficiary';
  name: string;
  description: string;
  icon: string;
}

export const CLIENT_DB_FIELDS: DBField[] = [
  { value: 'identification_type', label: 'Tipo de identificación', required: true },
  { value: 'identification_number', label: 'Número de identificación', required: true },
  { value: 'first_name', label: 'Nombres', required: true },
  { value: 'last_name', label: 'Apellidos', required: true },
  { value: 'email', label: 'Correo electrónico', required: false },
  { value: 'phone', label: 'Teléfono fijo', required: false },
  { value: 'mobile', label: 'Teléfono móvil', required: false },
  { value: 'address', label: 'Dirección', required: false },
  { value: 'city', label: 'Ciudad', required: false },
  { value: 'province', label: 'Estado', required: false },
  { value: 'birth_date', label: 'Fecha de nacimiento', required: false },
  { value: 'occupation', label: 'Ocupación', required: false },
  { value: 'workplace', label: 'Lugar de trabajo', required: false },
  { value: 'notes', label: 'Notas', required: false },
];

export const POLICY_DB_FIELDS: DBField[] = [
  { value: 'client_identification', label: 'Cédula del tomador', required: true },
  { value: 'insurer_name', label: 'Aseguradora', required: false },
  { value: 'product_name', label: 'Producto', required: false },
  { value: 'policy_number', label: 'Número de póliza', required: false },
  { value: 'start_date', label: 'Fecha de inicio', required: true },
  { value: 'end_date', label: 'Fecha de renovación', required: true },
  { value: 'status', label: 'Estado', required: false },
  { value: 'premium', label: 'Prima (USD)', required: false },
  { value: 'payment_frequency', label: 'Frecuencia de pago', required: false },
  { value: 'coverage_amount', label: 'Suma asegurada', required: false },
  { value: 'deductible', label: 'Deducible', required: false },
  { value: 'premium_payment_date', label: 'Fecha pago prima', required: false },
  { value: 'notes', label: 'Notas', required: false },
];

export const BENEFICIARY_DB_FIELDS: DBField[] = [
  { value: 'policy_number', label: 'Número de póliza', required: true },
  { value: 'first_name', label: 'Nombres', required: true },
  { value: 'last_name', label: 'Apellidos', required: true },
  { value: 'identification_type', label: 'Tipo identificación', required: false },
  { value: 'identification_number', label: 'Número identificación', required: false },
  { value: 'relationship', label: 'Parentesco', required: true },
  { value: 'percentage', label: 'Porcentaje', required: false },
  { value: 'birth_date', label: 'Fecha nacimiento', required: false },
  { value: 'phone', label: 'Teléfono', required: false },
  { value: 'email', label: 'Correo', required: false },
];

export const IDENTIFICATION_TYPE_MAP: Record<string, string> = {
  'cedula': 'cedula',
  'cédula': 'cedula',
  'ci': 'cedula',
  'pasaporte': 'pasaporte',
  'passport': 'pasaporte',
  'rif': 'rif',
  'otro': 'otro',
  'other': 'otro',
};

export const POLICY_STATUS_MAP: Record<string, string> = {
  'vigente': 'vigente',
  'activa': 'vigente',
  'active': 'vigente',
  'pendiente': 'pendiente',
  'pending': 'pendiente',
  'cancelada': 'cancelada',
  'cancelled': 'cancelada',
  'vencida': 'vencida',
  'expired': 'vencida',
  'en tramite': 'en_tramite',
  'en trámite': 'en_tramite',
  'tramite': 'en_tramite',
};

export const PAYMENT_FREQUENCY_MAP: Record<string, string> = {
  'mensual': 'mensual',
  'monthly': 'mensual',
  'mensual 10 cuotas': 'mensual_10_cuotas',
  '10 cuotas': 'mensual_10_cuotas',
  'mensual 12 cuotas': 'mensual_12_cuotas',
  '12 cuotas': 'mensual_12_cuotas',
  'bimensual': 'bimensual',
  'bimonthly': 'bimensual',
  'trimestral': 'trimestral',
  'quarterly': 'trimestral',
  'semestral': 'semestral',
  'semiannual': 'semestral',
  'anual': 'anual',
  'annual': 'anual',
  'yearly': 'anual',
};

export const RELATIONSHIP_MAP: Record<string, string> = {
  'conyuge': 'conyuge',
  'cónyuge': 'conyuge',
  'esposo': 'conyuge',
  'esposa': 'conyuge',
  'spouse': 'conyuge',
  'hijo': 'hijo',
  'hija': 'hijo',
  'child': 'hijo',
  'son': 'hijo',
  'daughter': 'hijo',
  'padre': 'padre',
  'father': 'padre',
  'madre': 'madre',
  'mother': 'madre',
  'hermano': 'hermano',
  'hermana': 'hermano',
  'sibling': 'hermano',
  'brother': 'hermano',
  'sister': 'hermano',
  'tomador': 'tomador_titular',
  'titular': 'tomador_titular',
  'tomador y titular': 'tomador_titular',
  'otro': 'otro',
  'other': 'otro',
};
