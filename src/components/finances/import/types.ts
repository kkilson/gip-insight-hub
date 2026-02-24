export type ParsedRow = Record<string, any>;

export interface ColumnMapping {
  excelColumn: string;
  dbField: string | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidatedRow {
  rowIndex: number;
  isValid: boolean;
  errors: ValidationError[];
  data: Record<string, any>;
}

export interface FieldDef {
  value: string;
  label: string;
  required: boolean;
}

export type FinanceModuleType = 'income' | 'expenses' | 'invoices' | 'receivables' | 'payables' | 'exchange_rates';

// ========================
// FIELD DEFINITIONS PER MODULE
// ========================

export const INCOME_FIELDS: FieldDef[] = [
  { value: 'income_date', label: 'Fecha', required: true },
  { value: 'description', label: 'Descripción', required: true },
  { value: 'amount_usd', label: 'Monto USD', required: false },
  { value: 'amount_ves', label: 'Monto VES', required: false },
  { value: 'bank_name', label: 'Banco', required: false },
  { value: 'notes', label: 'Notas', required: false },
];

export const EXPENSE_FIELDS: FieldDef[] = [
  { value: 'expense_date', label: 'Fecha', required: true },
  { value: 'description', label: 'Descripción', required: true },
  { value: 'amount_usd', label: 'Monto USD', required: false },
  { value: 'amount_ves', label: 'Monto VES', required: false },
  { value: 'is_paid', label: 'Pagado (Sí/No)', required: false },
  { value: 'notes', label: 'Notas', required: false },
];

export const INVOICE_FIELDS: FieldDef[] = [
  { value: 'invoice_date', label: 'Fecha', required: true },
  { value: 'invoice_number', label: 'N° Factura', required: true },
  { value: 'control_number', label: 'N° Control', required: false },
  { value: 'description', label: 'Descripción', required: true },
  { value: 'total_usd', label: 'Total USD', required: false },
  { value: 'total_ves', label: 'Total VES', required: false },
  { value: 'is_collected', label: 'Cobrada (Sí/No)', required: false },
  { value: 'notes', label: 'Notas', required: false },
];

export const RECEIVABLE_FIELDS: FieldDef[] = [
  { value: 'description', label: 'Descripción', required: true },
  { value: 'amount_usd', label: 'Monto USD', required: false },
  { value: 'amount_ves', label: 'Monto VES', required: false },
  { value: 'due_date', label: 'Fecha Vencimiento', required: false },
  { value: 'notes', label: 'Notas', required: false },
];

export const PAYABLE_FIELDS: FieldDef[] = [
  { value: 'budget_name', label: 'Nombre Presupuesto', required: true },
  { value: 'description', label: 'Descripción', required: true },
  { value: 'planned_date', label: 'Fecha Planificada', required: true },
  { value: 'amount_usd', label: 'Monto USD', required: true },
  { value: 'amount_ves', label: 'Monto VES', required: false },
  { value: 'category', label: 'Categoría', required: false },
  { value: 'day_of_month', label: 'Día del Mes', required: false },
];

export const EXCHANGE_RATE_FIELDS: FieldDef[] = [
  { value: 'currency', label: 'Moneda (USD/EUR/USDT)', required: true },
  { value: 'source', label: 'Fuente (BCV/Binance/Kontigo/Manual)', required: true },
  { value: 'rate', label: 'Tasa', required: true },
  { value: 'recorded_at', label: 'Fecha/Hora', required: false },
  { value: 'manual_reason', label: 'Motivo (si manual)', required: false },
];

export function getFieldsForModule(module: FinanceModuleType): FieldDef[] {
  switch (module) {
    case 'income': return INCOME_FIELDS;
    case 'expenses': return EXPENSE_FIELDS;
    case 'invoices': return INVOICE_FIELDS;
    case 'receivables': return RECEIVABLE_FIELDS;
    case 'payables': return PAYABLE_FIELDS;
    case 'exchange_rates': return EXCHANGE_RATE_FIELDS;
  }
}

export function getModuleLabel(module: FinanceModuleType): string {
  switch (module) {
    case 'income': return 'Ingresos';
    case 'expenses': return 'Egresos';
    case 'invoices': return 'Facturas';
    case 'receivables': return 'Cuentas por Cobrar';
    case 'payables': return 'Cuentas por Pagar';
    case 'exchange_rates': return 'Tasas de Cambio';
  }
}

// ========================
// AUTO-MAP HELPERS
// ========================

const SYNONYM_MAP: Record<string, string[]> = {
  income_date: ['fecha', 'date', 'fecha_ingreso'],
  expense_date: ['fecha', 'date', 'fecha_egreso', 'fecha_gasto'],
  invoice_date: ['fecha', 'date', 'fecha_factura'],
  description: ['descripcion', 'concepto', 'detalle', 'description'],
  amount_usd: ['monto_usd', 'usd', 'dolares', 'amount_usd', 'monto usd', 'dólares'],
  amount_ves: ['monto_ves', 'ves', 'bolivares', 'amount_ves', 'monto ves', 'bolívares', 'bs'],
  bank_name: ['banco', 'bank', 'entidad'],
  notes: ['notas', 'nota', 'observaciones', 'notes'],
  invoice_number: ['numero_factura', 'n_factura', 'factura', 'invoice_number', 'nro_factura', 'n° factura'],
  control_number: ['numero_control', 'n_control', 'control', 'control_number', 'nro_control', 'n° control'],
  total_usd: ['total_usd', 'total usd', 'total_dolares', 'monto_usd', 'usd'],
  total_ves: ['total_ves', 'total ves', 'total_bolivares', 'monto_ves', 'ves', 'bs'],
  is_paid: ['pagado', 'paid', 'is_paid'],
  is_collected: ['cobrada', 'cobrado', 'collected', 'is_collected'],
  due_date: ['vencimiento', 'fecha_vencimiento', 'due_date'],
  budget_name: ['presupuesto', 'budget', 'nombre_presupuesto'],
  planned_date: ['fecha_planificada', 'fecha', 'planned_date'],
  category: ['categoria', 'category', 'categoría'],
  day_of_month: ['dia', 'día', 'day', 'dia_mes'],
  currency: ['moneda', 'currency', 'divisa'],
  source: ['fuente', 'source', 'origen'],
  rate: ['tasa', 'rate', 'valor', 'precio'],
  recorded_at: ['fecha', 'date', 'fecha_hora', 'recorded_at'],
  manual_reason: ['motivo', 'razon', 'razón', 'reason'],
};

export function autoMapColumns(headers: string[], fields: FieldDef[]): ColumnMapping[] {
  return headers.map(header => {
    const normalized = header.toLowerCase().trim().replace(/[^a-záéíóúñü0-9_\s]/gi, '').replace(/\s+/g, '_');
    let matched: string | null = null;

    for (const field of fields) {
      const synonyms = SYNONYM_MAP[field.value] || [field.value];
      if (synonyms.some(s => normalized === s || normalized.includes(s) || s.includes(normalized))) {
        matched = field.value;
        break;
      }
    }

    return { excelColumn: header, dbField: matched };
  });
}

export function checkRequiredFields(mappings: ColumnMapping[], fields: FieldDef[]): boolean {
  const requiredFields = fields.filter(f => f.required).map(f => f.value);
  const mappedFields = mappings.filter(m => m.dbField).map(m => m.dbField);
  return requiredFields.every(rf => mappedFields.includes(rf));
}

// ========================
// PARSE DATE HELPER
// ========================

export function parseDate(value: any): string | null {
  if (!value) return null;
  const str = String(value).trim();

  // Try ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
  // Try dd/mm/yyyy
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  // Try mm/dd/yyyy
  const mdy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;
  // Excel serial number
  if (!isNaN(Number(str)) && Number(str) > 30000 && Number(str) < 60000) {
    const d = new Date((Number(str) - 25569) * 86400 * 1000);
    return d.toISOString().substring(0, 10);
  }
  return null;
}

export function parseNumber(value: any): number {
  if (value == null || value === '') return 0;
  const str = String(value).replace(/[^0-9.,\-]/g, '').replace(',', '.');
  return parseFloat(str) || 0;
}

export function parseBool(value: any): boolean {
  if (value == null) return false;
  const str = String(value).toLowerCase().trim();
  return ['sí', 'si', 'yes', '1', 'true', 'x', 'pagado', 'cobrada', 'cobrado'].includes(str);
}

// ========================
// TEMPLATE DOWNLOAD
// ========================

import * as XLSX from 'xlsx';

export function downloadTemplate(module: FinanceModuleType) {
  const fields = getFieldsForModule(module);
  const label = getModuleLabel(module);
  const headers = fields.map(f => f.label);
  
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, label);
  XLSX.writeFile(wb, `Plantilla_${label.replace(/\s/g, '_')}.xlsx`);
}
