import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { AlertCircle, Check, User, FileText, Users, RefreshCw, Plus } from 'lucide-react';
import type { ValidatedUnifiedRow } from './unifiedTypes';

interface UnifiedPreviewTableProps {
  validatedRows: ValidatedUnifiedRow[];
}

export function UnifiedPreviewTable({ validatedRows }: UnifiedPreviewTableProps) {
  const validCount = validatedRows.filter(r => r.isValid).length;
  const invalidCount = validatedRows.filter(r => !r.isValid).length;
  const updateCount = validatedRows.filter(r => r.isUpdate).length;
  const newClientCount = validatedRows.filter(r => r.isNewClient && r.isValid).length;
  const totalBeneficiaries = validatedRows.reduce((sum, r) => sum + r.beneficiaries.length, 0);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            Pólizas
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold">{validCount}</span>
            <span className="text-xs text-muted-foreground">válidas</span>
          </div>
          <div className="flex gap-2 mt-1 text-xs">
            <Badge variant="outline" className="text-xs">
              <Plus className="h-3 w-3 mr-1" />
              {validCount - updateCount} nuevas
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              {updateCount} actualizaciones
            </Badge>
          </div>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            Tomadores
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold">{newClientCount}</span>
            <span className="text-xs text-muted-foreground">nuevos</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {validCount - newClientCount} existentes
          </div>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            Beneficiarios
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold">{totalBeneficiaries}</span>
            <span className="text-xs text-muted-foreground">a importar</span>
          </div>
        </div>
        
        {invalidCount > 0 && (
          <div className="bg-destructive/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Con errores
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-destructive">{invalidCount}</span>
              <span className="text-xs text-muted-foreground">filas</span>
            </div>
          </div>
        )}
      </div>

      {/* Detailed view */}
      <ScrollArea className="h-[350px] rounded-md border">
        <Accordion type="multiple" className="w-full">
          {validatedRows.map((row, index) => (
            <AccordionItem key={row.policyNumber || index} value={String(index)}>
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3 flex-1 text-left">
                  {row.isValid ? (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{row.policyNumber || 'Sin número'}</span>
                      {row.isUpdate ? (
                        <Badge variant="secondary" className="text-xs">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Actualización
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Plus className="h-3 w-3 mr-1" />
                          Nueva
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {row.clientData.first_name} {row.clientData.last_name} ({row.clientData.identification_number})
                      {row.isNewClient && <span className="ml-1 text-primary">(nuevo tomador)</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {row.beneficiaries.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {row.beneficiaries.length}
                      </Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {/* Errors */}
                  {row.errors.length > 0 && (
                    <div className="bg-destructive/10 rounded-lg p-3">
                      <div className="text-sm font-medium text-destructive mb-2">Errores:</div>
                      <ul className="text-sm text-destructive space-y-1">
                        {row.errors.map((error, idx) => (
                          <li key={idx}>• {error.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Policy details */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Aseguradora:</span>
                      <span className="ml-2">{row.policyData.insurer_name || '-'}</span>
                      {row.resolvedInsurerId && <Check className="inline h-3 w-3 ml-1 text-primary" />}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Producto:</span>
                      <span className="ml-2">{row.policyData.product_name || '-'}</span>
                      {row.resolvedProductId && <Check className="inline h-3 w-3 ml-1 text-primary" />}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Estado:</span>
                      <span className="ml-2">{row.policyData.status || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fecha inicio:</span>
                      <span className="ml-2">{row.policyData.start_date || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fecha renovación:</span>
                      <span className="ml-2">{row.policyData.end_date || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prima:</span>
                      <span className="ml-2">{row.policyData.premium ? `$${row.policyData.premium}` : '-'}</span>
                    </div>
                  </div>
                  
                  {/* Beneficiaries */}
                  {row.beneficiaries.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Beneficiarios:</div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Identificación</TableHead>
                            <TableHead>Parentesco</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {row.beneficiaries.map((ben, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{ben.first_name} {ben.last_name}</TableCell>
                              <TableCell>{ben.identification_number || '-'}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{ben.relationship}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );
}
