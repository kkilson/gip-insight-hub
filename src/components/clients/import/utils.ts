import * as XLSX from 'xlsx';
import type {
  ParsedRow,
  ColumnMapping,
  ValidatedClient,
  ValidatedPolicy,
  ValidatedBeneficiary,
  ValidationError,
} from './types';
import {
  CLIENT_DB_FIELDS,
  POLICY_DB_FIELDS,
  BENEFICIARY_DB_FIELDS,
  IDENTIFICATION_TYPE_MAP,
  POLICY_STATUS_MAP,
  PAYMENT_FREQUENCY_MAP,
  RELATIONSHIP_MAP,
} from './types';

// Parse date from various formats
export function parseDate(value: string | number | null): string | undefined {
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

// Auto-map columns for clients
export function autoMapClientColumns(headers: string[]): ColumnMapping[] {
  return headers.map((header) => {
    const headerLower = String(header || '').toLowerCase().trim();
    let matchedField: string | null = null;

    if (headerLower.includes('tipo') && headerLower.includes('ident')) matchedField = 'identification_type';
    else if (headerLower.includes('cedula') || headerLower.includes('cédula') || headerLower.includes('rif') || headerLower === 'ci') matchedField = 'identification_number';
    else if (headerLower.includes('numero') && headerLower.includes('ident')) matchedField = 'identification_number';
    else if (headerLower === 'nombre' || headerLower === 'nombres' || headerLower === 'first_name') matchedField = 'first_name';
    else if (headerLower === 'apellido' || headerLower === 'apellidos' || headerLower === 'last_name') matchedField = 'last_name';
    else if (headerLower.includes('email') || headerLower.includes('correo')) matchedField = 'email';
    else if (headerLower.includes('telefono') || headerLower.includes('teléfono') || headerLower === 'phone') matchedField = 'phone';
    else if (headerLower.includes('movil') || headerLower.includes('móvil') || headerLower.includes('celular') || headerLower === 'mobile') matchedField = 'mobile';
    else if (headerLower.includes('direccion') || headerLower.includes('dirección') || headerLower === 'address') matchedField = 'address';
    else if (headerLower === 'ciudad' || headerLower === 'city') matchedField = 'city';
    else if (headerLower === 'estado' || headerLower === 'provincia' || headerLower === 'province') matchedField = 'province';
    else if (headerLower.includes('nacimiento') || headerLower.includes('birth')) matchedField = 'birth_date';
    else if (headerLower.includes('ocupacion') || headerLower.includes('ocupación') || headerLower === 'occupation') matchedField = 'occupation';
    else if (headerLower.includes('trabajo') || headerLower.includes('empresa') || headerLower === 'workplace') matchedField = 'workplace';
    else if (headerLower.includes('nota') || headerLower === 'notes') matchedField = 'notes';

    return { excelColumn: String(header || ''), dbField: matchedField };
  });
}

// Auto-map columns for policies
export function autoMapPolicyColumns(headers: string[]): ColumnMapping[] {
  return headers.map((header) => {
    const headerLower = String(header || '').toLowerCase().trim();
    let matchedField: string | null = null;

    if (headerLower.includes('cedula') || headerLower.includes('cédula') || headerLower.includes('tomador') || headerLower.includes('cliente')) matchedField = 'client_identification';
    else if (headerLower.includes('aseguradora') || headerLower === 'insurer') matchedField = 'insurer_name';
    else if (headerLower.includes('producto') || headerLower === 'product') matchedField = 'product_name';
    else if (headerLower.includes('poliza') || headerLower.includes('póliza') || headerLower === 'policy') matchedField = 'policy_number';
    else if (headerLower.includes('inicio') || headerLower === 'start') matchedField = 'start_date';
    else if (headerLower.includes('fin') || headerLower.includes('renovacion') || headerLower.includes('renovación') || headerLower === 'end') matchedField = 'end_date';
    else if (headerLower === 'estado' || headerLower === 'status') matchedField = 'status';
    else if (headerLower.includes('prima') || headerLower === 'premium') matchedField = 'premium';
    else if (headerLower.includes('frecuencia') || headerLower === 'frequency') matchedField = 'payment_frequency';
    else if (headerLower.includes('suma') || headerLower.includes('coverage')) matchedField = 'coverage_amount';
    else if (headerLower.includes('deducible') || headerLower === 'deductible') matchedField = 'deductible';
    else if (headerLower.includes('pago') && headerLower.includes('prima')) matchedField = 'premium_payment_date';
    else if (headerLower.includes('nota') || headerLower === 'notes') matchedField = 'notes';

    return { excelColumn: String(header || ''), dbField: matchedField };
  });
}

// Auto-map columns for beneficiaries
export function autoMapBeneficiaryColumns(headers: string[]): ColumnMapping[] {
  return headers.map((header) => {
    const headerLower = String(header || '').toLowerCase().trim();
    let matchedField: string | null = null;

    if (headerLower.includes('poliza') || headerLower.includes('póliza') || headerLower === 'policy') matchedField = 'policy_number';
    else if (headerLower === 'nombre' || headerLower === 'nombres' || headerLower === 'first_name') matchedField = 'first_name';
    else if (headerLower === 'apellido' || headerLower === 'apellidos' || headerLower === 'last_name') matchedField = 'last_name';
    else if (headerLower.includes('tipo') && headerLower.includes('ident')) matchedField = 'identification_type';
    else if (headerLower.includes('cedula') || headerLower.includes('cédula') || headerLower.includes('numero') && headerLower.includes('ident')) matchedField = 'identification_number';
    else if (headerLower.includes('parentesco') || headerLower.includes('relacion') || headerLower.includes('relación') || headerLower === 'relationship') matchedField = 'relationship';
    else if (headerLower.includes('porcentaje') || headerLower === 'percentage') matchedField = 'percentage';
    else if (headerLower.includes('nacimiento') || headerLower.includes('birth')) matchedField = 'birth_date';
    else if (headerLower.includes('telefono') || headerLower.includes('teléfono') || headerLower === 'phone') matchedField = 'phone';
    else if (headerLower.includes('email') || headerLower.includes('correo')) matchedField = 'email';

    return { excelColumn: String(header || ''), dbField: matchedField };
  });
}

// Validate client data
export function validateClients(
  rawData: ParsedRow[],
  columnMappings: ColumnMapping[]
): ValidatedClient[] {
  return rawData.map((row, index) => {
    const errors: ValidationError[] = [];
    const data: any = {};

    columnMappings.forEach((mapping) => {
      if (mapping.dbField) {
        let value = row[mapping.excelColumn];
        
        if (value !== null && value !== undefined) {
          value = String(value).trim();
        }
        
        if (mapping.dbField === 'identification_type' && value) {
          const normalized = IDENTIFICATION_TYPE_MAP[String(value).toLowerCase()];
          value = normalized || 'cedula';
        }
        
        if (mapping.dbField === 'birth_date' && value) {
          value = parseDate(value as string);
        }
        
        data[mapping.dbField] = value || undefined;
      }
    });

    if (!data.identification_type) {
      data.identification_type = 'cedula';
    }

    if (!data.identification_number) {
      errors.push({ row: index + 2, field: 'identification_number', message: 'Número de identificación requerido' });
    }
    if (!data.first_name) {
      errors.push({ row: index + 2, field: 'first_name', message: 'Nombres requerido' });
    }
    if (!data.last_name) {
      errors.push({ row: index + 2, field: 'last_name', message: 'Apellidos requerido' });
    }

    if (data.email && !data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push({ row: index + 2, field: 'email', message: 'Formato de correo inválido' });
    }

    return {
      row: index + 2,
      data,
      errors,
      isValid: errors.length === 0,
    };
  });
}

// Validate policy data
export function validatePolicies(
  rawData: ParsedRow[],
  columnMappings: ColumnMapping[],
  existingClients: Array<{ id: string; identification_number: string }>,
  insurers: Array<{ id: string; name: string }>,
  products: Array<{ id: string; name: string; insurer_id: string | null }>
): ValidatedPolicy[] {
  return rawData.map((row, index) => {
    const errors: ValidationError[] = [];
    const data: any = {};
    let resolvedClientId: string | undefined;
    let resolvedInsurerId: string | undefined;
    let resolvedProductId: string | undefined;

    columnMappings.forEach((mapping) => {
      if (mapping.dbField) {
        let value = row[mapping.excelColumn];
        
        if (value !== null && value !== undefined) {
          value = String(value).trim();
        }
        
        if (mapping.dbField === 'status' && value) {
          const normalized = POLICY_STATUS_MAP[String(value).toLowerCase()];
          value = normalized || 'en_tramite';
        }
        
        if (mapping.dbField === 'payment_frequency' && value) {
          const normalized = PAYMENT_FREQUENCY_MAP[String(value).toLowerCase()];
          value = normalized || 'mensual';
        }
        
        if (['start_date', 'end_date', 'premium_payment_date'].includes(mapping.dbField) && value) {
          value = parseDate(value as string);
        }
        
        data[mapping.dbField] = value || undefined;
      }
    });

    // Resolve client
    if (data.client_identification) {
      const client = existingClients.find(
        c => c.identification_number.toLowerCase() === String(data.client_identification).toLowerCase().replace(/[^a-z0-9]/gi, '')
      );
      if (client) {
        resolvedClientId = client.id;
      } else {
        errors.push({ row: index + 2, field: 'client_identification', message: `Tomador no encontrado: ${data.client_identification}` });
      }
    } else {
      errors.push({ row: index + 2, field: 'client_identification', message: 'Cédula del tomador requerida' });
    }

    // Resolve insurer
    if (data.insurer_name) {
      const insurer = insurers.find(
        i => i.name.toLowerCase().includes(String(data.insurer_name).toLowerCase()) ||
             String(data.insurer_name).toLowerCase().includes(i.name.toLowerCase())
      );
      if (insurer) {
        resolvedInsurerId = insurer.id;
      }
    }

    // Resolve product
    if (data.product_name && resolvedInsurerId) {
      const product = products.find(
        p => p.insurer_id === resolvedInsurerId &&
             (p.name.toLowerCase().includes(String(data.product_name).toLowerCase()) ||
              String(data.product_name).toLowerCase().includes(p.name.toLowerCase()))
      );
      if (product) {
        resolvedProductId = product.id;
      }
    }

    if (!data.start_date) {
      errors.push({ row: index + 2, field: 'start_date', message: 'Fecha de inicio requerida' });
    }
    if (!data.end_date) {
      errors.push({ row: index + 2, field: 'end_date', message: 'Fecha de renovación requerida' });
    }

    return {
      row: index + 2,
      data,
      errors,
      isValid: errors.length === 0,
      resolvedClientId,
      resolvedInsurerId,
      resolvedProductId,
    };
  });
}

// Validate beneficiary data
export function validateBeneficiaries(
  rawData: ParsedRow[],
  columnMappings: ColumnMapping[],
  existingPolicies: Array<{ id: string; policy_number: string | null }>
): ValidatedBeneficiary[] {
  return rawData.map((row, index) => {
    const errors: ValidationError[] = [];
    const data: any = {};
    let resolvedPolicyId: string | undefined;

    columnMappings.forEach((mapping) => {
      if (mapping.dbField) {
        let value = row[mapping.excelColumn];
        
        if (value !== null && value !== undefined) {
          value = String(value).trim();
        }
        
        if (mapping.dbField === 'identification_type' && value) {
          const normalized = IDENTIFICATION_TYPE_MAP[String(value).toLowerCase()];
          value = normalized || 'cedula';
        }
        
        if (mapping.dbField === 'relationship' && value) {
          const normalized = RELATIONSHIP_MAP[String(value).toLowerCase()];
          value = normalized || 'otro';
        }
        
        if (mapping.dbField === 'birth_date' && value) {
          value = parseDate(value as string);
        }
        
        data[mapping.dbField] = value || undefined;
      }
    });

    // Resolve policy
    if (data.policy_number) {
      const policy = existingPolicies.find(
        p => p.policy_number?.toLowerCase() === String(data.policy_number).toLowerCase()
      );
      if (policy) {
        resolvedPolicyId = policy.id;
      } else {
        errors.push({ row: index + 2, field: 'policy_number', message: `Póliza no encontrada: ${data.policy_number}` });
      }
    } else {
      errors.push({ row: index + 2, field: 'policy_number', message: 'Número de póliza requerido' });
    }

    if (!data.first_name) {
      errors.push({ row: index + 2, field: 'first_name', message: 'Nombres requerido' });
    }
    if (!data.last_name) {
      errors.push({ row: index + 2, field: 'last_name', message: 'Apellidos requerido' });
    }
    if (!data.relationship) {
      errors.push({ row: index + 2, field: 'relationship', message: 'Parentesco requerido' });
    }

    if (data.email && !data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push({ row: index + 2, field: 'email', message: 'Formato de correo inválido' });
    }

    return {
      row: index + 2,
      data,
      errors,
      isValid: errors.length === 0,
      resolvedPolicyId,
    };
  });
}

// Check required fields are mapped
export function checkRequiredFieldsMapped(
  columnMappings: ColumnMapping[],
  entityType: 'client' | 'policy' | 'beneficiary'
): boolean {
  const fields = entityType === 'client' 
    ? CLIENT_DB_FIELDS 
    : entityType === 'policy' 
      ? POLICY_DB_FIELDS 
      : BENEFICIARY_DB_FIELDS;

  return fields.filter((f) => f.required).every((f) =>
    columnMappings.some((m) => m.dbField === f.value)
  );
}

// Generate template for each entity type
export function downloadTemplate(entityType: 'client' | 'policy' | 'beneficiary') {
  let templateData: string[][];
  let filename: string;

  if (entityType === 'client') {
    templateData = [
      ['Tipo Identificación', 'Número Identificación', 'Nombres', 'Apellidos', 'Correo', 'Teléfono', 'Móvil', 'Dirección', 'Ciudad', 'Estado', 'Fecha Nacimiento', 'Ocupación', 'Lugar de Trabajo', 'Notas'],
      ['cedula', 'V-12345678', 'Juan', 'Pérez', 'juan@ejemplo.com', '0212-1234567', '0412-1234567', 'Av. Principal 123', 'Caracas', 'Distrito Capital', '1990-01-15', 'Ingeniero', 'Empresa XYZ', 'Cliente VIP'],
    ];
    filename = 'plantilla_tomadores.xlsx';
  } else if (entityType === 'policy') {
    templateData = [
      ['Cédula Tomador', 'Aseguradora', 'Producto', 'Número Póliza', 'Fecha Inicio', 'Fecha Renovación', 'Estado', 'Prima', 'Frecuencia Pago', 'Suma Asegurada', 'Deducible', 'Fecha Pago Prima', 'Notas'],
      ['V-12345678', 'Mercantil Venezuela', 'GLOBAL BENEFITS PREMIUM', 'POL-2024-001', '2024-01-01', '2025-01-01', 'vigente', '1500.00', 'mensual', '100000.00', '500.00', '2024-02-01', 'Póliza familiar'],
    ];
    filename = 'plantilla_polizas.xlsx';
  } else {
    templateData = [
      ['Número Póliza', 'Nombres', 'Apellidos', 'Tipo Identificación', 'Número Identificación', 'Parentesco', 'Porcentaje', 'Fecha Nacimiento', 'Teléfono', 'Correo'],
      ['POL-2024-001', 'María', 'Pérez', 'cedula', 'V-87654321', 'conyuge', '50', '1992-05-20', '0414-9876543', 'maria@ejemplo.com'],
    ];
    filename = 'plantilla_beneficiarios.xlsx';
  }

  const ws = XLSX.utils.aoa_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, entityType === 'client' ? 'Tomadores' : entityType === 'policy' ? 'Pólizas' : 'Beneficiarios');
  XLSX.writeFile(wb, filename);
}
