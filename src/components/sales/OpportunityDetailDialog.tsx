import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit2, DollarSign, TrendingUp } from 'lucide-react';
import {
  type SalesOpportunity,
  type SalesOpportunityProduct,
  getStageLabel,
  getStageColor,
  useInsurersAndProducts,
  useSaveOpportunityProduct,
  useDeleteOpportunityProduct,
} from '@/hooks/useSales';
import { getInstallmentDivisor } from '@/lib/premiumCalculations';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: SalesOpportunity | null;
}

const FREQUENCIES = [
  { value: 'anual', label: 'Anual' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'bimensual', label: 'Bimensual' },
  { value: 'mensual_10_cuotas', label: 'Mensual (10 cuotas)' },
  { value: 'mensual_12_cuotas', label: 'Mensual (12 cuotas)' },
];

export function OpportunityDetailDialog({ open, onOpenChange, opportunity }: Props) {
  const { insurers, products } = useInsurersAndProducts();
  const saveProd = useSaveOpportunityProduct();
  const deleteProd = useDeleteOpportunityProduct();
  const [showForm, setShowForm] = useState(false);
  const [editingProd, setEditingProd] = useState<SalesOpportunityProduct | null>(null);
  const [prodForm, setProdForm] = useState({
    insurer_id: '',
    product_id: '',
    annual_premium: '',
    commission_rate: '',
    payment_frequency: 'anual',
  });

  if (!opportunity) return null;

  const filteredProducts = prodForm.insurer_id
    ? products.filter(p => p.insurer_id === prodForm.insurer_id)
    : products;

  const resetForm = () => {
    setProdForm({ insurer_id: '', product_id: '', annual_premium: '', commission_rate: '', payment_frequency: 'anual' });
    setEditingProd(null);
    setShowForm(false);
  };

  const handleEditProd = (p: SalesOpportunityProduct) => {
    setEditingProd(p);
    setProdForm({
      insurer_id: p.insurer_id ?? '',
      product_id: p.product_id ?? '',
      annual_premium: String(p.annual_premium),
      commission_rate: String(p.commission_rate),
      payment_frequency: p.payment_frequency,
    });
    setShowForm(true);
  };

  const handleSaveProd = () => {
    const premium = parseFloat(prodForm.annual_premium);
    const rate = parseFloat(prodForm.commission_rate);
    if (isNaN(premium) || premium <= 0) return;

    saveProd.mutate({
      ...(editingProd ? { id: editingProd.id } : {}),
      opportunity_id: opportunity.id,
      insurer_id: prodForm.insurer_id || null,
      product_id: prodForm.product_id || null,
      annual_premium: premium,
      commission_rate: isNaN(rate) ? 0 : rate,
      payment_frequency: prodForm.payment_frequency,
    }, { onSuccess: resetForm });
  };

  const oppProducts = opportunity.products ?? [];

  // Commission calculations
  const calcCommission = (p: SalesOpportunityProduct) => {
    const installment = p.annual_premium / getInstallmentDivisor(p.payment_frequency);
    const commissionPerInstallment = installment * (p.commission_rate / 100);
    const annualCommission = p.annual_premium * (p.commission_rate / 100);
    return { installment, commissionPerInstallment, annualCommission };
  };

  const totalPremium = oppProducts.reduce((s, p) => s + p.annual_premium, 0);
  const totalCommission = oppProducts.reduce((s, p) => s + calcCommission(p).annualCommission, 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {opportunity.prospect_name}
            <Badge className={`${getStageColor(opportunity.stage)} text-white`}>
              {getStageLabel(opportunity.stage)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {opportunity.prospect_email && <div><span className="text-muted-foreground">Email:</span> {opportunity.prospect_email}</div>}
          {opportunity.prospect_phone && <div><span className="text-muted-foreground">Teléfono:</span> {opportunity.prospect_phone}</div>}
          {opportunity.prospect_company && <div><span className="text-muted-foreground">Empresa:</span> {opportunity.prospect_company}</div>}
          {opportunity.expected_close_date && <div><span className="text-muted-foreground">Cierre esperado:</span> {opportunity.expected_close_date}</div>}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Prima Total Anual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{fmt(totalPremium)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Comisión Total Anual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{fmt(totalCommission)}</p>
              {totalPremium > 0 && (
                <p className="text-xs text-muted-foreground">
                  {((totalCommission / totalPremium) * 100).toFixed(1)}% promedio
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Products table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Productos Cotizados</h3>
            <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Agregar Producto
            </Button>
          </div>

          {showForm && (
            <Card className="mb-4">
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Aseguradora</Label>
                    <Select value={prodForm.insurer_id || 'none'} onValueChange={v => setProdForm(f => ({ ...f, insurer_id: v === 'none' ? '' : v, product_id: '' }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Todas</SelectItem>
                        {insurers.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Producto</Label>
                    <Select value={prodForm.product_id || 'none'} onValueChange={v => setProdForm(f => ({ ...f, product_id: v === 'none' ? '' : v }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin producto específico</SelectItem>
                        {filteredProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Prima Anual (USD)</Label>
                    <Input type="number" step="0.01" value={prodForm.annual_premium} onChange={e => setProdForm(f => ({ ...f, annual_premium: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Comisión (%)</Label>
                    <Input type="number" step="0.01" value={prodForm.commission_rate} onChange={e => setProdForm(f => ({ ...f, commission_rate: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Frecuencia de Pago</Label>
                    <Select value={prodForm.payment_frequency} onValueChange={v => setProdForm(f => ({ ...f, payment_frequency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map(fr => <SelectItem key={fr.value} value={fr.value}>{fr.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
                  <Button size="sm" onClick={handleSaveProd} disabled={saveProd.isPending}>
                    {editingProd ? 'Actualizar' : 'Agregar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {oppProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aseguradora</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Prima Anual</TableHead>
                  <TableHead className="text-right">Cuota</TableHead>
                  <TableHead className="text-right">Comisión %</TableHead>
                  <TableHead className="text-right">Comisión Anual</TableHead>
                  <TableHead className="text-right">Comisión/Cuota</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {oppProducts.map(p => {
                  const calc = calcCommission(p);
                  const freq = FREQUENCIES.find(f => f.value === p.payment_frequency);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{p.insurer?.name ?? '-'}</TableCell>
                      <TableCell>
                        {p.product?.name ?? '-'}
                        <span className="text-xs text-muted-foreground ml-1">({freq?.label})</span>
                      </TableCell>
                      <TableCell className="text-right">{fmt(p.annual_premium)}</TableCell>
                      <TableCell className="text-right">{fmt(calc.installment)}</TableCell>
                      <TableCell className="text-right">{p.commission_rate}%</TableCell>
                      <TableCell className="text-right font-medium text-green-600">{fmt(calc.annualCommission)}</TableCell>
                      <TableCell className="text-right">{fmt(calc.commissionPerInstallment)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditProd(p)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteProd.mutate(p.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-semibold">Totales</TableCell>
                  <TableCell className="text-right font-semibold">{fmt(totalPremium)}</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right font-semibold text-green-600">{fmt(totalCommission)}</TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay productos cotizados aún. Agrega uno para calcular comisiones.
            </p>
          )}
        </div>

        {opportunity.notes && (
          <div>
            <h3 className="font-semibold mb-1">Notas</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{opportunity.notes}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
