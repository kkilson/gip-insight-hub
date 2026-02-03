import * as XLSX from 'xlsx';
import type { ParsedRow } from './types';
import {
  IDENTIFICATION_TYPE_MAP,
  POLICY_STATUS_MAP,
  PAYMENT_FREQUENCY_MAP,
  RELATIONSHIP_MAP,
} from './types';
import type {
  UnifiedColumnMapping,
  ValidatedUnifiedRow,
  BeneficiaryData,
  ValidationError,
} from './unifiedTypes';
import { UNIFIED_DB_FIELDS } from './unifiedTypes';

// Parse date from various formats
function parseDate(value: string | number | null): string | undefined {
  if (!value) return undefined;
  
  const dateValue = String(value);
  
  if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateValue;
  } else if (dateValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const parts = dateValue.split('/');
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  } else if (dateValue.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
    const parts = dateValue.split('-');
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  } else if (!isNaN(Number(dateValue))) {
    // Excel date serial number
    const excelDate = XLSX.SSF.parse_date_code(Number(dateValue));
    if (excelDate) {
      return `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
    }
  }
  
  return undefined;
}

// Auto-map unified columns with beneficiary index detection
export function autoMapUnifiedColumns(headers: string[]): UnifiedColumnMapping[] {
  return headers.map((header) => {
    const h = String(header || '').toLowerCase().trim();
    
    // Detect beneficiary index in header (e.g., "Nombre Beneficiario 1", "Ben. 2 Apellido")
    const beneficiaryMatch = h.match(/beneficiario\s*(\d+)|ben\.?\s*(\d+)/);
    const beneficiaryIndex = beneficiaryMatch 
      ? parseInt(beneficiaryMatch[1] || beneficiaryMatch[2]) 
      : null;
    
    // Also check for numbered suffix pattern (e.g., "Nombre 1", "Parentesco 2")
    const numberedSuffix = h.match(/(\d+)$/);
    const potentialBenIndex = numberedSuffix ? parseInt(numberedSuffix[1]) : null;
    
    let dbField: string | null = null;
    let detectedBenIndex = beneficiaryIndex;
    
    // Policy fields
    if ((h.includes('poliza') || h.includes('póliza')) && (h.includes('numero') || h.includes('número') || h === 'poliza' || h === 'póliza')) {
      dbField = 'policy_number';
    } else if (h.includes('aseguradora') || h === 'insurer') {
      dbField = 'insurer_name';
    } else if (h.includes('producto') && !h.includes('tomador') && !h.includes('beneficiario')) {
      dbField = 'product_name';
    } else if ((h.includes('inicio') || h === 'start' || h === 'fecha inicio') && !h.includes('tomador')) {
      dbField = 'start_date';
    } else if ((h.includes('fin') || h.includes('renovacion') || h.includes('renovación') || h.includes('vencimiento')) && !h.includes('tomador')) {
      dbField = 'end_date';
    } else if ((h === 'estado' || h === 'status') && !h.includes('tomador')) {
      dbField = 'status';
    } else if ((h.includes('prima') || h === 'premium') && !h.includes('pago')) {
      dbField = 'premium';
    } else if (h.includes('frecuencia') || h === 'frequency') {
      dbField = 'payment_frequency';
    } else if (h.includes('suma') || h.includes('cobertura') || h.includes('coverage')) {
      dbField = 'coverage_amount';
    } else if (h.includes('deducible') || h === 'deductible') {
      dbField = 'deductible';
    } else if ((h.includes('fecha') && h.includes('pago')) || h.includes('pago prima') || h.includes('proximo pago') || h.includes('próximo pago')) {
      dbField = 'premium_payment_date';
    } else if ((h.includes('nota') && h.includes('poliza')) || h === 'notas póliza') {
      dbField = 'policy_notes';
    } else if (h.includes('asesor') && (h.includes('principal') || h.includes('1') || (!h.includes('secundario') && !h.includes('2')))) {
      dbField = 'primary_advisor_name';
    } else if (h.includes('asesor') && (h.includes('secundario') || h.includes('2'))) {
      dbField = 'secondary_advisor_name';
    }
    
    // Client (Tomador) fields - check for "tomador" or "cliente" keyword
    else if (h.includes('tomador') || h.includes('cliente')) {
      if (h.includes('tipo') && h.includes('id')) {
        dbField = 'client_identification_type';
      } else if (h.includes('cedula') || h.includes('cédula') || h.includes('identificacion') || h.includes('identificación')) {
        dbField = 'client_identification_number';
      } else if (h.includes('nombre') && !h.includes('apellido')) {
        dbField = 'client_first_name';
      } else if (h.includes('apellido')) {
        dbField = 'client_last_name';
      } else if (h.includes('email') || h.includes('correo')) {
        dbField = 'client_email';
      } else if (h.includes('telefono') || h.includes('teléfono')) {
        if (h.includes('movil') || h.includes('móvil') || h.includes('celular')) {
          dbField = 'client_mobile';
        } else {
          dbField = 'client_phone';
        }
      } else if (h.includes('direccion') || h.includes('dirección')) {
        dbField = 'client_address';
      } else if (h.includes('ciudad')) {
        dbField = 'client_city';
      } else if (h.includes('estado') || h.includes('provincia')) {
        dbField = 'client_province';
      } else if (h.includes('nacimiento')) {
        dbField = 'client_birth_date';
      } else if (h.includes('ocupacion') || h.includes('ocupación')) {
        dbField = 'client_occupation';
      } else if (h.includes('trabajo') || h.includes('empresa')) {
        dbField = 'client_workplace';
      }
    }
    
    // Beneficiary fields - detected by "beneficiario" keyword or pattern (supports 1-7)
    else if (beneficiaryIndex !== null || h.includes('beneficiario') || h.includes('ben.') || h.includes('ben ')) {
      detectedBenIndex = beneficiaryIndex || potentialBenIndex || 1;
      // Clamp to max 7 beneficiaries
      if (detectedBenIndex > 7) detectedBenIndex = 7;
      
      if (h.includes('nombre') && !h.includes('apellido')) {
        dbField = 'beneficiary_first_name';
      } else if (h.includes('apellido')) {
        dbField = 'beneficiary_last_name';
      } else if (h.includes('tipo') && h.includes('id')) {
        dbField = 'beneficiary_identification_type';
      } else if (h.includes('cedula') || h.includes('cédula') || h.includes('identificacion')) {
        dbField = 'beneficiary_identification_number';
      } else if (h.includes('parentesco') || h.includes('relacion') || h.includes('relación')) {
        dbField = 'beneficiary_relationship';
      } else if (h.includes('nacimiento') || h.includes('f.nac') || h.includes('fnac')) {
        dbField = 'beneficiary_birth_date';
      } else if (h.includes('telefono') || h.includes('teléfono') || h.includes('tel ') || h.includes('tel.')) {
        dbField = 'beneficiary_phone';
      } else if (h.includes('email') || h.includes('correo') || h.includes('mail')) {
        dbField = 'beneficiary_email';
      }
    }
    
    // Fallback patterns for common unlabeled columns
    else if ((h.includes('cedula') || h.includes('cédula')) && !h.includes('ben')) {
      dbField = 'client_identification_number';
    } else if (h === 'nombres' || h === 'nombre') {
      // Could be client or beneficiary - default to client if no beneficiary indicator
      dbField = 'client_first_name';
    } else if (h === 'apellidos' || h === 'apellido') {
      dbField = 'client_last_name';
    }
    
    return { 
      excelColumn: String(header || ''), 
      dbField, 
      beneficiaryIndex: dbField?.startsWith('beneficiary_') ? (detectedBenIndex || 1) : null 
    };
  });
}

// Extract field value from row using mappings
function extractField(
  row: ParsedRow,
  mappings: UnifiedColumnMapping[],
  fieldName: string
): string | null {
  const mapping = mappings.find(m => m.dbField === fieldName && m.beneficiaryIndex === null);
  if (!mapping) return null;
  
  const value = row[mapping.excelColumn];
  return value !== null && value !== undefined ? String(value).trim() : null;
}

// Extract client data from row
function extractClientData(
  row: ParsedRow,
  mappings: UnifiedColumnMapping[]
): ValidatedUnifiedRow['clientData'] {
  const idType = extractField(row, mappings, 'client_identification_type');
  const normalizedIdType = idType ? (IDENTIFICATION_TYPE_MAP[idType.toLowerCase()] || 'cedula') : 'cedula';
  
  return {
    identification_type: normalizedIdType,
    identification_number: extractField(row, mappings, 'client_identification_number') || '',
    first_name: extractField(row, mappings, 'client_first_name') || '',
    last_name: extractField(row, mappings, 'client_last_name') || '',
    email: extractField(row, mappings, 'client_email') || undefined,
    phone: extractField(row, mappings, 'client_phone') || undefined,
    mobile: extractField(row, mappings, 'client_mobile') || undefined,
    address: extractField(row, mappings, 'client_address') || undefined,
    city: extractField(row, mappings, 'client_city') || undefined,
    province: extractField(row, mappings, 'client_province') || undefined,
    birth_date: parseDate(extractField(row, mappings, 'client_birth_date')),
    occupation: extractField(row, mappings, 'client_occupation') || undefined,
    workplace: extractField(row, mappings, 'client_workplace') || undefined,
  };
}

// Extract policy data from row
function extractPolicyData(
  row: ParsedRow,
  mappings: UnifiedColumnMapping[]
): ValidatedUnifiedRow['policyData'] {
  const status = extractField(row, mappings, 'status');
  const normalizedStatus = status ? (POLICY_STATUS_MAP[status.toLowerCase()] || 'en_tramite') : 'en_tramite';
  
  const frequency = extractField(row, mappings, 'payment_frequency');
  const normalizedFrequency = frequency ? (PAYMENT_FREQUENCY_MAP[frequency.toLowerCase()] || 'mensual') : 'mensual';
  
  return {
    policy_number: extractField(row, mappings, 'policy_number') || '',
    insurer_name: extractField(row, mappings, 'insurer_name') || undefined,
    product_name: extractField(row, mappings, 'product_name') || undefined,
    start_date: parseDate(extractField(row, mappings, 'start_date')) || '',
    end_date: parseDate(extractField(row, mappings, 'end_date')) || '',
    status: normalizedStatus,
    premium: extractField(row, mappings, 'premium') || undefined,
    payment_frequency: normalizedFrequency,
    coverage_amount: extractField(row, mappings, 'coverage_amount') || undefined,
    deductible: extractField(row, mappings, 'deductible') || undefined,
    premium_payment_date: parseDate(extractField(row, mappings, 'premium_payment_date')),
    notes: extractField(row, mappings, 'policy_notes') || undefined,
    primary_advisor_name: extractField(row, mappings, 'primary_advisor_name') || undefined,
    secondary_advisor_name: extractField(row, mappings, 'secondary_advisor_name') || undefined,
  };
}

// Extract beneficiaries from row (supports multiple beneficiaries per row)
function extractBeneficiaries(
  row: ParsedRow,
  mappings: UnifiedColumnMapping[]
): BeneficiaryData[] {
  // Group mappings by beneficiary index
  const beneficiaryMappings = new Map<number, UnifiedColumnMapping[]>();
  
  mappings.forEach(m => {
    if (m.beneficiaryIndex !== null && m.dbField?.startsWith('beneficiary_')) {
      const existing = beneficiaryMappings.get(m.beneficiaryIndex) || [];
      existing.push(m);
      beneficiaryMappings.set(m.beneficiaryIndex, existing);
    }
  });
  
  const beneficiaries: BeneficiaryData[] = [];
  
  beneficiaryMappings.forEach((benMappings, _index) => {
    const getValue = (fieldName: string): string | undefined => {
      const mapping = benMappings.find(m => m.dbField === fieldName);
      if (!mapping) return undefined;
      const value = row[mapping.excelColumn];
      return value !== null && value !== undefined ? String(value).trim() : undefined;
    };
    
    const firstName = getValue('beneficiary_first_name');
    const lastName = getValue('beneficiary_last_name');
    
    // Only add if at least name is provided
    if (firstName || lastName) {
      const relationship = getValue('beneficiary_relationship');
      const normalizedRelationship = relationship 
        ? (RELATIONSHIP_MAP[relationship.toLowerCase()] || 'otro') 
        : 'otro';
      
      const idType = getValue('beneficiary_identification_type');
      const normalizedIdType = idType ? (IDENTIFICATION_TYPE_MAP[idType.toLowerCase()] || 'cedula') : 'cedula';
      
      beneficiaries.push({
        first_name: firstName || '',
        last_name: lastName || '',
        identification_type: normalizedIdType,
        identification_number: getValue('beneficiary_identification_number'),
        relationship: normalizedRelationship,
        birth_date: parseDate(getValue('beneficiary_birth_date') || null),
        phone: getValue('beneficiary_phone'),
        email: getValue('beneficiary_email'),
      });
    }
  });
  
  return beneficiaries;
}

// Validate unified import data
export function validateUnifiedImport(
  rawData: ParsedRow[],
  columnMappings: UnifiedColumnMapping[],
  existingClients: Array<{ id: string; identification_number: string }>,
  existingPolicies: Array<{ id: string; policy_number: string | null }>,
  insurers: Array<{ id: string; name: string }>,
  products: Array<{ id: string; name: string; insurer_id: string | null }>,
  advisors: Array<{ id: string; full_name: string; is_active: boolean | null }> = []
): ValidatedUnifiedRow[] {
  // Group rows by policy number
  const groupedByPolicy = new Map<string, ParsedRow[]>();
  
  rawData.forEach(row => {
    const policyNumber = extractField(row, columnMappings, 'policy_number');
    if (policyNumber) {
      const normalizedKey = policyNumber.toLowerCase().trim();
      const existing = groupedByPolicy.get(normalizedKey) || [];
      existing.push(row);
      groupedByPolicy.set(normalizedKey, existing);
    }
  });
  
  // Validate each policy group
  const validatedRows: ValidatedUnifiedRow[] = [];
  
  groupedByPolicy.forEach((rows, policyKey) => {
    const errors: ValidationError[] = [];
    const firstRow = rows[0];
    
    // Extract data from first row
    const clientData = extractClientData(firstRow, columnMappings);
    const policyData = extractPolicyData(firstRow, columnMappings);
    
    // Collect beneficiaries from all rows with this policy number
    const allBeneficiaries: BeneficiaryData[] = [];
    rows.forEach(row => {
      const rowBeneficiaries = extractBeneficiaries(row, columnMappings);
      allBeneficiaries.push(...rowBeneficiaries);
    });
    
    // Filter valid beneficiaries (must have at least first_name or last_name)
    const validBeneficiaries = allBeneficiaries.filter(b => b.first_name || b.last_name);
    
    // Check existing client
    const normalizedClientId = clientData.identification_number.toLowerCase().replace(/[^a-z0-9]/gi, '');
    const existingClient = existingClients.find(
      c => c.identification_number.toLowerCase().replace(/[^a-z0-9]/gi, '') === normalizedClientId
    );
    
    // Check existing policy
    const existingPolicy = existingPolicies.find(
      p => p.policy_number?.toLowerCase() === policyKey
    );
    
    // Resolve insurer
    let resolvedInsurerId: string | undefined;
    if (policyData.insurer_name) {
      const insurer = insurers.find(
        i => i.name.toLowerCase().includes(policyData.insurer_name!.toLowerCase()) ||
             policyData.insurer_name!.toLowerCase().includes(i.name.toLowerCase())
      );
      if (insurer) {
        resolvedInsurerId = insurer.id;
      }
    }
    
    // Resolve product
    let resolvedProductId: string | undefined;
    if (policyData.product_name && resolvedInsurerId) {
      const product = products.find(
        p => p.insurer_id === resolvedInsurerId &&
             (p.name.toLowerCase().includes(policyData.product_name!.toLowerCase()) ||
              policyData.product_name!.toLowerCase().includes(p.name.toLowerCase()))
      );
      if (product) {
        resolvedProductId = product.id;
      }
    }
    
    // Resolve advisors
    let resolvedPrimaryAdvisorId: string | undefined;
    let resolvedSecondaryAdvisorId: string | undefined;
    
    if (policyData.primary_advisor_name && advisors.length > 0) {
      const primaryAdvisor = advisors.find(a => 
        a.is_active && 
        a.full_name.toLowerCase().includes(policyData.primary_advisor_name!.toLowerCase())
      );
      if (primaryAdvisor) {
        resolvedPrimaryAdvisorId = primaryAdvisor.id;
      }
    }
    
    if (policyData.secondary_advisor_name && advisors.length > 0) {
      const secondaryAdvisor = advisors.find(a => 
        a.is_active && 
        a.full_name.toLowerCase().includes(policyData.secondary_advisor_name!.toLowerCase())
      );
      if (secondaryAdvisor) {
        resolvedSecondaryAdvisorId = secondaryAdvisor.id;
      }
    }
    
    // Validate required fields
    if (!policyData.policy_number) {
      errors.push({ field: 'policy_number', message: 'Número de póliza requerido' });
    }
    if (!clientData.identification_number) {
      errors.push({ field: 'client_identification_number', message: 'Cédula del tomador requerida' });
    }
    if (!clientData.first_name) {
      errors.push({ field: 'client_first_name', message: 'Nombres del tomador requerido' });
    }
    if (!clientData.last_name) {
      errors.push({ field: 'client_last_name', message: 'Apellidos del tomador requerido' });
    }
    if (!policyData.start_date) {
      errors.push({ field: 'start_date', message: 'Fecha de inicio requerida' });
    }
    if (!policyData.end_date) {
      errors.push({ field: 'end_date', message: 'Fecha de renovación requerida' });
    }
    
    // Validate email format
    if (clientData.email && !clientData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push({ field: 'client_email', message: 'Formato de correo del tomador inválido' });
    }
    
    // Validate beneficiary emails
    validBeneficiaries.forEach((ben, idx) => {
      if (ben.email && !ben.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        errors.push({ field: `beneficiary_${idx + 1}_email`, message: `Correo del beneficiario ${idx + 1} inválido` });
      }
    });
    
    validatedRows.push({
      policyNumber: policyData.policy_number,
      clientData,
      policyData,
      beneficiaries: validBeneficiaries,
      existingClientId: existingClient?.id,
      existingPolicyId: existingPolicy?.id,
      resolvedInsurerId,
      resolvedProductId,
      resolvedPrimaryAdvisorId,
      resolvedSecondaryAdvisorId,
      errors,
      isValid: errors.length === 0,
      isUpdate: !!existingPolicy,
      isNewClient: !existingClient,
    });
  });
  
  return validatedRows;
}

// Check if required fields are mapped
export function checkUnifiedRequiredFieldsMapped(
  columnMappings: UnifiedColumnMapping[]
): boolean {
  const requiredFields = UNIFIED_DB_FIELDS.filter(f => f.required).map(f => f.value);
  
  return requiredFields.every(field =>
    columnMappings.some(m => m.dbField === field)
  );
}

// Download unified template with all 7 beneficiaries
export function downloadUnifiedTemplate() {
  // Build headers with all fields including advisors
  const baseHeaders = [
    // Policy fields
    'Número Póliza', 'Aseguradora', 'Producto', 'Fecha Inicio', 'Fecha Fin', 
    'Prima', 'Suma Asegurada', 'Deducible', 'Estado', 'Frecuencia Pago', 'Fecha Pago Prima',
    'Asesor Principal', 'Asesor Secundario', 'Notas Póliza',
    // Client (Tomador) fields
    'Tipo ID Tomador', 'Cédula Tomador', 'Nombres Tomador', 'Apellidos Tomador', 
    'Email Tomador', 'Teléfono Tomador', 'Móvil Tomador',
    'Dirección Tomador', 'Ciudad Tomador', 'Estado Tomador',
    'F. Nacimiento Tomador', 'Ocupación Tomador', 'Trabajo Tomador',
  ];
  
  // Add beneficiary columns (7 beneficiaries with all fields)
  const beneficiaryHeaders: string[] = [];
  for (let i = 1; i <= 7; i++) {
    beneficiaryHeaders.push(
      `Nombre Ben. ${i}`, `Apellido Ben. ${i}`, `Parentesco ${i}`, 
      `Tipo ID Ben. ${i}`, `Cédula Ben. ${i}`, `F.Nac Ben. ${i}`, `Tel Ben. ${i}`, `Email Ben. ${i}`
    );
  }
  
  const headers = [...baseHeaders, ...beneficiaryHeaders];
  
  // Sample data row 1
  const row1 = [
    // Policy
    'POL-2024-001', 'Mercantil Venezuela', 'GLOBAL BENEFITS PREMIUM', '2024-01-01', '2025-01-01', 
    '1500', '50000', '500', 'vigente', 'mensual', '2024-02-01',
    'MARIA GABRIELA ESTABA', '', 'Cliente corporativo',
    // Client
    'cedula', 'V-12345678', 'Juan', 'Pérez', 
    'juan@email.com', '0212-1234567', '0412-1234567',
    'Av. Principal, Edificio 123', 'Caracas', 'Distrito Capital',
    '1985-06-15', 'Gerente', 'Empresa ABC',
    // Ben 1
    'María', 'Pérez', 'conyuge', 'cedula', 'V-87654321', '1985-05-15', '0414-1111111', 'maria@email.com',
    // Ben 2
    'Carlos', 'Pérez', 'hijo', 'cedula', 'V-11111111', '2010-03-20', '0412-2222222', '',
    // Ben 3-7 empty
    ...Array(40).fill(''),
  ];
  
  // Sample data row 2
  const row2 = [
    // Policy
    'POL-2024-002', 'BMI', 'AZURE', '2024-02-01', '2025-02-01', 
    '2000', '100000', '1000', 'vigente', 'anual', '2024-03-01',
    'LORENE BARANI', 'PAOLA BARANI', '',
    // Client
    'cedula', 'V-22222222', 'Ana', 'García', 
    'ana@email.com', '0212-9876543', '0414-9876543',
    'Calle 45, Qta. Azul', 'Valencia', 'Carabobo',
    '1990-11-20', 'Ingeniero', 'Constructora XYZ',
    // Ben 1
    'Pedro', 'García', 'conyuge', 'cedula', 'V-33333333', '1980-11-10', '0424-3333333', 'pedro@email.com',
    // Ben 2-7 empty
    ...Array(48).fill(''),
  ];

  const templateData = [headers, row1, row2];

  const ws = XLSX.utils.aoa_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Importación');
  XLSX.writeFile(wb, 'plantilla_importacion_completa.xlsx');
}

// Get detected beneficiary indices from mappings
export function getDetectedBeneficiaryCount(mappings: UnifiedColumnMapping[]): number {
  const indices = new Set<number>();
  mappings.forEach(m => {
    if (m.beneficiaryIndex !== null) {
      indices.add(m.beneficiaryIndex);
    }
  });
  return indices.size;
}
