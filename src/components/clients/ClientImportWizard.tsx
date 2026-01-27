import { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from 'lucide-react';

interface ClientImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedRow {
  [key: string]: string | number | null;
}

interface ColumnMapping {
  excelColumn: string;
  dbField: string | null;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ValidatedClient {
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

const DB_FIELDS = [
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

const IDENTIFICATION_TYPE_MAP: Record<string, string> = {
  'cedula': 'cedula',
  'cédula': 'cedula',
  'ci': 'cedula',
  'pasaporte': 'pasaporte',
  'passport': 'pasaporte',
  'rif': 'rif',
  'otro': 'otro',
  'other': 'otro',
};

const steps = [
  { id: 1, name: 'Subir archivo', description: 'Selecciona el archivo Excel' },
  { id: 2, name: 'Mapear columnas', description: 'Relaciona columnas con campos' },
  { id: 3, name: 'Validar datos', description: 'Revisa errores' },
  { id: 4, name: 'Importar', description: 'Ejecutar importación' },
];

export function ClientImportWizard({ open, onOpenChange }: ClientImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<ParsedRow[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [validatedClients, setValidatedClients] = useState<ValidatedClient[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
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

    // Parse file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
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
        const dataRows = jsonData.slice(1).filter((row: any) => 
          Object.values(row).some((cell) => cell !== null && cell !== undefined && cell !== '')
        );

        setHeaders(headerRow.map((h) => String(h || '').trim()));
        setRawData(dataRows.map((row: any) => {
          const obj: ParsedRow = {};
          headerRow.forEach((header, index) => {
            obj[String(header || `Column${index}`)] = row[index] ?? null;
          });
          return obj;
        }));

        // Auto-map columns
        const autoMappings: ColumnMapping[] = headerRow.map((header) => {
          const headerLower = String(header || '').toLowerCase().trim();
          let matchedField: string | null = null;

          // Try to auto-match based on common patterns
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

        setColumnMappings(autoMappings);
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

  const updateMapping = (excelColumn: string, dbField: string | null) => {
    setColumnMappings((prev) =>
      prev.map((m) => (m.excelColumn === excelColumn ? { ...m, dbField } : m))
    );
  };

  const validateData = useCallback(() => {
    const validated: ValidatedClient[] = rawData.map((row, index) => {
      const errors: ValidationError[] = [];
      const data: any = {};

      // Map data based on column mappings
      columnMappings.forEach((mapping) => {
        if (mapping.dbField) {
          let value = row[mapping.excelColumn];
          
          // Convert value to string if needed
          if (value !== null && value !== undefined) {
            value = String(value).trim();
          }
          
          // Handle identification type normalization
          if (mapping.dbField === 'identification_type' && value) {
            const normalized = IDENTIFICATION_TYPE_MAP[String(value).toLowerCase()];
            value = normalized || 'cedula';
          }
          
          // Handle date parsing
          if (mapping.dbField === 'birth_date' && value) {
            // Try to parse date
            const dateValue = value as string;
            if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // Already in correct format
            } else if (dateValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
              const parts = dateValue.split('/');
              value = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            } else if (dateValue.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
              const parts = dateValue.split('-');
              value = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            } else if (!isNaN(Number(dateValue))) {
              // Excel date serial number
              const excelDate = XLSX.SSF.parse_date_code(Number(dateValue));
              if (excelDate) {
                value = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
              }
            }
          }
          
          data[mapping.dbField] = value || undefined;
        }
      });

      // Set default identification type if not provided
      if (!data.identification_type) {
        data.identification_type = 'cedula';
      }

      // Validate required fields
      if (!data.identification_number) {
        errors.push({ row: index + 2, field: 'identification_number', message: 'Número de identificación requerido' });
      }
      if (!data.first_name) {
        errors.push({ row: index + 2, field: 'first_name', message: 'Nombres requerido' });
      }
      if (!data.last_name) {
        errors.push({ row: index + 2, field: 'last_name', message: 'Apellidos requerido' });
      }

      // Validate email format
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

    setValidatedClients(validated);
    setCurrentStep(3);
  }, [rawData, columnMappings]);

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuario no autenticado');

      const validClients = validatedClients.filter((c) => c.isValid);
      let successCount = 0;
      let failedCount = 0;

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

          const { error } = await supabase.from('clients').insert(clientToInsert);

          if (error) {
            failedCount++;
          } else {
            successCount++;
          }
        } catch {
          failedCount++;
        }

        setImportProgress(Math.round(((i + 1) / validClients.length) * 100));
      }

      // Audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_email: user.email,
        action: 'import',
        module: 'clients',
        details: {
          total_rows: validClients.length,
          success: successCount,
          failed: failedCount,
          file_name: file?.name,
        },
      });

      return { success: successCount, failed: failedCount };
    },
    onSuccess: (results) => {
      setImportResults(results);
      toast({
        title: 'Importación completada',
        description: `${results.success} clientes importados, ${results.failed} fallidos.`,
      });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
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
    setHeaders([]);
    setRawData([]);
    setColumnMappings([]);
    setValidatedClients([]);
    setImportProgress(0);
    setImportResults(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const templateData = [
      ['Tipo Identificación', 'Número Identificación', 'Nombres', 'Apellidos', 'Correo', 'Teléfono', 'Móvil', 'Dirección', 'Ciudad', 'Estado', 'Fecha Nacimiento', 'Ocupación', 'Lugar de Trabajo', 'Notas'],
      ['cedula', 'V-12345678', 'Juan', 'Pérez', 'juan@ejemplo.com', '0212-1234567', '0412-1234567', 'Av. Principal 123', 'Caracas', 'Distrito Capital', '1990-01-15', 'Ingeniero', 'Empresa XYZ', 'Cliente VIP'],
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, 'plantilla_clientes.xlsx');
  };

  const validCount = validatedClients.filter((c) => c.isValid).length;
  const invalidCount = validatedClients.filter((c) => !c.isValid).length;
  const progress = (currentStep / steps.length) * 100;

  const requiredFieldsMapped = DB_FIELDS.filter((f) => f.required).every((f) =>
    columnMappings.some((m) => m.dbField === f.value)
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Clientes desde Excel</DialogTitle>
          <DialogDescription>
            Importa múltiples clientes desde un archivo Excel o CSV
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
              
              <div className="flex justify-center">
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar plantilla
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {rawData.length} filas encontradas. Mapea las columnas del archivo con los campos del sistema.
                </p>
                <Badge variant={requiredFieldsMapped ? 'default' : 'destructive'}>
                  {requiredFieldsMapped ? 'Campos requeridos mapeados' : 'Faltan campos requeridos'}
                </Badge>
              </div>
              
              <ScrollArea className="h-[400px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Columna Excel</TableHead>
                      <TableHead>Ejemplo</TableHead>
                      <TableHead>Campo del sistema</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {headers.map((header) => {
                      const mapping = columnMappings.find((m) => m.excelColumn === header);
                      const sampleValue = rawData[0]?.[header];
                      
                      return (
                        <TableRow key={header}>
                          <TableCell className="font-medium">{header}</TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate">
                            {sampleValue !== null && sampleValue !== undefined ? String(sampleValue) : '-'}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={mapping?.dbField || 'none'}
                              onValueChange={(value) => updateMapping(header, value === 'none' ? null : value)}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="No importar" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No importar</SelectItem>
                                {DB_FIELDS.map((field) => (
                                  <SelectItem key={field.value} value={field.value}>
                                    {field.label} {field.required && '*'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
              
              <p className="text-xs text-muted-foreground">
                * Campos requeridos: Número de identificación, Nombres, Apellidos
              </p>
            </div>
          )}

          {/* Step 3: Validation */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="default" className="text-sm">
                  <Check className="h-3 w-3 mr-1" />
                  {validCount} válidos
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive" className="text-sm">
                    <X className="h-3 w-3 mr-1" />
                    {invalidCount} con errores
                  </Badge>
                )}
              </div>

              <ScrollArea className="h-[400px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Fila</TableHead>
                      <TableHead className="w-[60px]">Estado</TableHead>
                      <TableHead>Identificación</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Correo</TableHead>
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
                        <TableCell>
                          {client.data.first_name} {client.data.last_name}
                        </TableCell>
                        <TableCell>{client.data.email || '-'}</TableCell>
                        <TableCell>
                          {client.errors.map((err, i) => (
                            <span key={i} className="text-xs text-destructive block">
                              {err.message}
                            </span>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {/* Step 4: Import */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {!importResults ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-lg font-medium">Importando clientes...</p>
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
                    <p className="text-lg font-medium">Importación completada</p>
                    <div className="flex gap-4 mt-4">
                      <Badge variant="default" className="text-sm">
                        {importResults.success} importados correctamente
                      </Badge>
                      {importResults.failed > 0 && (
                        <Badge variant="destructive" className="text-sm">
                          {importResults.failed} fallidos
                        </Badge>
                      )}
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
            <Button disabled={!requiredFieldsMapped} onClick={validateData}>
              Validar datos
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}

          {currentStep === 3 && (
            <Button disabled={validCount === 0} onClick={handleImport}>
              Importar {validCount} clientes
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
