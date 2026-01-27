import { useState, useRef, useCallback, useEffect } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Upload,
  FileSpreadsheet,
  Check,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Download,
  User,
  FileText,
  Users,
} from 'lucide-react';
import { ColumnMappingTable } from './import/ColumnMappingTable';
import {
  type ParsedRow,
  type ColumnMapping,
  type ValidatedClient,
  type ValidatedPolicy,
  type ValidatedBeneficiary,
  CLIENT_DB_FIELDS,
  POLICY_DB_FIELDS,
  BENEFICIARY_DB_FIELDS,
} from './import/types';
import {
  autoMapClientColumns,
  autoMapPolicyColumns,
  autoMapBeneficiaryColumns,
  validateClients,
  validatePolicies,
  validateBeneficiaries,
  checkRequiredFieldsMapped,
  downloadTemplate,
} from './import/utils';

interface ClientImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type EntityType = 'client' | 'policy' | 'beneficiary';

interface SheetData {
  headers: string[];
  rawData: ParsedRow[];
  columnMappings: ColumnMapping[];
}

interface ImportResults {
  clients: { success: number; failed: number };
  policies: { success: number; failed: number };
  beneficiaries: { success: number; failed: number };
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
  const [activeTab, setActiveTab] = useState<EntityType>('client');
  
  // Sheet data for each entity type
  const [clientSheet, setClientSheet] = useState<SheetData | null>(null);
  const [policySheet, setPolicySheet] = useState<SheetData | null>(null);
  const [beneficiarySheet, setBeneficiarySheet] = useState<SheetData | null>(null);
  
  // Validated data
  const [validatedClients, setValidatedClients] = useState<ValidatedClient[]>([]);
  const [validatedPolicies, setValidatedPolicies] = useState<ValidatedPolicy[]>([]);
  const [validatedBeneficiaries, setValidatedBeneficiaries] = useState<ValidatedBeneficiary[]>([]);
  
  // Import state
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
        
        // Try to find sheets by name or use first 3 sheets
        const sheetNames = workbook.SheetNames;
        
        // Process each potential sheet
        const processSheet = (sheetIndex: number): SheetData | null => {
          if (sheetIndex >= sheetNames.length) return null;
          
          const worksheet = workbook.Sheets[sheetNames[sheetIndex]];
          const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, { header: 1 });
          
          if (jsonData.length < 2) return null;
          
          const headerRow = jsonData[0] as unknown as string[];
          const dataRows = jsonData.slice(1).filter((row: any) => 
            Object.values(row).some((cell) => cell !== null && cell !== undefined && cell !== '')
          );
          
          if (dataRows.length === 0) return null;
          
          const headers = headerRow.map((h) => String(h || '').trim());
          const rawData = dataRows.map((row: any) => {
            const obj: ParsedRow = {};
            headerRow.forEach((header, index) => {
              obj[String(header || `Column${index}`)] = row[index] ?? null;
            });
            return obj;
          });
          
