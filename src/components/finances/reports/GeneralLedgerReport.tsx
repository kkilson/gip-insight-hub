import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { useChartOfAccounts, useJournalEntries } from '@/hooks/useFinances';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

interface GeneralLedgerReportProps {
  startDate: string;
  endDate: string;
}

export function GeneralLedgerReport({ startDate, endDate }: GeneralLedgerReportProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  
  const { data: accounts, isLoading: loadingAccounts } = useChartOfAccounts();
  const { data: entries, isLoading: loadingEntries } = useJournalEntries({
    startDate,
    endDate,
    status: 'publicado',
  });

  const leafAccounts = accounts?.filter(a => a.level >= 3) || [];
  const selectedAccount = accounts?.find(a => a.id === selectedAccountId);

  // Build ledger entries for selected account
  const ledgerEntries: {
    date: string;
    entryNumber: number;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }[] = [];

  let runningBalance = 0; // Would need to get opening balance

  if (selectedAccountId !== 'all' && entries) {
    for (const entry of entries) {
      // We'd need to fetch lines for each entry - simplified for now
      // In production, you'd join this data
    }
  }

  if (loadingAccounts || loadingEntries) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Libro Mayor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <CardTitle>Libro Mayor</CardTitle>
            <p className="text-sm text-muted-foreground">
              Período: {startDate} al {endDate}
            </p>
          </div>
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Seleccionar cuenta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las cuentas</SelectItem>
              {leafAccounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {selectedAccountId === 'all' ? (
          <div className="text-center py-8 text-muted-foreground">
            Selecciona una cuenta para ver su libro mayor
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cuenta</p>
                  <p className="font-semibold">{selectedAccount?.code} - {selectedAccount?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clase</p>
                  <p className="font-semibold capitalize">{selectedAccount?.class}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Naturaleza</p>
                  <p className="font-semibold capitalize">{selectedAccount?.nature}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Actual</p>
                  <p className="font-semibold font-mono">
                    {formatCurrency(selectedAccount?.balance_usd || 0)}
                  </p>
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Fecha</TableHead>
                  <TableHead className="w-[80px]"># Asiento</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right w-[120px]">Débito</TableHead>
                  <TableHead className="text-right w-[120px]">Crédito</TableHead>
                  <TableHead className="text-right w-[120px]">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hay movimientos para esta cuenta en el período seleccionado
                    </TableCell>
                  </TableRow>
                ) : (
                  ledgerEntries.map((entry, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell className="font-mono">#{entry.entryNumber.toString().padStart(5, '0')}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : ''}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : ''}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatCurrency(entry.balance)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
