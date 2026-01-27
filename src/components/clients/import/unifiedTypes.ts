import type { DBField } from './types';

// Unified import row structure - policy_number is the unique key
export interface UnifiedImportRow {
  policy_number: string;
  
  // Client (Tomador) data
  client_identification_type?: string;
  client_identification_number: string;
  client_first_name: string;
  client_last_name: string;
  client_email?: string;
  client_phone?: string;
  client_mobile?: string;
  client_address?: string;
  client_city?: string;
  client_province?: string;
  client_birth_date?: string;
  client_occupation?: string;
  client_workplace?: string;
  
  // Policy data
  insurer_name?: string;
  product_name?: string;
  start_date: string;
  end_date: string;
  status?: string;
  premium?: string;
  payment_frequency?: string;
  coverage_amount?: string;
  deductible?: string;
  premium_payment_date?: string;
  policy_notes?: string;
  
  // Beneficiaries (dynamic, extracted from columns)
  beneficiaries: BeneficiaryData[];
}

export interface BeneficiaryData {
  first_name?: string;
  last_name?: string;
  identification_type?: string;
  identification_number?: string;
  relationship?: string;
  birth_date?: string;
  phone?: string;
  email?: string;
}

export interface UnifiedColumnMapping {
  excelColumn: string;
  dbField: string | null;
  beneficiaryIndex: number | null; // null for policy/client fields, 1+ for beneficiary fields
}

export interface ValidatedUnifiedRow {
  policyNumber: string;
  clientData: {
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
  };
  policyData: {
    policy_number: string;
    insurer_name?: string;
    product_name?: string;
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
  beneficiaries: BeneficiaryData[];
  existingClientId?: string;
  existingPolicyId?: string;
  resolvedInsurerId?: string;
  resolvedProductId?: string;
  errors: ValidationError[];
  isValid: boolean;
  isUpdate: boolean; // true if policy already exists
  isNewClient: boolean; // true if client needs to be created
}

export interface ValidationError {
  field: string;
  message: string;
}

export type FieldGroup = 'policy' | 'client' | 'beneficiary';

export interface UnifiedDBField extends DBField {
  group: FieldGroup;
}

// Unified DB fields organized by group
export const UNIFIED_DB_FIELDS: UnifiedDBField[] = [
  // Policy fields (required first)
  { value: 'policy_number', label: 'Número de Póliza', required: true, group: 'policy' },
  { value: 'start_date', label: 'Fecha Inicio', required: true, group: 'policy' },
  { value: 'end_date', label: 'Fecha Renovación', required: true, group: 'policy' },
  { value: 'insurer_name', label: 'Aseguradora', required: false, group: 'policy' },
  { value: 'product_name', label: 'Producto', required: false, group: 'policy' },
  { value: 'status', label: 'Estado Póliza', required: false, group: 'policy' },
  { value: 'premium', label: 'Prima (USD)', required: false, group: 'policy' },
  { value: 'payment_frequency', label: 'Frecuencia de Pago', required: false, group: 'policy' },
  { value: 'coverage_amount', label: 'Suma Asegurada', required: false, group: 'policy' },
  { value: 'deductible', label: 'Deducible', required: false, group: 'policy' },
  { value: 'premium_payment_date', label: 'Fecha Pago Prima', required: false, group: 'policy' },
  { value: 'policy_notes', label: 'Notas Póliza', required: false, group: 'policy' },
  
  // Client (Tomador) fields
  { value: 'client_identification_type', label: 'Tipo ID Tomador', required: false, group: 'client' },
  { value: 'client_identification_number', label: 'Cédula Tomador', required: true, group: 'client' },
  { value: 'client_first_name', label: 'Nombres Tomador', required: true, group: 'client' },
  { value: 'client_last_name', label: 'Apellidos Tomador', required: true, group: 'client' },
  { value: 'client_email', label: 'Email Tomador', required: false, group: 'client' },
  { value: 'client_phone', label: 'Teléfono Tomador', required: false, group: 'client' },
  { value: 'client_mobile', label: 'Móvil Tomador', required: false, group: 'client' },
  { value: 'client_address', label: 'Dirección Tomador', required: false, group: 'client' },
  { value: 'client_city', label: 'Ciudad Tomador', required: false, group: 'client' },
  { value: 'client_province', label: 'Estado Tomador', required: false, group: 'client' },
  { value: 'client_birth_date', label: 'F. Nacimiento Tomador', required: false, group: 'client' },
  { value: 'client_occupation', label: 'Ocupación Tomador', required: false, group: 'client' },
  { value: 'client_workplace', label: 'Trabajo Tomador', required: false, group: 'client' },
  
  // Beneficiary fields (will be used with index)
  { value: 'beneficiary_first_name', label: 'Nombres Beneficiario', required: false, group: 'beneficiary' },
  { value: 'beneficiary_last_name', label: 'Apellidos Beneficiario', required: false, group: 'beneficiary' },
  { value: 'beneficiary_identification_type', label: 'Tipo ID Beneficiario', required: false, group: 'beneficiary' },
  { value: 'beneficiary_identification_number', label: 'Cédula Beneficiario', required: false, group: 'beneficiary' },
  { value: 'beneficiary_relationship', label: 'Parentesco', required: false, group: 'beneficiary' },
  { value: 'beneficiary_birth_date', label: 'F. Nacimiento Beneficiario', required: false, group: 'beneficiary' },
  { value: 'beneficiary_phone', label: 'Teléfono Beneficiario', required: false, group: 'beneficiary' },
  { value: 'beneficiary_email', label: 'Email Beneficiario', required: false, group: 'beneficiary' },
];

// Get fields by group for display
export function getFieldsByGroup(group: FieldGroup): UnifiedDBField[] {
  return UNIFIED_DB_FIELDS.filter(f => f.group === group);
}

// Get required fields
export function getRequiredFields(): UnifiedDBField[] {
  return UNIFIED_DB_FIELDS.filter(f => f.required);
}
