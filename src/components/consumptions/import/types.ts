import * as XLSX from 'xlsx';

export interface ConsumptionImportRow {
  policy_number: string;
  beneficiary_name?: string;
  usage_type: string;
  usage_date: string;
  description: string;
  amount_bs?: number | null;
  amount_usd?: number | null;
}

export interface ConsumptionColumnMapping {
  excelColumn: string;
  dbField: string | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidatedConsumptionRow {
  rowIndex: number;
  data: {
    policy_id: string;
    policy_number: string;
    beneficiary_name: string | null;
    usage_type_id: string;
    usage_type_name: string;
    usage_date: string;
    description: string;
    amount_bs: number | null;
    amount_usd: number | null;
  };
  errors: ValidationError[];
  isValid: boolean;
}

export interface ConsumptionDBField {
  value: string;
  label: string;
  required: boolean;
}

export const CONSUMPTION_DB_FIELDS: ConsumptionDBField[] = [
  { value: 'policy_number', label: 'Número de Póliza', required: true },
  { value: 'usage_type', label: 'Tipo de Uso', required: true },
  { value: 'usage_date', label: 'Fecha de Uso', required: true },
  { value: 'description', label: 'Descripción', required: true },
  { value: 'beneficiary_name', label: 'Nombre Beneficiario', required: false },
  { value: 'amount_bs', label: 'Monto Bs', required: false },
  { value: 'amount_usd', label: 'Monto USD', required: false },
];

export type ParsedRow = Record<string, string | number | null>;

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

// Auto-map columns based on header names
export function autoMapConsumptionColumns(headers: string[]): ConsumptionColumnMapping[] {
  return headers.map((header) => {
    const h = String(header || '').toLowerCase().trim();
    let dbField: string | null = null;
    
    if ((h.includes('poliza') || h.includes('póliza')) && (h.includes('numero') || h.includes('número') || h === 'poliza' || h === 'póliza')) {
      dbField = 'policy_number';
    } else if (h.includes('tipo') && (h.includes('uso') || h.includes('consumo'))) {
      dbField = 'usage_type';
    } else if (h === 'tipo' || h === 'type') {
      dbField = 'usage_type';
    } else if ((h.includes('fecha') && (h.includes('uso') || h.includes('consumo'))) || h === 'fecha' || h === 'date') {
      dbField = 'usage_date';
    } else if (h.includes('descripcion') || h.includes('descripción') || h === 'detalle' || h === 'concepto') {
      dbField = 'description';
    } else if (h.includes('beneficiario') || h.includes('paciente') || h.includes('asegurado')) {
      dbField = 'beneficiary_name';
    } else if ((h.includes('monto') || h.includes('amount') || h.includes('valor')) && (h.includes('bs') || h.includes('bolivar') || h.includes('bolívar'))) {
      dbField = 'amount_bs';
    } else if ((h.includes('monto') || h.includes('amount') || h.includes('valor')) && (h.includes('usd') || h.includes('dolar') || h.includes('dólar') || h === '$')) {
      dbField = 'amount_usd';
    } else if (h === 'monto usd' || h === 'usd' || h === 'dolares' || h === 'dólares') {
      dbField = 'amount_usd';
    } else if (h === 'monto bs' || h === 'bs' || h === 'bolivares' || h === 'bolívares') {
      dbField = 'amount_bs';
    }
    
    return { excelColumn: String(header || ''), dbField };
  });
}

// Check if all required fields are mapped
export function checkRequiredFieldsMapped(mappings: ConsumptionColumnMapping[]): boolean {
  const requiredFields = CONSUMPTION_DB_FIELDS.filter(f => f.required).map(f => f.value);
  return requiredFields.every(field => mappings.some(m => m.dbField === field));
}

// Extract field value from row
function extractField(row: ParsedRow, mappings: ConsumptionColumnMapping[], fieldName: string): string | null {
  const mapping = mappings.find(m => m.dbField === fieldName);
  if (!mapping) return null;
  
  const value = row[mapping.excelColumn];
  return value !== null && value !== undefined ? String(value).trim() : null;
}

// Validate consumption import data
export function validateConsumptionImport(
  rawData: ParsedRow[],
  columnMappings: ConsumptionColumnMapping[],
  existingPolicies: Array<{ id: string; policy_number: string | null }>,
  usageTypes: Array<{ id: string; name: string }>
): ValidatedConsumptionRow[] {
  const validatedRows: ValidatedConsumptionRow[] = [];
  
  rawData.forEach((row, index) => {
    const errors: ValidationError[] = [];
    
    const policyNumber = extractField(row, columnMappings, 'policy_number');
    const usageTypeName = extractField(row, columnMappings, 'usage_type');
    const usageDate = parseDate(extractField(row, columnMappings, 'usage_date'));
    const description = extractField(row, columnMappings, 'description');
    const beneficiaryName = extractField(row, columnMappings, 'beneficiary_name');
    const amountBsStr = extractField(row, columnMappings, 'amount_bs');
    const amountUsdStr = extractField(row, columnMappings, 'amount_usd');
    
    // Parse amounts
    const amountBs = amountBsStr ? parseFloat(amountBsStr.replace(/[^0-9.-]/g, '')) : null;
    const amountUsd = amountUsdStr ? parseFloat(amountUsdStr.replace(/[^0-9.-]/g, '')) : null;
    
    // Find matching policy
    const matchedPolicy = policyNumber 
      ? existingPolicies.find(p => p.policy_number?.toLowerCase().trim() === policyNumber.toLowerCase().trim())
      : null;
    
    // Find matching usage type (fuzzy match)
    const matchedUsageType = usageTypeName
      ? usageTypes.find(t => 
          t.name.toLowerCase().includes(usageTypeName.toLowerCase()) ||
          usageTypeName.toLowerCase().includes(t.name.toLowerCase())
        )
      : null;
    
    // Validate required fields
    if (!policyNumber) {
      errors.push({ field: 'policy_number', message: 'Número de póliza requerido' });
    } else if (!matchedPolicy) {
      errors.push({ field: 'policy_number', message: `Póliza "${policyNumber}" no encontrada` });
    }
    
    if (!usageTypeName) {
      errors.push({ field: 'usage_type', message: 'Tipo de uso requerido' });
    } else if (!matchedUsageType) {
      errors.push({ field: 'usage_type', message: `Tipo "${usageTypeName}" no encontrado` });
    }
    
    if (!usageDate) {
      errors.push({ field: 'usage_date', message: 'Fecha de uso requerida o inválida' });
    }
    
    if (!description) {
      errors.push({ field: 'description', message: 'Descripción requerida' });
    }
    
    // Validate amounts (at least one should be provided)
    if ((amountBs === null || isNaN(amountBs)) && (amountUsd === null || isNaN(amountUsd))) {
      errors.push({ field: 'amount', message: 'Se requiere al menos un monto (Bs o USD)' });
    }
    
    validatedRows.push({
      rowIndex: index + 1,
      data: {
        policy_id: matchedPolicy?.id || '',
        policy_number: policyNumber || '',
        beneficiary_name: beneficiaryName,
        usage_type_id: matchedUsageType?.id || '',
        usage_type_name: usageTypeName || '',
        usage_date: usageDate || '',
        description: description || '',
        amount_bs: amountBs && !isNaN(amountBs) ? amountBs : null,
        amount_usd: amountUsd && !isNaN(amountUsd) ? amountUsd : null,
      },
      errors,
      isValid: errors.length === 0,
    });
  });
  
  return validatedRows;
}

// Download consumption template
export function downloadConsumptionTemplate() {
  const headers = [
    'Número Póliza',
    'Tipo de Uso',
    'Fecha',
    'Descripción',
    'Beneficiario',
    'Monto USD',
    'Monto Bs',
  ];
  
  const exampleRows = [
    ['POL-001', 'Consulta', '15/01/2025', 'Consulta médica general', 'Juan Pérez', '50.00', ''],
    ['POL-001', 'Emergencia', '20/01/2025', 'Atención de urgencia', 'María López', '150.00', ''],
    ['POL-002', 'Reembolso', '25/01/2025', 'Reembolso medicamentos', 'Carlos García', '75.50', ''],
  ];
  
  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // Póliza
    { wch: 15 }, // Tipo
    { wch: 12 }, // Fecha
    { wch: 30 }, // Descripción
    { wch: 20 }, // Beneficiario
    { wch: 12 }, // USD
    { wch: 12 }, // Bs
  ];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Consumos');
  
  XLSX.writeFile(wb, 'plantilla_consumos.xlsx');
}
