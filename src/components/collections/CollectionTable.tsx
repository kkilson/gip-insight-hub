import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BulkActionsBar } from '@/components/ui/BulkActionsBar';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { 
  Collection, calculateDaysOverdue, CollectionStatus 
} from '@/hooks/useCollections';
import { useBrokerSettings } from '@/hooks/useBrokerSettings';
import { MoreHorizontal, Check, PhoneCall, Undo2, Eye, FileText, RefreshCw, Trash2 } from 'lucide-react';
import { MarkAsPaidDialog } from './MarkAsPaidDialog';
import { AdvisorContactDialog } from './AdvisorContactDialog';
import { CollectionDetailDialog } from './CollectionDetailDialog';
import { ChangeStatusDialog } from './ChangeStatusDialog';
import { generatePremiumNoticePdf } from './generatePremiumNoticePdf';

interface CollectionTableProps {
  collections: Collection[];
  isLoading: boolean;
  onBulkDelete?: (ids: string[]) => void;
  onBulkStatusChange?: (ids: string[], status: CollectionStatus) => void;
}

const statusLabels: Record<CollectionStatus, string> = {
  pendiente: 'Pendiente', contacto_asesor: 'Contacto Asesor', cobrada: 'Cobrada',
};

const statusVariants: Record<CollectionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendiente: 'destructive', contacto_asesor: 'secondary', cobrada: 'default',
};

function getDaysOverdueBadge(days: number, status: CollectionStatus) {
  if (status === 'cobrada') return null;
  if (days < 0) return <Badge variant="outline" className="text-xs">En {Math.abs(days)} días</Badge>;
  if (days === 0) return <Badge variant="secondary" className="text-xs">Hoy</Badge>;
  if (days <= 7) return <Badge variant="secondary" className="text-xs bg-warning/20 text-warning-foreground">{days} días</Badge>;
  if (days <= 30) return <Badge variant="secondary" className="text-xs bg-destructive/20 text-destructive">{days} días</Badge>;
  return <Badge variant="destructive" className="text-xs">{days} días</Badge>;
}

