import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Download, Upload, RefreshCw, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSaveBatch, useSaveEntries } from '@/hooks/useCommissions';
import { useToast } from '@/hooks/use-toast';
import { loadConfig, type BatchConfig } from './BatchConfigPanel';
import * as XLSX from 'xlsx';

interface ParsedBatch {
  insurer_name: string;
  insurer_id: string | null;
  currency: string;
  entries: Array<{
    policy_number: string;
    client_name: string;
    advisor_name: string;
    advisor_id: string | null;
    plan_type: string;
    premium: number;
    commission_rate: number;
    commission_amount: number;
  }>;
}

export function BulkExcelImport() {
  const [parsedBatches, setParsedBatches] = useState<ParsedBatch[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const saveBatch = useSaveBatch();
  const saveEntries = useSaveEntries();

  const { data: insurers } = useQuery({
    queryKey: ['insurers-list'],
    queryFn: async () => {
      const { data } = await supabase.from('insurers').select('id, name').eq('is_active', true).order('name');
      return data || [];
    },
  });

  const { data: advisors } = useQuery({
    queryKey: ['advisors-list'],
    queryFn: async () => {
      const { data } = await supabase.from('advisors').select('id, full_name').eq('is_active', true).order('full_name');
      return data || [];
    },
  });

  const config = loadConfig();

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Main data sheet
    const headers = ['Aseguradora', 'Moneda', 'Póliza', 'Cliente', 'Asesor', 'Plan', 'Prima', '% Comisión', 'Monto Comisión'];
    const exampleRow = [
      insurers?.[0]?.name || 'Nombre Aseguradora',
      config.defaultCurrency || 'USD',
      'POL-001',
      'Juan Pérez',
      advisors?.[0]?.full_name || 'Nombre Asesor',
      'Vida',
      '1000',
      '15',
      '150',
    ];
    const wsData = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    wsData['!cols'] = headers.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, wsData, 'Comisiones');

    // Insurers reference sheet
    const filteredInsurers = config.selectedInsurers.length > 0
      ? insurers?.filter(i => config.selectedInsurers.includes(i.id)) || []
      : insurers || [];
    const insSheet = XLSX.utils.aoa_to_sheet([
      ['Aseguradoras Disponibles'],
      ...filteredInsurers.map(i => [i.name]),
    ]);
    XLSX.utils.book_append_sheet(wb, insSheet, 'Aseguradoras');

    // Advisors reference sheet
    const filteredAdvisors = config.selectedAdvisors.length > 0
      ? advisors?.filter(a => config.selectedAdvisors.includes(a.id)) || []
      : advisors || [];
    const advSheet = XLSX.utils.aoa_to_sheet([
      ['Asesores Disponibles'],
      ...filteredAdvisors.map(a => [a.full_name]),
    ]);
    XLSX.utils.book_append_sheet(wb, advSheet, 'Asesores');

    // Currencies sheet
    const curSheet = XLSX.utils.aoa_to_sheet([
      ['Monedas Disponibles'],
      ['USD'],
      ['BS'],
    ]);
    XLSX.utils.book_append_sheet(wb, curSheet, 'Monedas');

    XLSX.writeFile(wb, `Plantilla_Comisiones_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: 'Plantilla descargada con configuración actualizada' });
  };

  const findInsurerId = (name: string): string | null => {
    if (!name || !insurers) return null;
    const n = name.trim().toLowerCase();
    const found = insurers.find(i => i.name.toLowerCase() === n);
    return found?.id || null;
  };

  const findAdvisorId = (name: string): string | null => {
    if (!name || !advisors) return null;
    const n = name.trim().toLowerCase();
    const found = advisors.find(a => a.full_name.toLowerCase() === n);
    return found?.id || null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        // Group by insurer + currency
        const groups = new Map<string, ParsedBatch>();
        rows.forEach(r => {
          const insurerName = String(r['Aseguradora'] || r['aseguradora'] || r['ASEGURADORA'] || '').trim();
          const currency = String(r['Moneda'] || r['moneda'] || r['MONEDA'] || config.defaultCurrency).trim().toUpperCase();
          const key = `${insurerName}|${currency}`;

          if (!groups.has(key)) {
            groups.set(key, {
              insurer_name: insurerName,
              insurer_id: findInsurerId(insurerName),
              currency,
              entries: [],
            });
          }

          const premium = parseFloat(r['Prima'] || r['prima'] || r['PRIMA'] || 0);
          const rate = parseFloat(r['% Comisión'] || r['% comisión'] || r['% COMISION'] || r['commission_rate'] || 0);
          const advisorName = String(r['Asesor'] || r['asesor'] || r['ASESOR'] || '').trim();

          groups.get(key)!.entries.push({
            policy_number: String(r['Póliza'] || r['poliza'] || r['POLIZA'] || ''),
            client_name: String(r['Cliente'] || r['cliente'] || r['CLIENTE'] || ''),
            advisor_name: advisorName,
            advisor_id: findAdvisorId(advisorName),
            plan_type: String(r['Plan'] || r['plan'] || r['PLAN'] || ''),
            premium,
            commission_rate: rate,
            commission_amount: parseFloat(r['Monto Comisión'] || r['monto comisión'] || '') || (premium * rate / 100),
          });
        });

        setParsedBatches(Array.from(groups.values()).filter(b => b.entries.length > 0));
        setShowPreview(true);
        toast({ title: `${rows.length} registros leídos, ${groups.size} lotes detectados` });
      } catch {
        toast({ title: 'Error leyendo el archivo Excel', variant: 'destructive' });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleBulkCreate = async () => {
    setIsProcessing(true);
    let created = 0;
    try {
      for (const batch of parsedBatches) {
        if (!batch.insurer_id) continue;
        const validEntries = batch.entries.filter(e => e.client_name && e.premium > 0);
        if (validEntries.length === 0) continue;

        const batchData = await saveBatch.mutateAsync({
          insurer_id: batch.insurer_id,
          batch_date: new Date().toISOString().split('T')[0],
          currency: batch.currency,
          notes: `Carga masiva - ${validEntries.length} pólizas`,
        });

        await saveEntries.mutateAsync(validEntries.map(e => ({
          batch_id: batchData.id,
          policy_number: e.policy_number || undefined,
          client_name: e.client_name,
          insurer_id: batch.insurer_id!,
          plan_type: e.plan_type || undefined,
          premium: e.premium,
          commission_rate: e.commission_rate,
          commission_amount: e.commission_amount,
        })));
        created++;
      }

      toast({ title: `${created} lotes creados exitosamente` });
      setShowPreview(false);
      setParsedBatches([]);
    } catch {
      toast({ title: 'Error creando lotes', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const totalEntries = parsedBatches.reduce((s, b) => s + b.entries.length, 0);
  const unmatchedInsurers = parsedBatches.filter(b => !b.insurer_id);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Carga Masiva por Excel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Descarga la plantilla con tus aseguradoras y asesores configurados, llénala y cárgala para crear todos los lotes automáticamente.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla
            </Button>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refrescar Plantilla
            </Button>
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Cargar Excel completado</Label>
            <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa — Carga Masiva</DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 text-sm">
            <Badge variant="secondary">{parsedBatches.length} lotes</Badge>
            <Badge variant="secondary">{totalEntries} pólizas</Badge>
            {unmatchedInsurers.length > 0 && (
              <Badge variant="destructive">{unmatchedInsurers.length} aseguradoras no encontradas</Badge>
            )}
          </div>

          <div className="space-y-4">
            {parsedBatches.map((batch, i) => (
              <Card key={i} className={!batch.insurer_id ? 'border-destructive' : ''}>
                <CardHeader className="py-2 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {batch.insurer_id ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="font-medium text-sm">{batch.insurer_name || 'Sin aseguradora'}</span>
                      <Badge variant="outline">{batch.currency}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{batch.entries.length} pólizas</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Póliza</TableHead>
                        <TableHead className="text-xs">Cliente</TableHead>
                        <TableHead className="text-xs">Asesor</TableHead>
                        <TableHead className="text-xs">Plan</TableHead>
                        <TableHead className="text-xs text-right">Prima</TableHead>
                        <TableHead className="text-xs text-right">% Com.</TableHead>
                        <TableHead className="text-xs text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batch.entries.slice(0, 5).map((e, j) => (
                        <TableRow key={j}>
                          <TableCell className="text-xs">{e.policy_number}</TableCell>
                          <TableCell className="text-xs">{e.client_name}</TableCell>
                          <TableCell className="text-xs">
                            <span className={e.advisor_id ? '' : 'text-amber-500'}>{e.advisor_name || '—'}</span>
                          </TableCell>
                          <TableCell className="text-xs">{e.plan_type}</TableCell>
                          <TableCell className="text-xs text-right">{e.premium.toLocaleString('es', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-xs text-right">{e.commission_rate}%</TableCell>
                          <TableCell className="text-xs text-right">{e.commission_amount.toLocaleString('es', { minimumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      ))}
                      {batch.entries.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-xs text-center text-muted-foreground">
                            ... y {batch.entries.length - 5} más
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>Cancelar</Button>
            <Button onClick={handleBulkCreate} disabled={isProcessing || parsedBatches.every(b => !b.insurer_id)}>
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear {parsedBatches.filter(b => b.insurer_id).length} Lotes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
