import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, TrendingDown, Upload } from 'lucide-react';
import { useExchangeRates, useLatestExchangeRates } from '@/hooks/useFinances';
import { FinanceBulkImportWizard } from './import/FinanceBulkImportWizard';
import { Skeleton } from '@/components/ui/skeleton';
import { ExchangeRateFormDialog } from './ExchangeRateFormDialog';

const sourceColors: Record<string, string> = {
  BCV: 'bg-blue-100 text-blue-800',
  Binance: 'bg-yellow-100 text-yellow-800',
  Kontigo: 'bg-green-100 text-green-800',
  Manual: 'bg-gray-100 text-gray-800',
};

export function ExchangeRatesTab() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  
  const { data: rates, isLoading } = useExchangeRates(50);
  const { data: latestRates } = useLatestExchangeRates();
  
  const getCurrentRates = () => {
    const currencies = ['USD', 'EUR', 'USDT'] as const;
    const sources = ['BCV', 'Binance', 'Kontigo'] as const;
    const result: { currency: string; source: string; rate: number | null; date: string | null }[] = [];
    
    for (const currency of currencies) {
      for (const source of sources) {
        const key = `${currency}_${source}`;
        const rateData = latestRates?.[key];
        result.push({
          currency,
          source,
          rate: rateData?.rate || null,
          date: rateData?.recorded_at || null,
        });
      }
    }
    
    return result;
  };

  return (
    <div className="space-y-6">
      {/* Current Rates Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {['USD', 'EUR', 'USDT'].map((currency) => (
          <Card key={currency}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{currency} / VES</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['BCV', 'Binance', 'Kontigo'].map((source) => {
                  const key = `${currency}_${source}`;
                  const rateData = latestRates?.[key];
                  return (
                    <div key={source} className="flex justify-between items-center">
                      <Badge className={sourceColors[source]}>{source}</Badge>
                      <div className="text-right">
                        {rateData ? (
                          <>
                            <span className="font-mono font-semibold">
                              {rateData.rate.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {format(new Date(rateData.recorded_at), 'dd/MM HH:mm')}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Sin datos</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Rate Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />Importar
        </Button>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Tasa
        </Button>
      </div>

      {/* Historical Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Tasas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rates?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay tasas registradas
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead className="text-right">Tasa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Motivo (si manual)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates?.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>
                      {format(new Date(rate.recorded_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell className="font-semibold">{rate.currency}</TableCell>
                    <TableCell>
                      <Badge className={sourceColors[rate.source]}>{rate.source}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {rate.rate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rate.is_manual ? 'outline' : 'secondary'}>
                        {rate.is_manual ? 'Manual' : 'Referencia'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {rate.manual_reason || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ExchangeRateFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />

      <FinanceBulkImportWizard open={importOpen} onOpenChange={setImportOpen} module="exchange_rates" />
    </div>
  );
}
