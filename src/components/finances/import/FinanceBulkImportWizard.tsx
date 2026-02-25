import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload, FileSpreadsheet, Download, Check, X, Loader2, Info, ArrowRight, ArrowLeft,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  type ParsedRow, type ColumnMapping, type ValidatedRow, type FieldDef,
  type FinanceModuleType,
  getFieldsForModule, getModuleLabel, autoMapColumns, checkRequiredFields,
  parseDate, parseNumber, parseBool, downloadTemplate,
} from './types';

interface FinanceBulkImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: FinanceModuleType;
  /** Optional: available banks for income resolution */
  banks?: { id: string; name: string }[];
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export function FinanceBulkImportWizard({ open, onOpenChange, module, banks }: FinanceBulkImportWizardProps) {
  const fields = getFieldsForModule(module);
  const moduleLabel = getModuleLabel(module);

  const [step, setStep] = useState<WizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState({ success: 0, errors: 0 });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetWizard = useCallback(() => {
    setStep('upload');
    setFile(null);
    setRawData([]);
    setHeaders([]);
    setColumnMappings([]);
    setValidatedRows([]);
    setImportProgress(0);
    setImportResults({ success: 0, errors: 0 });
  }, []);

  const handleClose = () => { resetWizard(); onOpenChange(false); };

  // ====== UPLOAD ======
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setIsLoading(true);
    setFile(uploadedFile);
    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, { defval: null });
      if (jsonData.length === 0) {
        toast({ title: 'Archivo vacío', description: 'No hay datos para importar.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      const extractedHeaders = Object.keys(jsonData[0] || {});
      setHeaders(extractedHeaders);
      setRawData(jsonData);
      setColumnMappings(autoMapColumns(extractedHeaders, fields));
      setStep('mapping');
    } catch {
      toast({ title: 'Error al leer archivo', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // ====== MAPPING ======
  const handleMappingChange = (excelColumn: string, dbField: string | null) => {
    setColumnMappings(prev => prev.map(m => m.excelColumn === excelColumn ? { ...m, dbField } : m));
  };

  // ====== VALIDATE ======
  const getMappedValue = (row: ParsedRow, field: string): any => {
    const mapping = columnMappings.find(m => m.dbField === field);
    if (!mapping) return null;
    return row[mapping.excelColumn];
  };

  const validateRows = (): ValidatedRow[] => {
    return rawData.map((row, idx) => {
      const errors: { field: string; message: string }[] = [];
      const data: Record<string, any> = {};

      for (const field of fields) {
        const raw = getMappedValue(row, field.value);

        if (field.required && (raw == null || String(raw).trim() === '')) {
          errors.push({ field: field.value, message: `${field.label} es requerido` });
          continue;
        }

        // Parse by type
        if (field.value.includes('date') || field.value === 'recorded_at' || field.value === 'planned_date' || field.value === 'income_date' || field.value === 'expense_date' || field.value === 'invoice_date' || field.value === 'due_date') {
          const parsed = parseDate(raw);
          if (raw && !parsed) {
            errors.push({ field: field.value, message: `${field.label}: formato de fecha inválido` });
          }
          data[field.value] = parsed;
        } else if (['amount_usd', 'amount_ves', 'total_usd', 'total_ves', 'rate', 'day_of_month'].includes(field.value)) {
          data[field.value] = parseNumber(raw);
        } else if (['is_paid', 'is_collected'].includes(field.value)) {
          data[field.value] = parseBool(raw);
        } else {
          data[field.value] = raw != null ? String(raw).trim() : null;
        }
      }

      return { rowIndex: idx + 2, isValid: errors.length === 0, errors, data };
    });
  };

  const handleValidate = () => {
    setIsLoading(true);
    const validated = validateRows();
    setValidatedRows(validated);
    setStep('preview');
    setIsLoading(false);
  };

  // ====== IMPORT ======
  const handleImport = async () => {
    const validRows = validatedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast({ title: 'Sin datos válidos', variant: 'destructive' });
      return;
    }
    setStep('importing');
    setImportProgress(0);

    const { data: user } = await supabase.auth.getUser();
    let success = 0, errors = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i].data;
      try {
        let insertError: any = null;

        if (module === 'income') {
          let bankId: string | null = null;
          if (row.bank_name && banks) {
            const found = banks.find(b => b.name.toLowerCase() === String(row.bank_name).toLowerCase());
            bankId = found?.id || null;
          }
          const month = row.income_date?.substring(0, 7) || '';
          const { error } = await supabase.from('finance_income').insert({
            income_date: row.income_date, month, description: row.description,
            amount_usd: row.amount_usd || 0, amount_ves: row.amount_ves || 0,
            bank_id: bankId, notes: row.notes, created_by: user.user?.id,
          });
          insertError = error;
        } else if (module === 'expenses') {
          const month = row.expense_date?.substring(0, 7) || '';
          const { error } = await supabase.from('finance_expenses').insert({
            expense_date: row.expense_date, month, description: row.description,
            beneficiary: row.beneficiary || null,
            amount_usd: row.amount_usd || 0, amount_ves: row.amount_ves || 0,
            is_paid: row.is_paid ?? true, notes: row.notes, created_by: user.user?.id,
          });
          insertError = error;
        } else if (module === 'invoices') {
          const month = row.invoice_date?.substring(0, 7) || '';
          const { error } = await supabase.from('finance_invoices').insert({
            invoice_date: row.invoice_date, month, invoice_number: row.invoice_number,
            control_number: row.control_number || null, description: row.description,
            total_usd: row.total_usd || 0, total_ves: row.total_ves || 0,
            is_collected: row.is_collected ?? false, notes: row.notes, created_by: user.user?.id,
          });
          insertError = error;
        } else if (module === 'exchange_rates') {
          const validCurrencies = ['USD', 'EUR', 'USDT'];
          const validSources = ['BCV', 'Binance', 'Kontigo', 'Manual'];
          const currency = String(row.currency || '').toUpperCase();
          const source = String(row.source || '');
          const matchedSource = validSources.find(s => s.toLowerCase() === source.toLowerCase()) || 'Manual';
          if (!validCurrencies.includes(currency)) {
            errors++;
            setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
            continue;
          }
          const { error } = await supabase.from('exchange_rates').insert({
            currency: currency as any, source: matchedSource as any,
            rate: row.rate || 0, is_manual: matchedSource === 'Manual',
            manual_reason: row.manual_reason || null, recorded_by: user.user?.id,
          });
          insertError = error;
        }

        if (insertError) throw insertError;
        success++;
      } catch (err) {
        console.error(`Error importing row ${validRows[i].rowIndex}:`, err);
        errors++;
      }
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setImportResults({ success, errors });
    setStep('complete');

    // Invalidate relevant queries
    const queryKeys: Record<FinanceModuleType, string[]> = {
      income: ['finance-income'],
      expenses: ['finance-expenses'],
      invoices: ['finance-invoices'],
      exchange_rates: ['exchange-rates'],
    };
    queryKeys[module].forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
  };

  const validCount = validatedRows.filter(r => r.isValid).length;
  const errorCount = validatedRows.filter(r => !r.isValid).length;
  const requiredOk = checkRequiredFields(columnMappings, fields);

  // Preview columns for display
  const previewCols = fields.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar {moduleLabel}</DialogTitle>
          <DialogDescription>
            {step === 'upload' && `Sube un archivo Excel o CSV con los ${moduleLabel.toLowerCase()} a importar`}
            {step === 'mapping' && 'Mapea las columnas del archivo a los campos correspondientes'}
            {step === 'preview' && 'Revisa los datos antes de importar'}
            {step === 'importing' && 'Importando registros...'}
            {step === 'complete' && 'Importación completada'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Upload */}
          {step === 'upload' && (
            <div className="space-y-6 py-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload}
                  className="hidden" id={`finance-import-${module}`} disabled={isLoading} />
                <label htmlFor={`finance-import-${module}`} className="cursor-pointer flex flex-col items-center gap-4">
                  {isLoading ? <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" /> : <Upload className="h-12 w-12 text-muted-foreground" />}
                  <div>
                    <p className="text-lg font-medium">{isLoading ? 'Procesando...' : 'Arrastra o haz clic para subir'}</p>
                    <p className="text-sm text-muted-foreground">Formatos: Excel (.xlsx, .xls) o CSV</p>
                  </div>
                </label>
              </div>
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => downloadTemplate(module)}>
                  <Download className="h-4 w-4 mr-2" />Descargar plantilla
                </Button>
              </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Campos requeridos:</strong> {fields.filter(f => f.required).map(f => f.label).join(', ')}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{file?.name}</span>
                  <Badge variant="secondary">{rawData.length} filas</Badge>
                </div>
                {!requiredOk && <Badge variant="destructive">Faltan campos requeridos</Badge>}
              </div>
              <ScrollArea className="h-[350px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/2">Columna Excel</TableHead>
                      <TableHead className="w-1/2">Campo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {columnMappings.map(m => (
                      <TableRow key={m.excelColumn}>
                        <TableCell className="font-medium">{m.excelColumn}</TableCell>
                        <TableCell>
                          <Select value={m.dbField || 'ignore'} onValueChange={v => handleMappingChange(m.excelColumn, v === 'ignore' ? null : v)}>
                            <SelectTrigger><SelectValue placeholder="Ignorar" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ignore">-- Ignorar --</SelectItem>
                              {fields.map(f => (
                                <SelectItem key={f.value} value={f.value}>{f.label}{f.required ? ' *' : ''}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {/* Preview */}
          {step === 'preview' && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Badge variant="default" className="bg-green-600"><Check className="h-3 w-3 mr-1" />{validCount} válidos</Badge>
                {errorCount > 0 && <Badge variant="destructive"><X className="h-3 w-3 mr-1" />{errorCount} con errores</Badge>}
              </div>
              <Tabs defaultValue="valid" className="w-full">
                <TabsList>
                  <TabsTrigger value="valid">Válidos ({validCount})</TabsTrigger>
                  <TabsTrigger value="errors">Con errores ({errorCount})</TabsTrigger>
                </TabsList>
                <TabsContent value="valid">
                  <ScrollArea className="h-[300px] border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fila</TableHead>
                          {previewCols.map(f => <TableHead key={f.value}>{f.label}</TableHead>)}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validatedRows.filter(r => r.isValid).map(row => (
                          <TableRow key={row.rowIndex}>
                            <TableCell>{row.rowIndex}</TableCell>
                            {previewCols.map(f => (
                              <TableCell key={f.value}>{row.data[f.value] != null ? String(row.data[f.value]) : '-'}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="errors">
                  <ScrollArea className="h-[300px] border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fila</TableHead>
                          <TableHead>Errores</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validatedRows.filter(r => !r.isValid).map(row => (
                          <TableRow key={row.rowIndex}>
                            <TableCell>{row.rowIndex}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {row.errors.map((err, idx) => (
                                  <Badge key={idx} variant="destructive" className="text-xs">{err.message}</Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-lg font-medium">Importando {moduleLabel.toLowerCase()}...</p>
                <p className="text-sm text-muted-foreground">No cierres esta ventana</p>
              </div>
              <div className="w-full max-w-md">
                <Progress value={importProgress} />
                <p className="text-center text-sm text-muted-foreground mt-2">{importProgress}%</p>
              </div>
            </div>
          )}

          {/* Complete */}
          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Importación completada</p>
                <p className="text-muted-foreground">
                  {importResults.success} registros importados
                  {importResults.errors > 0 && `, ${importResults.errors} errores`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter>
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}><ArrowLeft className="h-4 w-4 mr-2" />Atrás</Button>
              <Button onClick={handleValidate} disabled={!requiredOk || isLoading}>
                Validar y Previsualizar <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}><ArrowLeft className="h-4 w-4 mr-2" />Atrás</Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Importar {validCount} registros <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={handleClose}>Cerrar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
