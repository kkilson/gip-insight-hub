import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, DollarSign, TrendingUp, Calculator } from 'lucide-react';
import { usePayrollEmployees, useSaveEmployee, useDeleteEmployee, PayrollEmployee } from '@/hooks/usePayroll';
import { useLatestExchangeRates } from '@/hooks/useFinances';

function formatNumber(n: number, decimals = 2) {
  return n.toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function PayrollTab() {
  const { data: employees, isLoading } = usePayrollEmployees();
  const { data: latestRates } = useLatestExchangeRates();
  const saveEmployee = useSaveEmployee();
  const deleteEmployee = useDeleteEmployee();

  const [tasaBCV, setTasaBCV] = useState<string>('');
  const [tasaBinance, setTasaBinance] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<PayrollEmployee | null>(null);
  const [formName, setFormName] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Pre-fill rates from latest exchange rates
  useEffect(() => {
    if (latestRates) {
      const bcv = latestRates['USD_BCV'];
      const binance = latestRates['USD_Binance'];
      if (bcv && !tasaBCV) setTasaBCV(String(bcv.rate));
      if (binance && !tasaBinance) setTasaBinance(String(binance.rate));
    }
  }, [latestRates]);

  const bcvNum = parseFloat(tasaBCV) || 0;
  const binanceNum = parseFloat(tasaBinance) || 0;
  const tasaPromedio = bcvNum > 0 && binanceNum > 0 ? (bcvNum + binanceNum) / 2 : 0;

  const calculations = useMemo(() => {
    if (!employees || tasaPromedio === 0) return [];
    return employees.map(emp => {
      const base = emp.base_salary_usd;
      const ves = base * binanceNum;
      const usdAjustado = ves / tasaPromedio;
      const diferencia = usdAjustado - base;
      return { ...emp, ves, usdAjustado, diferencia };
    });
  }, [employees, binanceNum, tasaPromedio]);

  const totals = useMemo(() => {
    return calculations.reduce(
      (acc, c) => ({
        base: acc.base + c.base_salary_usd,
        ves: acc.ves + c.ves,
        usdAjustado: acc.usdAjustado + c.usdAjustado,
        diferencia: acc.diferencia + c.diferencia,
      }),
      { base: 0, ves: 0, usdAjustado: 0, diferencia: 0 }
    );
  }, [calculations]);

  const sobrecosteoPct = totals.base > 0 ? (totals.diferencia / totals.base) * 100 : 0;

  const openAddDialog = () => {
    setEditingEmployee(null);
    setFormName('');
    setFormSalary('');
    setFormNotes('');
    setDialogOpen(true);
  };

  const openEditDialog = (emp: PayrollEmployee) => {
    setEditingEmployee(emp);
    setFormName(emp.full_name);
    setFormSalary(String(emp.base_salary_usd));
    setFormNotes(emp.notes || '');
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formSalary.trim()) return;
    saveEmployee.mutate(
      { id: editingEmployee?.id, full_name: formName.trim(), base_salary_usd: parseFloat(formSalary), notes: formNotes.trim() || undefined },
      { onSuccess: () => setDialogOpen(false) }
    );
  };

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Rate inputs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa BCV</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              step="0.01"
              value={tasaBCV}
              onChange={e => setTasaBCV(e.target.value)}
              placeholder="Ej: 411.08"
              className="text-lg font-semibold"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa Binance</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              step="0.01"
              value={tasaBinance}
              onChange={e => setTasaBinance(e.target.value)}
              placeholder="Ej: 615.88"
              className="text-lg font-semibold"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {tasaPromedio > 0 ? `Bs. ${formatNumber(tasaPromedio)}` : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">(BCV + Binance) / 2</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary cards */}
      {calculations.length > 0 && tasaPromedio > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Nómina en USD</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${formatNumber(totals.base)}</p>
              <p className="text-xs text-muted-foreground">Si paga directamente en dólares</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Nómina en VES → USD</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${formatNumber(totals.usdAjustado)}</p>
              <p className="text-xs text-muted-foreground">Costo real si paga en bolívares</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sobrecosto por Tasa</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">
                +${formatNumber(totals.diferencia)} ({formatNumber(sobrecosteoPct)}%)
              </p>
              <p className="text-xs text-muted-foreground">Diferencia entre pagar en USD vs VES</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Employees table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Empleados y Cálculo de Nómina</CardTitle>
          <Button size="sm" onClick={openAddDialog}><Plus className="h-4 w-4 mr-1" /> Agregar</Button>
        </CardHeader>
        <CardContent>
          {calculations.length === 0 && !isLoading ? (
            <p className="text-center text-muted-foreground py-8">No hay empleados registrados. Agrega uno para comenzar.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead className="text-right">Salario USD</TableHead>
                  <TableHead className="text-right">Pago en USD</TableHead>
                  {tasaPromedio > 0 && (
                    <>
                      <TableHead className="text-right">VES (× Binance)</TableHead>
                      <TableHead className="text-right">USD Ajustado</TableHead>
                      <TableHead className="text-right">Diferencia</TableHead>
                    </>
                  )}
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculations.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.full_name}</TableCell>
                    <TableCell className="text-right">${formatNumber(c.base_salary_usd)}</TableCell>
                    <TableCell className="text-right">${formatNumber(c.base_salary_usd)}</TableCell>
                    {tasaPromedio > 0 && (
                      <>
                        <TableCell className="text-right">Bs. {formatNumber(c.ves)}</TableCell>
                        <TableCell className="text-right font-semibold">${formatNumber(c.usdAjustado)}</TableCell>
                        <TableCell className="text-right text-destructive font-semibold">+${formatNumber(c.diferencia)}</TableCell>
                      </>
                    )}
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteEmployee.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {tasaPromedio > 0 && calculations.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Totales</TableCell>
                    <TableCell className="text-right font-bold">${formatNumber(totals.base)}</TableCell>
                    <TableCell className="text-right font-bold">${formatNumber(totals.base)}</TableCell>
                    <TableCell className="text-right font-bold">Bs. {formatNumber(totals.ves)}</TableCell>
                    <TableCell className="text-right font-bold">${formatNumber(totals.usdAjustado)}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">+${formatNumber(totals.diferencia)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'Editar Empleado' : 'Agregar Empleado'}</DialogTitle>
            <DialogDescription>
              {editingEmployee ? 'Modifica los datos del empleado.' : 'Ingresa el nombre y salario base en USD.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emp-name">Nombre completo</Label>
              <Input id="emp-name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ej: Kevin Kilson" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-salary">Salario base (USD)</Label>
              <Input id="emp-salary" type="number" step="0.01" value={formSalary} onChange={e => setFormSalary(e.target.value)} placeholder="Ej: 700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-notes">Notas (opcional)</Label>
              <Input id="emp-notes" value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Cargo, observaciones..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveEmployee.isPending}>
              {saveEmployee.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