export function CollectionTable({ collections, isLoading, onBulkDelete, onBulkStatusChange }: CollectionTableProps) {
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [showPaidDialog, setShowPaidDialog] = useState(false);
  const [showAdvisorDialog, setShowAdvisorDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showChangeStatusDialog, setShowChangeStatusDialog] = useState(false);
  const { settings: brokerSettings } = useBrokerSettings();
  const bulk = useBulkSelection(collections);

  const handleGeneratePdf = async (collection: Collection) => {
    await generatePremiumNoticePdf(collection, brokerSettings);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]" />
              <TableHead>Cliente</TableHead><TableHead>Póliza</TableHead><TableHead>Asesores</TableHead>
              <TableHead>Vencimiento</TableHead><TableHead>Monto</TableHead><TableHead>Estado</TableHead>
              <TableHead>Mora</TableHead><TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}><TableCell colSpan={9} className="h-16"><div className="animate-pulse bg-muted rounded h-4 w-full" /></TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (collections.length === 0) {
    return <div className="rounded-md border p-8 text-center"><p className="text-muted-foreground">No se encontraron cobranzas.</p></div>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} aria-label="Seleccionar todos" />
              </TableHead>
              <TableHead>Cliente</TableHead><TableHead>Póliza</TableHead><TableHead>Asesores</TableHead>
              <TableHead>Vencimiento</TableHead><TableHead>Monto</TableHead><TableHead>Estado</TableHead>
              <TableHead>Mora</TableHead><TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.map((collection) => {
              const daysOverdue = calculateDaysOverdue(collection.due_date, collection.status);
              const primaryAdvisor = collection.policy?.policy_advisors?.find(pa => pa.advisor_role === 'principal')?.advisor;
              const secondaryAdvisor = collection.policy?.policy_advisors?.find(pa => pa.advisor_role === 'secundario')?.advisor;
              
              return (
                <TableRow key={collection.id} className={bulk.isSelected(collection.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox checked={bulk.isSelected(collection.id)} onCheckedChange={() => bulk.toggle(collection.id)} />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{collection.client?.first_name} {collection.client?.last_name}</p>
                      <p className="text-xs text-muted-foreground">{collection.client?.phone || collection.client?.mobile || collection.client?.email || 'Sin contacto'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-mono text-sm">{collection.policy?.policy_number || 'Sin número'}</p>
                      <p className="text-xs text-muted-foreground">
                        {collection.policy?.insurer?.short_name || collection.policy?.insurer?.name || ''}
                        {collection.policy?.product?.name ? ` - ${collection.policy.product.name}` : ''}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      {primaryAdvisor && <p className="text-xs font-medium">{primaryAdvisor.full_name}</p>}
                      {secondaryAdvisor && <p className="text-xs text-muted-foreground">{secondaryAdvisor.full_name}</p>}
                      {!primaryAdvisor && !secondaryAdvisor && <span className="text-xs text-muted-foreground">-</span>}
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(collection.due_date), 'dd MMM yyyy', { locale: es })}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(collection.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[collection.status]}>{statusLabels[collection.status]}</Badge>
                    {collection.status === 'contacto_asesor' && collection.promised_date && (
                      <p className="text-xs text-muted-foreground mt-1">Promesa: {format(new Date(collection.promised_date), 'dd/MM/yyyy')}</p>
                    )}
                  </TableCell>
                  <TableCell>{getDaysOverdueBadge(daysOverdue, collection.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedCollection(collection); setShowDetailDialog(true); }}><Eye className="mr-2 h-4 w-4" />Ver detalles</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleGeneratePdf(collection)}><FileText className="mr-2 h-4 w-4" />Aviso de Prima</DropdownMenuItem>
                        {collection.status !== 'cobrada' && (
                          <>
                            <DropdownMenuItem onClick={() => { setSelectedCollection(collection); setShowPaidDialog(true); }}><Check className="mr-2 h-4 w-4" />Marcar como cobrada</DropdownMenuItem>
                            {collection.status === 'pendiente' && (
                              <DropdownMenuItem onClick={() => { setSelectedCollection(collection); setShowAdvisorDialog(true); }}><PhoneCall className="mr-2 h-4 w-4" />Contacto con asesor</DropdownMenuItem>
                            )}
                            {collection.status === 'contacto_asesor' && (
                              <DropdownMenuItem onClick={() => { setSelectedCollection(collection); setShowAdvisorDialog(true); }}><Undo2 className="mr-2 h-4 w-4" />Cambiar fecha promesa</DropdownMenuItem>
                            )}
                          </>
                        )}
                        {(collection.status === 'cobrada' || collection.status === 'contacto_asesor') && (
                          <DropdownMenuItem onClick={() => { setSelectedCollection(collection); setShowChangeStatusDialog(true); }}><RefreshCw className="mr-2 h-4 w-4" />Cambiar estado</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <BulkActionsBar
        selectedCount={bulk.selectedCount}
        onClear={bulk.clearSelection}
        actions={[
          ...(onBulkDelete ? [{
            label: 'Eliminar',
            icon: <Trash2 className="h-4 w-4" />,
            variant: 'destructive' as const,
            confirm: true,
            confirmTitle: '¿Eliminar cobranzas seleccionadas?',
            confirmDescription: `Se eliminarán ${bulk.selectedCount} cobranza(s). Esta acción no se puede deshacer.`,
            onClick: () => { onBulkDelete(Array.from(bulk.selectedIds)); bulk.clearSelection(); },
          }] : []),
        ]}
      />

      {selectedCollection && (
        <>
          <MarkAsPaidDialog collection={selectedCollection} open={showPaidDialog} onOpenChange={setShowPaidDialog} />
          <AdvisorContactDialog collection={selectedCollection} open={showAdvisorDialog} onOpenChange={setShowAdvisorDialog} />
          <CollectionDetailDialog collection={selectedCollection} open={showDetailDialog} onOpenChange={setShowDetailDialog} />
          <ChangeStatusDialog collection={selectedCollection} open={showChangeStatusDialog} onOpenChange={setShowChangeStatusDialog} />
        </>
      )}
    </>
  );
}
