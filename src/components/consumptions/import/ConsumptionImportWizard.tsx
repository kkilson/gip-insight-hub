import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  Check, 
  X, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUsageTypes } from '@/hooks/useConsumptions';
import { useQueryClient } from '@tanstack/react-query';
import {
  ParsedRow,
  ConsumptionColumnMapping,
  ValidatedConsumptionRow,
  CONSUMPTION_DB_FIELDS,
  autoMapConsumptionColumns,
  checkRequiredFieldsMapped,
  validateConsumptionImport,
  downloadConsumptionTemplate,
} from './types';

interface ConsumptionImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export function ConsumptionImportWizard({ open, onOpenChange }: ConsumptionImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ConsumptionColumnMapping[]>([]);
  const [validatedRows, setValidatedRows] = useState<ValidatedConsumptionRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; errors: number }>({ success: 0, errors: 0 });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: usageTypes = [] } = useUsageTypes();

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

  const handleClose = () => {
    resetWizard();
    onOpenChange(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setIsLoading(true);
    setFile(uploadedFile);

    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, { defval: null });

      if (jsonData.length === 0) {
        toast({
          title: 'Archivo vacío',
          description: 'El archivo no contiene datos para importar.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const extractedHeaders = Object.keys(jsonData[0] || {});
      setHeaders(extractedHeaders);
      setRawData(jsonData);

      // Auto-map columns
      const autoMappings = autoMapConsumptionColumns(extractedHeaders);
      setColumnMappings(autoMappings);

      setStep('mapping');
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: 'Error al leer archivo',
        description: 'No se pudo procesar el archivo. Verifica el formato.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMappingChange = (excelColumn: string, dbField: string | null) => {
    setColumnMappings(prev =>
      prev.map(m => m.excelColumn === excelColumn ? { ...m, dbField } : m)
    );
  };

  const handleValidateAndPreview = async () => {
    setIsLoading(true);

    try {
      // Fetch existing policies
      const { data: policies } = await supabase
        .from('policies')
        .select('id, policy_number');

      const validated = validateConsumptionImport(
        rawData,
        columnMappings,
        policies || [],
        usageTypes
      );

      setValidatedRows(validated);
      setStep('preview');
    } catch (error) {
      console.error('Error validating data:', error);
      toast({
        title: 'Error de validación',
        description: 'No se pudo validar los datos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    const validRows = validatedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast({
        title: 'Sin datos válidos',
        description: 'No hay registros válidos para importar.',
        variant: 'destructive',
      });
      return;
    }

    setStep('importing');
    setImportProgress(0);

    const { data: user } = await supabase.auth.getUser();
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];

      try {
        const { error } = await supabase.from('policy_consumptions').insert({
          policy_id: row.data.policy_id,
          beneficiary_name: row.data.beneficiary_name,
          usage_type_id: row.data.usage_type_id,
          usage_date: row.data.usage_date,
          description: row.data.description,
          amount_bs: row.data.amount_bs,
          amount_usd: row.data.amount_usd,
          created_by: user.user?.id,
        });

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error(`Error importing row ${row.rowIndex}:`, error);
        errorCount++;
      }

      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setImportResults({ success: successCount, errors: errorCount });
    setStep('complete');

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['consumptions'] });
    queryClient.invalidateQueries({ queryKey: ['consumption-summary'] });
  };

  const validCount = validatedRows.filter(r => r.isValid).length;
  const errorCount = validatedRows.filter(r => !r.isValid).length;
  const requiredFieldsMapped = checkRequiredFieldsMapped(columnMappings);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Consumos</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Sube un archivo Excel o CSV con los consumos a importar'}
            {step === 'mapping' && 'Mapea las columnas del archivo a los campos de consumo'}
            {step === 'preview' && 'Revisa los datos antes de importar'}
            {step === 'importing' && 'Importando consumos...'}
            {step === 'complete' && 'Importación completada'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-6 py-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="consumption-file-upload"
                  disabled={isLoading}
                />
                <label
                  htmlFor="consumption-file-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  {isLoading ? (
                    <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                  ) : (
                    <Upload className="h-12 w-12 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-lg font-medium">
                      {isLoading ? 'Procesando archivo...' : 'Arrastra o haz clic para subir'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Formatos: Excel (.xlsx, .xls) o CSV
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-center">
                <Button variant="outline" onClick={downloadConsumptionTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar plantilla
                </Button>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Columnas requeridas:</strong> Número Póliza, Tipo de Uso, Fecha, Descripción.
                  <br />
                  <strong>Tipos de uso disponibles:</strong> {usageTypes.map(t => t.name).join(', ') || 'Ninguno configurado'}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step: Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{file?.name}</span>
                  <Badge variant="secondary">{rawData.length} filas</Badge>
                </div>
                {!requiredFieldsMapped && (
                  <Badge variant="destructive">Faltan campos requeridos</Badge>
                )}
              </div>

              <ScrollArea className="h-[350px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/2">Columna Excel</TableHead>
                      <TableHead className="w-1/2">Campo de Consumo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {columnMappings.map((mapping) => (
                      <TableRow key={mapping.excelColumn}>
                        <TableCell className="font-medium">{mapping.excelColumn}</TableCell>
                        <TableCell>
                          <Select
                            value={mapping.dbField || 'ignore'}
                            onValueChange={(value) =>
                              handleMappingChange(mapping.excelColumn, value === 'ignore' ? null : value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Ignorar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ignore">-- Ignorar --</SelectItem>
                              {CONSUMPTION_DB_FIELDS.map((field) => (
                                <SelectItem key={field.value} value={field.value}>
                                  {field.label} {field.required && '*'}
                                </SelectItem>
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

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Badge variant="default" className="bg-success text-success-foreground">
                  <Check className="h-3 w-3 mr-1" />
                  {validCount} válidos
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" />
                    {errorCount} con errores
                  </Badge>
                )}
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
                          <TableHead>Póliza</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Beneficiario</TableHead>
                          <TableHead className="text-right">USD</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validatedRows.filter(r => r.isValid).map((row) => (
                          <TableRow key={row.rowIndex}>
                            <TableCell>{row.rowIndex}</TableCell>
                            <TableCell className="font-medium">{row.data.policy_number}</TableCell>
                            <TableCell>{row.data.usage_type_name}</TableCell>
                            <TableCell>{row.data.usage_date}</TableCell>
                            <TableCell>{row.data.beneficiary_name || '-'}</TableCell>
                            <TableCell className="text-right">
                              {row.data.amount_usd ? `$${row.data.amount_usd.toFixed(2)}` : '-'}
                            </TableCell>
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
                          <TableHead>Póliza</TableHead>
                          <TableHead>Errores</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validatedRows.filter(r => !r.isValid).map((row) => (
                          <TableRow key={row.rowIndex}>
                            <TableCell>{row.rowIndex}</TableCell>
                            <TableCell>{row.data.policy_number || '-'}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {row.errors.map((err, idx) => (
                                  <Badge key={idx} variant="destructive" className="text-xs">
                                    {err.message}
                                  </Badge>
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

          {/* Step: Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-lg font-medium">Importando consumos...</p>
                <p className="text-sm text-muted-foreground">No cierres esta ventana</p>
              </div>
              <div className="w-full max-w-md">
                <Progress value={importProgress} />
                <p className="text-center text-sm text-muted-foreground mt-2">{importProgress}%</p>
              </div>
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="h-8 w-8 text-success" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Importación completada</p>
                <p className="text-muted-foreground">
                  {importResults.success} consumos importados
                  {importResults.errors > 0 && `, ${importResults.errors} errores`}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
              <Button
                onClick={handleValidateAndPreview}
                disabled={!requiredFieldsMapped || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Validar y previsualizar
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                <Check className="h-4 w-4 mr-2" />
                Importar {validCount} consumos
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button onClick={handleClose}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
