import { useState, useRef, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Download,
  BookOpen,
} from 'lucide-react';
import { UnifiedColumnMappingTable } from './import/UnifiedColumnMappingTable';
import { UnifiedPreviewTable } from './import/UnifiedPreviewTable';
import { ImportInstructionsTab } from './import/ImportInstructionsTab';
import type { ParsedRow } from './import/types';
import type { UnifiedColumnMapping, ValidatedUnifiedRow } from './import/unifiedTypes';
import {
  autoMapUnifiedColumns,
  validateUnifiedImport,
  checkUnifiedRequiredFieldsMapped,
  downloadUnifiedTemplate,
  getDetectedBeneficiaryCount,
} from './import/unifiedUtils';

interface ClientImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SheetData {
  headers: string[];
  rawData: ParsedRow[];
  columnMappings: UnifiedColumnMapping[];
}

interface ImportResults {
  clientsCreated: number;
  policiesCreated: number;
  policiesUpdated: number;
  beneficiariesCreated: number;
  failed: number;
}

const steps = [
  { id: 1, name: 'Subir archivo', description: 'Selecciona el archivo Excel' },
  { id: 2, name: 'Mapear columnas', description: 'Relaciona columnas con campos' },
  { id: 3, name: 'Validar datos', description: 'Revisa errores' },
  { id: 4, name: 'Importar', description: 'Ejecutar importación' },
];

