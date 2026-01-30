import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useJournalEntry } from '@/hooks/useFinances';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

const statusColors: Record<string, string> = {
  borrador: 'bg-yellow-100 text-yellow-800',
  publicado: 'bg-green-100 text-green-800',
  cerrado: 'bg-gray-100 text-gray-800',
};

interface JournalEntryDetailDialogProps {
  entryId: string | null;
  onClose: () => void;
}

export function JournalEntryDetailDialog({ entryId, onClose }: JournalEntryDetailDialogProps) {
  const { data: entry, isLoading } = useJournalEntry(entryId);

  return (
    <Dialog open={!!entryId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Asiento #{entry?.entry_number?.toString().padStart(5, '0') || '...'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : entry ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Fecha</p>
                <p className="font-medium">{format(new Date(entry.entry_date), 'dd/MM/yyyy')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Estado</p>
                <Badge className={statusColors[entry.status]}>{entry.status}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Moneda</p>
                <p className="font-medium">{entry.base_currency}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tasa ({entry.exchange_rate_source})</p>
                <p className="font-medium">{entry.exchange_rate.toLocaleString('es-VE')}</p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground text-sm">Descripción</p>
              <p className="font-medium">{entry.description}</p>
            </div>

            {entry.cost_center && (
              <div>
                <p className="text-muted-foreground text-sm">Centro de Costos</p>
                <p className="font-medium">{entry.cost_center.code} - {entry.cost_center.name}</p>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Cuenta</th>
                    <th className="p-2 text-left">Tipo</th>
                    <th className="p-2 text-right">Débito USD</th>
                    <th className="p-2 text-right">Crédito USD</th>
                    <th className="p-2 text-right">Débito VES</th>
                    <th className="p-2 text-right">Crédito VES</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.lines?.map((line) => (
                    <tr key={line.id} className="border-t">
                      <td className="p-2">
                        <span className="font-mono">{line.account?.code}</span>
                        <span className="ml-2">{line.account?.name}</span>
                      </td>
                      <td className="p-2 capitalize">{line.transaction_type}</td>
                      <td className="p-2 text-right font-mono">
                        {line.debit_usd > 0 ? formatCurrency(line.debit_usd) : '-'}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {line.credit_usd > 0 ? formatCurrency(line.credit_usd) : '-'}
                      </td>
                      <td className="p-2 text-right font-mono text-muted-foreground">
                        {line.debit_ves > 0 ? `Bs. ${line.debit_ves.toLocaleString('es-VE')}` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono text-muted-foreground">
                        {line.credit_ves > 0 ? `Bs. ${line.credit_ves.toLocaleString('es-VE')}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted font-medium">
                  <tr>
                    <td colSpan={2} className="p-2 text-right">TOTALES:</td>
                    <td className="p-2 text-right font-mono">{formatCurrency(entry.total_debit_usd)}</td>
                    <td className="p-2 text-right font-mono">{formatCurrency(entry.total_credit_usd)}</td>
                    <td className="p-2 text-right font-mono text-muted-foreground">
                      Bs. {entry.total_debit_ves.toLocaleString('es-VE')}
                    </td>
                    <td className="p-2 text-right font-mono text-muted-foreground">
                      Bs. {entry.total_credit_ves.toLocaleString('es-VE')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {entry.notes && (
              <div>
                <p className="text-muted-foreground text-sm">Notas</p>
                <p>{entry.notes}</p>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