          return { headers, rawData, columnMappings: [] };
        };

        // Detect sheet types based on headers or sheet names
        const detectSheetType = (sheet: SheetData, sheetName: string): EntityType | null => {
          const nameLower = sheetName.toLowerCase();
          const headersLower = sheet.headers.map(h => h.toLowerCase());
          
          // Check sheet name first
          if (nameLower.includes('tomador') || nameLower.includes('cliente') || nameLower === 'clients') {
            return 'client';
          }
          if (nameLower.includes('poliza') || nameLower.includes('póliza') || nameLower === 'policies') {
            return 'policy';
          }
          if (nameLower.includes('beneficiario') || nameLower === 'beneficiaries') {
            return 'beneficiary';
          }
          
          // Check headers
          if (headersLower.some(h => h.includes('parentesco') || h.includes('relacion'))) {
            return 'beneficiary';
          }
          if (headersLower.some(h => h.includes('aseguradora') || h.includes('prima') || (h.includes('poliza') && h.includes('numero')))) {
            return 'policy';
          }
          if (headersLower.some(h => h.includes('cedula') || h.includes('nombre'))) {
            return 'client';
          }
          
          return null;
        };

        // Process all sheets
        let foundClient = false;
        let foundPolicy = false;
        let foundBeneficiary = false;

        for (let i = 0; i < sheetNames.length && i < 5; i++) {
          const sheet = processSheet(i);
          if (!sheet) continue;
          
          const type = detectSheetType(sheet, sheetNames[i]);
          
          if (type === 'client' && !foundClient) {
            sheet.columnMappings = autoMapClientColumns(sheet.headers);
            setClientSheet(sheet);
            foundClient = true;
          } else if (type === 'policy' && !foundPolicy) {
            sheet.columnMappings = autoMapPolicyColumns(sheet.headers);
            setPolicySheet(sheet);
            foundPolicy = true;
          } else if (type === 'beneficiary' && !foundBeneficiary) {
            sheet.columnMappings = autoMapBeneficiaryColumns(sheet.headers);
            setBeneficiarySheet(sheet);
            foundBeneficiary = true;
          }
        }

        // If only one sheet, use it for clients by default
        if (!foundClient && !foundPolicy && !foundBeneficiary && sheetNames.length > 0) {
          const sheet = processSheet(0);
          if (sheet) {
            sheet.columnMappings = autoMapClientColumns(sheet.headers);
            setClientSheet(sheet);
          }
        }

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

  const updateMapping = (entityType: EntityType, excelColumn: string, dbField: string | null) => {
    const updateFn = (sheet: SheetData | null): SheetData | null => {
      if (!sheet) return null;
      return {
        ...sheet,
        columnMappings: sheet.columnMappings.map((m) =>
          m.excelColumn === excelColumn ? { ...m, dbField } : m
        ),
      };
    };

    if (entityType === 'client') setClientSheet(updateFn);
    else if (entityType === 'policy') setPolicySheet(updateFn);
    else setBeneficiarySheet(updateFn);
  };

  const validateData = useCallback(() => {
    // Validate clients
    if (clientSheet) {
      const validated = validateClients(clientSheet.rawData, clientSheet.columnMappings);
      setValidatedClients(validated);
    }

    // Validate policies - need to use both existing and newly validated clients
    if (policySheet) {
      const allClients = [...existingClients];
      // Add clients that will be imported
      if (clientSheet) {
        const validClients = validateClients(clientSheet.rawData, clientSheet.columnMappings)
          .filter(c => c.isValid)
          .map((c, i) => ({
            id: `new-${i}`,
            identification_number: c.data.identification_number,
          }));
        allClients.push(...validClients);
      }
      
      const validated = validatePolicies(
        policySheet.rawData,
        policySheet.columnMappings,
        allClients,
        insurers,
        products
      );
      setValidatedPolicies(validated);
    }

    // Validate beneficiaries
    if (beneficiarySheet) {
      const allPolicies = [...existingPolicies];
      // Add policies that will be imported
      if (policySheet) {
        const validPolicies = validatePolicies(
          policySheet.rawData,
          policySheet.columnMappings,
          existingClients,
          insurers,
          products
        )
          .filter(p => p.isValid && p.data.policy_number)
          .map((p, i) => ({
            id: `new-${i}`,
            policy_number: p.data.policy_number || null,
          }));
        allPolicies.push(...validPolicies);
      }
      
      const validated = validateBeneficiaries(
        beneficiarySheet.rawData,
        beneficiarySheet.columnMappings,
        allPolicies
      );
      setValidatedBeneficiaries(validated);
    }

    setCurrentStep(3);
  }, [clientSheet, policySheet, beneficiarySheet, existingClients, existingPolicies, insurers, products]);

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuario no autenticado');

      const results: ImportResults = {
        clients: { success: 0, failed: 0 },
        policies: { success: 0, failed: 0 },
        beneficiaries: { success: 0, failed: 0 },
      };

      const importedClientIds: Record<string, string> = {};
      const importedPolicyIds: Record<string, string> = {};

      // Phase 1: Import clients
      const validClients = validatedClients.filter((c) => c.isValid);
      if (validClients.length > 0) {
        setImportPhase('Importando tomadores...');
        
        for (let i = 0; i < validClients.length; i++) {
          const client = validClients[i];
          
          try {
            const clientToInsert = {
              identification_type: client.data.identification_type as 'cedula' | 'pasaporte' | 'rif' | 'otro',
              identification_number: client.data.identification_number,
              first_name: client.data.first_name,
              last_name: client.data.last_name,
              email: client.data.email || null,
              phone: client.data.phone || null,
              mobile: client.data.mobile || null,
              address: client.data.address || null,
              city: client.data.city || null,
              province: client.data.province || null,
              birth_date: client.data.birth_date || null,
              occupation: client.data.occupation || null,
              workplace: client.data.workplace || null,
              notes: client.data.notes || null,
              created_by: user.id,
            };

            const { data, error } = await supabase.from('clients').insert(clientToInsert).select('id').single();

            if (error) {
              results.clients.failed++;
            } else {
              results.clients.success++;
              importedClientIds[client.data.identification_number.toLowerCase()] = data.id;
            }
          } catch {
            results.clients.failed++;
          }

          setImportProgress(Math.round(((i + 1) / validClients.length) * 33));
        }
      }

      // Phase 2: Import policies
      const validPolicies = validatedPolicies.filter((p) => p.isValid);
      if (validPolicies.length > 0) {
        setImportPhase('Importando pólizas...');
        
        // Refetch clients to get newly created ones
        const { data: allClients } = await supabase
          .from('clients')
          .select('id, identification_number');
        
        const clientMap = new Map(
          (allClients || []).map(c => [c.identification_number.toLowerCase().replace(/[^a-z0-9]/gi, ''), c.id])
        );

        for (let i = 0; i < validPolicies.length; i++) {
          const policy = validPolicies[i];
          
          try {
            const clientId = policy.resolvedClientId?.startsWith('new-')
              ? clientMap.get(String(policy.data.client_identification).toLowerCase().replace(/[^a-z0-9]/gi, ''))
              : policy.resolvedClientId || clientMap.get(String(policy.data.client_identification).toLowerCase().replace(/[^a-z0-9]/gi, ''));

            if (!clientId) {
              results.policies.failed++;
              continue;
            }

            const policyToInsert = {
              client_id: clientId,
              insurer_id: policy.resolvedInsurerId || null,
              product_id: policy.resolvedProductId || null,
              policy_number: policy.data.policy_number || null,
              start_date: policy.data.start_date,
              end_date: policy.data.end_date,
              status: (policy.data.status || 'en_tramite') as 'vigente' | 'pendiente' | 'cancelada' | 'vencida' | 'en_tramite',
              premium: policy.data.premium ? parseFloat(policy.data.premium) : null,
              payment_frequency: (policy.data.payment_frequency || 'mensual') as 'mensual' | 'trimestral' | 'semestral' | 'anual' | 'mensual_10_cuotas' | 'mensual_12_cuotas' | 'bimensual',
              coverage_amount: policy.data.coverage_amount ? parseFloat(policy.data.coverage_amount) : null,
              deductible: policy.data.deductible ? parseFloat(policy.data.deductible) : null,
              premium_payment_date: policy.data.premium_payment_date || null,
              notes: policy.data.notes || null,
              created_by: user.id,
            };

            const { data, error } = await supabase.from('policies').insert(policyToInsert).select('id').single();

            if (error) {
              results.policies.failed++;
            } else {
              results.policies.success++;
              if (policy.data.policy_number) {
                importedPolicyIds[policy.data.policy_number.toLowerCase()] = data.id;
              }
            }
          } catch {
            results.policies.failed++;
          }

          setImportProgress(33 + Math.round(((i + 1) / validPolicies.length) * 33));
        }
      }

      // Phase 3: Import beneficiaries
      const validBeneficiaries = validatedBeneficiaries.filter((b) => b.isValid);
      if (validBeneficiaries.length > 0) {
        setImportPhase('Importando beneficiarios...');
        
        // Refetch policies to get newly created ones
        const { data: allPolicies } = await supabase
          .from('policies')
          .select('id, policy_number');
        
        const policyMap = new Map(
          (allPolicies || []).filter(p => p.policy_number).map(p => [p.policy_number!.toLowerCase(), p.id])
        );

        for (let i = 0; i < validBeneficiaries.length; i++) {
          const beneficiary = validBeneficiaries[i];
          
          try {
            const policyId = beneficiary.resolvedPolicyId?.startsWith('new-')
              ? policyMap.get(String(beneficiary.data.policy_number).toLowerCase())
              : beneficiary.resolvedPolicyId || policyMap.get(String(beneficiary.data.policy_number).toLowerCase());

            if (!policyId) {
              results.beneficiaries.failed++;
              continue;
            }

            const beneficiaryToInsert = {
              policy_id: policyId,
              first_name: beneficiary.data.first_name,
              last_name: beneficiary.data.last_name,
              identification_type: (beneficiary.data.identification_type || 'cedula') as 'cedula' | 'pasaporte' | 'rif' | 'otro',
              identification_number: beneficiary.data.identification_number || null,
              relationship: beneficiary.data.relationship as 'conyuge' | 'hijo' | 'padre' | 'madre' | 'hermano' | 'tomador_titular' | 'otro',
              percentage: beneficiary.data.percentage ? parseFloat(beneficiary.data.percentage) : 100,
              birth_date: beneficiary.data.birth_date || null,
              phone: beneficiary.data.phone || null,
              email: beneficiary.data.email || null,
            };

            const { error } = await supabase.from('beneficiaries').insert(beneficiaryToInsert);

            if (error) {
              results.beneficiaries.failed++;
            } else {
              results.beneficiaries.success++;
            }
          } catch {
            results.beneficiaries.failed++;
          }

          setImportProgress(66 + Math.round(((i + 1) / validBeneficiaries.length) * 34));
        }
      }

      // Audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_email: user.email,
        action: 'import',
        module: 'clients',
        details: {
          file_name: file?.name,
          clients: results.clients,
          policies: results.policies,
          beneficiaries: results.beneficiaries,
        },
      });

      return results;
    },
    onSuccess: (results) => {
      setImportResults(results);
      setImportPhase('');
      toast({
        title: 'Importación completada',
        description: `Tomadores: ${results.clients.success}, Pólizas: ${results.policies.success}, Beneficiarios: ${results.beneficiaries.success}`,
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
    setClientSheet(null);
    setPolicySheet(null);
    setBeneficiarySheet(null);
    setValidatedClients([]);
    setValidatedPolicies([]);
    setValidatedBeneficiaries([]);
    setImportProgress(0);
    setImportResults(null);
    setImportPhase('');
    setActiveTab('client');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onOpenChange(false);
  };

  // Check if required fields are mapped for each entity
  const clientsReady = !clientSheet || checkRequiredFieldsMapped(clientSheet.columnMappings, 'client');
  const policiesReady = !policySheet || checkRequiredFieldsMapped(policySheet.columnMappings, 'policy');
  const beneficiariesReady = !beneficiarySheet || checkRequiredFieldsMapped(beneficiarySheet.columnMappings, 'beneficiary');
  const allMapped = clientsReady && policiesReady && beneficiariesReady;
  const hasAnyData = clientSheet || policySheet || beneficiarySheet;

  // Count valid/invalid
  const clientValidCount = validatedClients.filter((c) => c.isValid).length;
  const clientInvalidCount = validatedClients.filter((c) => !c.isValid).length;
  const policyValidCount = validatedPolicies.filter((p) => p.isValid).length;
  const policyInvalidCount = validatedPolicies.filter((p) => !p.isValid).length;
  const beneficiaryValidCount = validatedBeneficiaries.filter((b) => b.isValid).length;
  const beneficiaryInvalidCount = validatedBeneficiaries.filter((b) => !b.isValid).length;

  const totalValid = clientValidCount + policyValidCount + beneficiaryValidCount;

  const progress = (currentStep / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar desde Excel</DialogTitle>
          <DialogDescription>
            Importa tomadores, pólizas y beneficiarios desde un archivo Excel
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
            <div className="space-y-6">
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
              
              <div className="grid grid-cols-3 gap-4">
                <Button variant="outline" onClick={() => downloadTemplate('client')} className="flex-col h-auto py-4">
                  <User className="h-5 w-5 mb-2" />
                  <span className="text-xs">Plantilla Tomadores</span>
                </Button>
                <Button variant="outline" onClick={() => downloadTemplate('policy')} className="flex-col h-auto py-4">
                  <FileText className="h-5 w-5 mb-2" />
                  <span className="text-xs">Plantilla Pólizas</span>
                </Button>
                <Button variant="outline" onClick={() => downloadTemplate('beneficiary')} className="flex-col h-auto py-4">
                  <Users className="h-5 w-5 mb-2" />
                  <span className="text-xs">Plantilla Beneficiarios</span>
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                El archivo puede tener múltiples hojas. Nombra las hojas como "Tomadores", "Pólizas" y "Beneficiarios" para auto-detección.
              </p>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EntityType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="client" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Tomadores
                    {clientSheet && (
                      <Badge variant={clientsReady ? 'default' : 'destructive'} className="ml-1 text-xs">
                        {clientSheet.rawData.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="policy" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Pólizas
                    {policySheet && (
                      <Badge variant={policiesReady ? 'default' : 'destructive'} className="ml-1 text-xs">
                        {policySheet.rawData.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="beneficiary" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Beneficiarios
                    {beneficiarySheet && (
                      <Badge variant={beneficiariesReady ? 'default' : 'destructive'} className="ml-1 text-xs">
                        {beneficiarySheet.rawData.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="client" className="mt-4">
                  {clientSheet ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {clientSheet.rawData.length} filas encontradas
                        </p>
                        <Badge variant={clientsReady ? 'default' : 'destructive'}>
                          {clientsReady ? 'Campos requeridos mapeados' : 'Faltan campos requeridos'}
                        </Badge>
                      </div>
                      <ColumnMappingTable
                        headers={clientSheet.headers}
                        rawData={clientSheet.rawData}
                        columnMappings={clientSheet.columnMappings}
                        dbFields={CLIENT_DB_FIELDS}
                        onUpdateMapping={(col, field) => updateMapping('client', col, field)}
                      />
                      <p className="text-xs text-muted-foreground">
                        * Campos requeridos: Número de identificación, Nombres, Apellidos
                      </p>
                    </div>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <User className="h-8 w-8 mb-2 opacity-50" />
                        <p>No se detectó hoja de tomadores en el archivo</p>
                        <p className="text-xs mt-1">Añade una hoja llamada "Tomadores" o "Clientes"</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="policy" className="mt-4">
                  {policySheet ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {policySheet.rawData.length} filas encontradas
                        </p>
                        <Badge variant={policiesReady ? 'default' : 'destructive'}>
                          {policiesReady ? 'Campos requeridos mapeados' : 'Faltan campos requeridos'}
                        </Badge>
                      </div>
                      <ColumnMappingTable
                        headers={policySheet.headers}
                        rawData={policySheet.rawData}
                        columnMappings={policySheet.columnMappings}
                        dbFields={POLICY_DB_FIELDS}
                        onUpdateMapping={(col, field) => updateMapping('policy', col, field)}
                      />
                      <p className="text-xs text-muted-foreground">
                        * Campos requeridos: Cédula del tomador, Fecha de inicio, Fecha de renovación
                      </p>
                    </div>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <FileText className="h-8 w-8 mb-2 opacity-50" />
                        <p>No se detectó hoja de pólizas en el archivo</p>
                        <p className="text-xs mt-1">Añade una hoja llamada "Pólizas" o "Policies"</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="beneficiary" className="mt-4">
                  {beneficiarySheet ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {beneficiarySheet.rawData.length} filas encontradas
                        </p>
                        <Badge variant={beneficiariesReady ? 'default' : 'destructive'}>
                          {beneficiariesReady ? 'Campos requeridos mapeados' : 'Faltan campos requeridos'}
                        </Badge>
                      </div>
                      <ColumnMappingTable
                        headers={beneficiarySheet.headers}
                        rawData={beneficiarySheet.rawData}
                        columnMappings={beneficiarySheet.columnMappings}
                        dbFields={BENEFICIARY_DB_FIELDS}
                        onUpdateMapping={(col, field) => updateMapping('beneficiary', col, field)}
                      />
                      <p className="text-xs text-muted-foreground">
                        * Campos requeridos: Número de póliza, Nombres, Apellidos, Parentesco
                      </p>
                    </div>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mb-2 opacity-50" />
                        <p>No se detectó hoja de beneficiarios en el archivo</p>
                        <p className="text-xs mt-1">Añade una hoja llamada "Beneficiarios"</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Step 3: Validation */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EntityType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="client" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Tomadores
                    <Badge variant={clientInvalidCount > 0 ? 'destructive' : 'default'} className="ml-1 text-xs">
                      {clientValidCount}/{validatedClients.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="policy" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Pólizas
                    <Badge variant={policyInvalidCount > 0 ? 'destructive' : 'default'} className="ml-1 text-xs">
                      {policyValidCount}/{validatedPolicies.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="beneficiary" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Beneficiarios
                    <Badge variant={beneficiaryInvalidCount > 0 ? 'destructive' : 'default'} className="ml-1 text-xs">
                      {beneficiaryValidCount}/{validatedBeneficiaries.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="client" className="mt-4">
                  {validatedClients.length > 0 ? (
                    <ScrollArea className="h-[350px] rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px]">Fila</TableHead>
                            <TableHead className="w-[60px]">Estado</TableHead>
                            <TableHead>Identificación</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Errores</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validatedClients.map((client) => (
                            <TableRow key={client.row} className={!client.isValid ? 'bg-destructive/5' : ''}>
                              <TableCell>{client.row}</TableCell>
                              <TableCell>
                                {client.isValid ? (
                                  <Check className="h-4 w-4 text-primary" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-destructive" />
                                )}
                              </TableCell>
                              <TableCell>{client.data.identification_number || '-'}</TableCell>
                              <TableCell>{client.data.first_name} {client.data.last_name}</TableCell>
                              <TableCell>
                                {client.errors.map((err, i) => (
                                  <span key={i} className="text-xs text-destructive block">{err.message}</span>
                                ))}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <p>No hay datos de tomadores para validar</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="policy" className="mt-4">
                  {validatedPolicies.length > 0 ? (
                    <ScrollArea className="h-[350px] rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px]">Fila</TableHead>
                            <TableHead className="w-[60px]">Estado</TableHead>
                            <TableHead>Tomador</TableHead>
                            <TableHead>Póliza</TableHead>
                            <TableHead>Fechas</TableHead>
                            <TableHead>Errores</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validatedPolicies.map((policy) => (
                            <TableRow key={policy.row} className={!policy.isValid ? 'bg-destructive/5' : ''}>
                              <TableCell>{policy.row}</TableCell>
                              <TableCell>
                                {policy.isValid ? (
                                  <Check className="h-4 w-4 text-primary" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-destructive" />
                                )}
                              </TableCell>
                              <TableCell>{policy.data.client_identification || '-'}</TableCell>
                              <TableCell>{policy.data.policy_number || '-'}</TableCell>
                              <TableCell className="text-xs">
                                {policy.data.start_date} - {policy.data.end_date}
                              </TableCell>
                              <TableCell>
                                {policy.errors.map((err, i) => (
                                  <span key={i} className="text-xs text-destructive block">{err.message}</span>
                                ))}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <p>No hay datos de pólizas para validar</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="beneficiary" className="mt-4">
                  {validatedBeneficiaries.length > 0 ? (
                    <ScrollArea className="h-[350px] rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px]">Fila</TableHead>
                            <TableHead className="w-[60px]">Estado</TableHead>
                            <TableHead>Póliza</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Parentesco</TableHead>
                            <TableHead>Errores</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validatedBeneficiaries.map((ben) => (
                            <TableRow key={ben.row} className={!ben.isValid ? 'bg-destructive/5' : ''}>
                              <TableCell>{ben.row}</TableCell>
                              <TableCell>
                                {ben.isValid ? (
                                  <Check className="h-4 w-4 text-primary" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-destructive" />
                                )}
                              </TableCell>
                              <TableCell>{ben.data.policy_number || '-'}</TableCell>
                              <TableCell>{ben.data.first_name} {ben.data.last_name}</TableCell>
                              <TableCell>{ben.data.relationship || '-'}</TableCell>
                              <TableCell>
                                {ben.errors.map((err, i) => (
                                  <span key={i} className="text-xs text-destructive block">{err.message}</span>
                                ))}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <p>No hay datos de beneficiarios para validar</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Step 4: Import */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {!importResults ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-lg font-medium">{importPhase || 'Importando...'}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {importProgress}% completado
                    </p>
                    <Progress value={importProgress} className="w-full max-w-md mt-4" />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Check className="h-12 w-12 text-primary mb-4" />
                    <p className="text-lg font-medium mb-4">Importación completada</p>
                    <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Tomadores
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-primary">{importResults.clients.success}</div>
                          {importResults.clients.failed > 0 && (
                            <p className="text-xs text-destructive">{importResults.clients.failed} fallidos</p>
                          )}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Pólizas
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-primary">{importResults.policies.success}</div>
                          {importResults.policies.failed > 0 && (
                            <p className="text-xs text-destructive">{importResults.policies.failed} fallidos</p>
                          )}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Beneficiarios
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-primary">{importResults.beneficiaries.success}</div>
                          {importResults.beneficiaries.failed > 0 && (
                            <p className="text-xs text-destructive">{importResults.beneficiaries.failed} fallidos</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => currentStep > 1 && !importMutation.isPending ? setCurrentStep(currentStep - 1) : handleClose()}
            disabled={importMutation.isPending}
          >
            {currentStep === 1 ? (
              'Cancelar'
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </>
            )}
          </Button>

          {currentStep === 1 && (
            <Button disabled={!file} onClick={() => setCurrentStep(2)}>
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}

          {currentStep === 2 && (
            <Button disabled={!allMapped || !hasAnyData} onClick={validateData}>
              Validar datos
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}

          {currentStep === 3 && (
            <Button disabled={totalValid === 0} onClick={handleImport}>
              Importar {totalValid} registros
              <Upload className="h-4 w-4 ml-1" />
            </Button>
          )}

          {currentStep === 4 && importResults && (
            <Button onClick={handleClose}>
              <Check className="h-4 w-4 mr-1" />
              Finalizar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