export function ClientImportWizard({ open, onOpenChange }: ClientImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [validatedRows, setValidatedRows] = useState<ValidatedUnifiedRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [importPhase, setImportPhase] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing data for validation
  const { data: existingClients = [] } = useQuery({
    queryKey: ['clients-for-import'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, identification_number')
        .order('identification_number');
      return data || [];
    },
    enabled: open,
  });

  const { data: insurers = [] } = useQuery({
    queryKey: ['insurers-for-import'],
    queryFn: async () => {
      const { data } = await supabase
        .from('insurers')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      return data || [];
    },
    enabled: open,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-for-import'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, insurer_id')
        .eq('is_active', true)
        .order('name');
      return data || [];
    },
    enabled: open,
  });

  const { data: existingPolicies = [] } = useQuery({
    queryKey: ['policies-for-import'],
    queryFn: async () => {
      const { data } = await supabase
        .from('policies')
        .select('id, policy_number')
        .order('policy_number');
      return data || [];
    },
    enabled: open,
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({
        title: 'Archivo no válido',
        description: 'Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV.',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Use first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          toast({
            title: 'Archivo vacío',
            description: 'El archivo no contiene datos para importar.',
            variant: 'destructive',
          });
          return;
        }
        
        const headerRow = jsonData[0] as unknown as string[];
        const dataRows = jsonData.slice(1).filter((row) => {
          const r = row as Record<string, unknown>;
          return Object.values(r).some((cell) => cell !== null && cell !== undefined && cell !== '');
        });
        
        if (dataRows.length === 0) {
          toast({
            title: 'Sin datos',
            description: 'El archivo no contiene filas de datos válidas.',
            variant: 'destructive',
          });
          return;
        }
        
        const headers = headerRow.map((h) => String(h || '').trim());
        const rawData = dataRows.map((row) => {
          const obj: ParsedRow = {};
          const r = row as Record<number, string | number | null>;
          headerRow.forEach((header, index) => {
            obj[String(header || `Column${index}`)] = r[index] ?? null;
          });
          return obj;
        });
        
        // Auto-map columns
        const columnMappings = autoMapUnifiedColumns(headers);
        
        setSheetData({ headers, rawData, columnMappings });
        setCurrentStep(2);
      } catch (error) {
        toast({
          title: 'Error al leer archivo',
          description: 'No se pudo procesar el archivo. Verifica que sea un Excel válido.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  }, [toast]);

  const updateMapping = (excelColumn: string, dbField: string | null, beneficiaryIndex: number | null) => {
    if (!sheetData) return;
    
    setSheetData({
      ...sheetData,
      columnMappings: sheetData.columnMappings.map((m) =>
        m.excelColumn === excelColumn 
          ? { ...m, dbField, beneficiaryIndex } 
          : m
      ),
    });
  };

  const validateData = useCallback(() => {
    if (!sheetData) return;
    
    const validated = validateUnifiedImport(
      sheetData.rawData,
      sheetData.columnMappings,
      existingClients,
      existingPolicies,
      insurers,
      products
    );
    
    setValidatedRows(validated);
    setCurrentStep(3);
  }, [sheetData, existingClients, existingPolicies, insurers, products]);

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuario no autenticado');

      const results: ImportResults = {
        clientsCreated: 0,
        policiesCreated: 0,
        policiesUpdated: 0,
        beneficiariesCreated: 0,
        failed: 0,
      };

      const validRows = validatedRows.filter((r) => r.isValid);
      const totalSteps = validRows.length;
      let currentProgress = 0;

      // Track created clients for ID resolution
      const createdClientIds: Record<string, string> = {};

      for (const row of validRows) {
        try {
          setImportPhase(`Procesando póliza ${row.policyNumber}...`);
          
          // 1. Create or find client
          let clientId = row.existingClientId;
          
          if (!clientId) {
            // Check if we already created this client in this batch
            const clientKey = row.clientData.identification_number.toLowerCase().replace(/[^a-z0-9]/gi, '');
            
            if (createdClientIds[clientKey]) {
              clientId = createdClientIds[clientKey];
            } else {
              const clientToInsert = {
                identification_type: row.clientData.identification_type as 'cedula' | 'pasaporte' | 'rif' | 'otro',
                identification_number: row.clientData.identification_number,
                first_name: row.clientData.first_name,
                last_name: row.clientData.last_name,
                email: row.clientData.email || null,
                phone: row.clientData.phone || null,
                mobile: row.clientData.mobile || null,
                address: row.clientData.address || null,
                city: row.clientData.city || null,
                province: row.clientData.province || null,
                birth_date: row.clientData.birth_date || null,
                occupation: row.clientData.occupation || null,
                workplace: row.clientData.workplace || null,
                created_by: user.id,
              };

              const { data, error } = await supabase
                .from('clients')
                .insert(clientToInsert)
                .select('id')
                .single();

              if (error) {
                console.error('Error creating client:', error);
                results.failed++;
                continue;
              }
              
              clientId = data.id;
              createdClientIds[clientKey] = clientId;
              results.clientsCreated++;
            }
          }

          // 2. Create or update policy
          let policyId = row.existingPolicyId;
          
          const policyData = {
            insurer_id: row.resolvedInsurerId || null,
            product_id: row.resolvedProductId || null,
            policy_number: row.policyData.policy_number,
            start_date: row.policyData.start_date,
            end_date: row.policyData.end_date,
            status: (row.policyData.status || 'en_tramite') as 'vigente' | 'pendiente' | 'cancelada' | 'vencida' | 'en_tramite',
            premium: row.policyData.premium ? parseFloat(row.policyData.premium) : null,
            payment_frequency: (row.policyData.payment_frequency || 'mensual') as 'mensual' | 'trimestral' | 'semestral' | 'anual' | 'mensual_10_cuotas' | 'mensual_12_cuotas' | 'bimensual',
            coverage_amount: row.policyData.coverage_amount ? parseFloat(row.policyData.coverage_amount) : null,
            deductible: row.policyData.deductible ? parseFloat(row.policyData.deductible) : null,
            premium_payment_date: row.policyData.premium_payment_date || null,
            notes: row.policyData.notes || null,
          };

          if (policyId) {
            // Update existing policy
            const { error } = await supabase
              .from('policies')
              .update(policyData)
              .eq('id', policyId);

            if (error) {
              console.error('Error updating policy:', error);
              results.failed++;
              continue;
            }
            results.policiesUpdated++;
          } else {
            // Create new policy
            const { data, error } = await supabase
              .from('policies')
              .insert({ ...policyData, client_id: clientId, created_by: user.id })
              .select('id')
              .single();

            if (error) {
              console.error('Error creating policy:', error);
              results.failed++;
              continue;
            }
            policyId = data.id;
            results.policiesCreated++;
          }

          // 3. Create beneficiaries
          for (const beneficiary of row.beneficiaries) {
            if (!beneficiary.first_name && !beneficiary.last_name) continue;
            
            const beneficiaryToInsert = {
              policy_id: policyId,
              first_name: beneficiary.first_name || '',
              last_name: beneficiary.last_name || '',
              identification_type: (beneficiary.identification_type || 'cedula') as 'cedula' | 'pasaporte' | 'rif' | 'otro',
              identification_number: beneficiary.identification_number || null,
              relationship: (beneficiary.relationship || 'otro') as 'conyuge' | 'hijo' | 'padre' | 'madre' | 'hermano' | 'tomador_titular' | 'otro',
              birth_date: beneficiary.birth_date || null,
              phone: beneficiary.phone || null,
              email: beneficiary.email || null,
            };

            const { error } = await supabase.from('beneficiaries').insert(beneficiaryToInsert);

            if (!error) {
              results.beneficiariesCreated++;
            }
          }

        } catch (error) {
          console.error('Error processing row:', error);
          results.failed++;
        }

        currentProgress++;
        setImportProgress(Math.round((currentProgress / totalSteps) * 100));
      }

      // Audit log
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        user_email: user.email,
        action: 'import',
        module: 'clients',
        details: {
          file_name: file?.name,
          clients_created: results.clientsCreated,
          policies_created: results.policiesCreated,
          policies_updated: results.policiesUpdated,
          beneficiaries_created: results.beneficiariesCreated,
          failed: results.failed,
        },
      }]);

      return results;
    },
    onSuccess: (results) => {
      setImportResults(results);
      setImportPhase('');
      toast({
        title: 'Importación completada',
        description: `${results.policiesCreated} pólizas creadas, ${results.policiesUpdated} actualizadas, ${results.clientsCreated} tomadores nuevos, ${results.beneficiariesCreated} beneficiarios`,
      });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleImport = () => {
    setCurrentStep(4);
    setImportProgress(0);
    importMutation.mutate();
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFile(null);
    setSheetData(null);
    setValidatedRows([]);
    setImportProgress(0);
    setImportResults(null);
    setImportPhase('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onOpenChange(false);
  };

  const isReady = sheetData && checkUnifiedRequiredFieldsMapped(sheetData.columnMappings);
  const validCount = validatedRows.filter((r) => r.isValid).length;
  const progress = (currentStep / steps.length) * 100;
  const beneficiaryCount = sheetData ? getDetectedBeneficiaryCount(sheetData.columnMappings) : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar desde Excel</DialogTitle>
          <DialogDescription>
            Importa pólizas con tomadores y beneficiarios desde una sola hoja de Excel
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="space-y-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center text-center flex-1 ${
                  step.id === currentStep
                    ? 'text-primary'
                    : step.id < currentStep
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
                    step.id === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.id < currentStep
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Step 1: Upload */}
          {currentStep === 1 && (
            <Tabs defaultValue="upload" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Subir Archivo
                </TabsTrigger>
                <TabsTrigger value="instructions" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Instrucciones
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-6 mt-4">
                <Card
                  className="border-dashed cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileSpreadsheet className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <p className="text-lg font-medium">Arrastra tu archivo aquí o haz clic para seleccionar</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Formatos soportados: Excel (.xlsx, .xls) o CSV
                    </p>
                    {file && (
                      <Badge className="mt-4" variant="secondary">
                        {file.name}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                />
                
                <Button variant="outline" onClick={downloadUnifiedTemplate} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar plantilla de ejemplo (hasta 7 beneficiarios)
                </Button>

                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-2">Estructura del archivo:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Cada fila representa una póliza con su tomador</li>
                    <li>El <strong>número de póliza</strong> es el identificador único</li>
                    <li>Puedes incluir hasta <strong>7 beneficiarios</strong> por póliza (con F.Nac, Tel, Email)</li>
                    <li>Si la póliza ya existe, se actualizará con los nuevos datos</li>
                    <li>Si el tomador ya existe (por cédula), se reutilizará</li>
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="instructions" className="mt-4">
                <ImportInstructionsTab insurers={insurers} products={products} />
              </TabsContent>
            </Tabs>
          )}

          {/* Step 2: Column Mapping */}
          {currentStep === 2 && sheetData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {sheetData.rawData.length} filas encontradas
                  </p>
                  {beneficiaryCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {beneficiaryCount} columnas de beneficiarios detectadas
                    </p>
                  )}
                </div>
                <Badge variant={isReady ? 'default' : 'destructive'}>
                  {isReady ? 'Campos requeridos mapeados' : 'Faltan campos requeridos'}
                </Badge>
              </div>
              
              <UnifiedColumnMappingTable
                headers={sheetData.headers}
                rawData={sheetData.rawData}
                columnMappings={sheetData.columnMappings}
                onUpdateMapping={updateMapping}
              />
              
              <p className="text-xs text-muted-foreground">
                * Campos requeridos: Número de póliza, Cédula tomador, Nombres tomador, Apellidos tomador, Fecha inicio, Fecha renovación
              </p>
            </div>
          )}

          {/* Step 3: Validate */}
          {currentStep === 3 && (
            <UnifiedPreviewTable validatedRows={validatedRows} />
          )}

          {/* Step 4: Import */}
          {currentStep === 4 && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              {importMutation.isPending ? (
                <>
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  <div className="text-center">
                    <p className="text-lg font-medium">Importando datos...</p>
                    <p className="text-sm text-muted-foreground mt-1">{importPhase}</p>
                  </div>
                  <Progress value={importProgress} className="w-64" />
                  <p className="text-sm text-muted-foreground">{importProgress}%</p>
                </>
              ) : importResults ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium">Importación completada</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-2xl font-bold text-primary">{importResults.policiesCreated}</p>
                      <p className="text-sm text-muted-foreground">Pólizas creadas</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-2xl font-bold">{importResults.policiesUpdated}</p>
                      <p className="text-sm text-muted-foreground">Pólizas actualizadas</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-2xl font-bold">{importResults.clientsCreated}</p>
                      <p className="text-sm text-muted-foreground">Tomadores nuevos</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-2xl font-bold">{importResults.beneficiariesCreated}</p>
                      <p className="text-sm text-muted-foreground">Beneficiarios</p>
                    </div>
                  </div>
                  {importResults.failed > 0 && (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      <span>{importResults.failed} filas con errores</span>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              if (currentStep > 1 && currentStep < 4) {
                setCurrentStep(currentStep - 1);
              } else {
                handleClose();
              }
            }}
          >
            {currentStep === 1 || currentStep === 4 ? (
              'Cerrar'
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </>
            )}
          </Button>

          {currentStep < 4 && (
            <Button
              onClick={() => {
                if (currentStep === 2) {
                  validateData();
                } else if (currentStep === 3) {
                  handleImport();
                }
              }}
              disabled={
                (currentStep === 2 && !isReady) ||
                (currentStep === 3 && validCount === 0)
              }
            >
              {currentStep === 3 ? (
                <>
                  Importar {validCount} registros
                  <Upload className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          )}

          {currentStep === 4 && !importMutation.isPending && (
            <Button onClick={handleClose}>Finalizar</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
