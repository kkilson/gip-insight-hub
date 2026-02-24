import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, Trash2, AlertTriangle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { BudgetLineFormData } from '@/hooks/useFinances';
import * as XLSX from 'xlsx';

interface BudgetBulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (lines: BudgetLineFormData[]) => void;
  startDate: string;
}

interface ParsedRow {
  day_of_month: number;
  description: string;
  amount_usd: number;
  amount_ves: number;
  can_pay_in_ves: boolean;
  error?: string;
}

export function BudgetBulkImportDialog({ open, onOpenChange, onImport, startDate }: BudgetBulkImportDialogProps) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const { toast } = useToast();

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(ws);

        const parsed: ParsedRow[] = json.map((row: any, i: number) => {
          const day = parseInt(row['Día'] || row['Dia'] || row['day'] || row['dia'] || '1');
          const desc = String(row['Descripción'] || row['Descripcion'] || row['description'] || row['concepto'] || '').trim();
          const usd = parseFloat(row['USD'] || row['usd'] || row['Monto USD'] || '0') || 0;
          const ves = parseFloat(row['VES'] || row['ves'] || row['Monto VES'] || row['Bs'] || '0') || 0;
          const bsRaw = row['Paga en Bs'] || row['Bs?'] || row['can_pay_in_ves'] || '';
          const canPayBs = ['si', 'sí', 'yes', 'true', '1', 'x'].includes(String(bsRaw).toLowerCase().trim());

          let error: string | undefined;
          if (!desc) error = 'Falta descripción';
          else if (day < 1 || day > 31 || isNaN(day)) error = 'Día inválido';
          else if (usd <= 0 && ves <= 0) error = 'Monto inválido';

          return { day_of_month: isNaN(day) ? 1 : day, description: desc, amount_usd: usd, amount_ves: ves, can_pay_in_ves: canPayBs, error };
        });

        setRows(parsed);
      } catch {
        toast({ title: 'Error al leer archivo', description: 'Verifica que sea un archivo Excel o CSV válido', variant: 'destructive' });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  }, [toast]);

  const removeRow = (index: number) => setRows(rows.filter((_, i) => i !== index));

  const validRows = rows.filter(r => !r.error);
  const errorRows = rows.filter(r => !!r.error);

  const handleImport = () => {
    const lines: BudgetLineFormData[] = validRows.map(r => {
      const [year, month] = startDate.split('-');
      const day = String(Math.min(Math.max(r.day_of_month, 1), 28)).padStart(2, '0');
      return {
        day_of_month: r.day_of_month,
        planned_date: `${year}-${month}-${day}`,
        description: r.description,
        can_pay_in_ves: r.can_pay_in_ves,
        amount_usd: r.amount_usd,
        amount_ves: r.amount_ves,
        reference_rate: null,
        status: 'pendiente' as const,
        reminder_date: null,
        category: null,
      };
    });
    onImport(lines);
    setRows([]);
    setFileName('');
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Día', 'Descripción', 'USD', 'VES', 'Paga en Bs'],
      [1, 'Alquiler oficina', 500, 0, 'No'],
      [15, 'Internet', 50, 1850, 'Sí'],
      [20, 'Servicios públicos', 0, 3500, 'Sí'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, 'plantilla_presupuesto.xlsx');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Carga Masiva de Líneas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-1" /> Descargar Plantilla
            </Button>
            <label>
              <Button variant="outline" size="sm" asChild>
                <span><Upload className="h-4 w-4 mr-1" /> Cargar Archivo</span>
              </Button>
              <Input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
            </label>
            {fileName && <Badge variant="secondary"><FileSpreadsheet className="h-3 w-3 mr-1" />{fileName}</Badge>}
          </div>

          {errorRows.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errorRows.length} fila(s) con errores serán omitidas</AlertDescription>
            </Alert>
          )}

          {rows.length > 0 && (
            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Día</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right w-[100px]">USD</TableHead>
                    <TableHead className="text-right w-[100px]">VES</TableHead>
                    <TableHead className="w-[60px]">Bs?</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i} className={row.error ? 'bg-destructive/10' : ''}>
                      <TableCell>{row.day_of_month}</TableCell>
                      <TableCell>
                        {row.description || <span className="text-destructive italic">vacío</span>}
                        {row.error && <span className="text-destructive text-xs block">{row.error}</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono">{row.amount_usd.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">{row.amount_ves.toFixed(2)}</TableCell>
                      <TableCell>{row.can_pay_in_ves ? 'Sí' : 'No'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeRow(i)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}

          {rows.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
              <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>Descarga la plantilla, llénala y cárgala aquí</p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => { onOpenChange(false); setRows([]); setFileName(''); }}>Cancelar</Button>
          <Button onClick={handleImport} disabled={validRows.length === 0}>
            Importar {validRows.length} línea{validRows.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
