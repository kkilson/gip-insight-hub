import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Edit2, DollarSign, TrendingUp, Send, MessageSquare, Receipt, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  type SalesOpportunity,
  type SalesOpportunityProduct,
  getStageLabel,
  getStageColor,
  useInsurersAndProducts,
  useSaveOpportunityProduct,
  useDeleteOpportunityProduct,
} from '@/hooks/useSales';
import { useSalesNotes, useAddSalesNote, useDeleteSalesNote } from '@/hooks/useSalesNotes';
import { useSalesInvestments, useAddSalesInvestment, useDeleteSalesInvestment } from '@/hooks/useSalesInvestments';
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

  // Notes
  const { data: notes = [] } = useSalesNotes(opportunity?.id ?? null);
  const addNote = useAddSalesNote();
  const deleteNote = useDeleteSalesNote();
  const [noteText, setNoteText] = useState('');

  // Investments
  const { data: investments = [] } = useSalesInvestments(opportunity?.id ?? null);
  const addInvestment = useAddSalesInvestment();
  const deleteInvestment = useDeleteSalesInvestment();
  const [showInvForm, setShowInvForm] = useState(false);
  const [invForm, setInvForm] = useState({ description: '', amount: '', investment_date: new Date().toISOString().slice(0, 10) });

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

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNote.mutate({ opportunityId: opportunity.id, content: noteText.trim() }, {
      onSuccess: () => setNoteText(''),
    });
  };

  const handleAddInvestment = () => {
    const amount = parseFloat(invForm.amount);
    if (!invForm.description.trim() || isNaN(amount) || amount <= 0) return;
    addInvestment.mutate({
      opportunityId: opportunity.id,
      description: invForm.description.trim(),
      amount,
      investment_date: invForm.investment_date,
    }, {
      onSuccess: () => {
        setInvForm({ description: '', amount: '', investment_date: new Date().toISOString().slice(0, 10) });
        setShowInvForm(false);
      },
    });
  };

  const oppProducts = opportunity.products ?? [];

  const calcCommission = (p: SalesOpportunityProduct) => {
    const installment = p.annual_premium / getInstallmentDivisor(p.payment_frequency);
    const commissionPerInstallment = installment * (p.commission_rate / 100);
    const annualCommission = p.annual_premium * (p.commission_rate / 100);
    return { installment, commissionPerInstallment, annualCommission };
  };

  const totalPremium = oppProducts.reduce((s, p) => s + p.annual_premium, 0);
  const totalCommission = oppProducts.reduce((s, p) => s + calcCommission(p).annualCommission, 0);
  const totalInvested = investments.reduce((s, inv) => s + inv.amount, 0);
  const netProfit = totalCommission - totalInvested;

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-3 text-lg">
            {opportunity.prospect_name}
            <Badge className={`${getStageColor(opportunity.stage)} text-white text-xs`}>
              {getStageLabel(opportunity.stage)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="px-6 pb-6 max-h-[calc(90vh-5rem)]">
          <div className="space-y-5">
            {/* Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {opportunity.prospect_email && <div><span className="text-muted-foreground">Email:</span> {opportunity.prospect_email}</div>}
              {opportunity.prospect_phone && <div><span className="text-muted-foreground">Teléfono:</span> {opportunity.prospect_phone}</div>}
              {opportunity.prospect_company && <div><span className="text-muted-foreground">Empresa:</span> {opportunity.prospect_company}</div>}
              {opportunity.expected_close_date && <div><span className="text-muted-foreground">Cierre esperado:</span> {opportunity.expected_close_date}</div>}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" /> Prima Anual
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-lg font-bold">{fmt(totalPremium)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" /> Comisión Anual
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-lg font-bold text-green-600">{fmt(totalCommission)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5" /> Inversión Total
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-lg font-bold text-orange-500">{fmt(totalInvested)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5" /> Ganancia Neta
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {fmt(netProfit)}
                  </p>
                  {totalCommission > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      ROI: {((netProfit / (totalInvested || 1)) * 100).toFixed(0)}%
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Products table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Productos Cotizados</h3>
                <Button size="sm" variant="outline" onClick={() => { resetForm(); setShowForm(true); }}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Agregar
                </Button>
              </div>

              {showForm && (
                <Card className="mb-3">
                  <CardContent className="pt-3 pb-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Aseguradora</Label>
                        <Select value={prodForm.insurer_id || 'none'} onValueChange={v => setProdForm(f => ({ ...f, insurer_id: v === 'none' ? '' : v, product_id: '' }))}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Todas</SelectItem>
                            {insurers.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Producto</Label>
                        <Select value={prodForm.product_id || 'none'} onValueChange={v => setProdForm(f => ({ ...f, product_id: v === 'none' ? '' : v }))}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin producto específico</SelectItem>
                            {filteredProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Prima Anual (USD)</Label>
                        <Input className="h-8 text-xs" type="number" step="0.01" value={prodForm.annual_premium} onChange={e => setProdForm(f => ({ ...f, annual_premium: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Comisión (%)</Label>
                        <Input className="h-8 text-xs" type="number" step="0.01" value={prodForm.commission_rate} onChange={e => setProdForm(f => ({ ...f, commission_rate: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Frecuencia de Pago</Label>
                        <Select value={prodForm.payment_frequency} onValueChange={v => setProdForm(f => ({ ...f, payment_frequency: v }))}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FREQUENCIES.map(fr => <SelectItem key={fr.value} value={fr.value}>{fr.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={resetForm}>Cancelar</Button>
                      <Button size="sm" className="h-7 text-xs" onClick={handleSaveProd} disabled={saveProd.isPending}>
                        {editingProd ? 'Actualizar' : 'Agregar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {oppProducts.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Aseguradora</TableHead>
                        <TableHead className="text-xs">Producto</TableHead>
                        <TableHead className="text-xs text-right">Prima Anual</TableHead>
                        <TableHead className="text-xs text-right">Cuota</TableHead>
                        <TableHead className="text-xs text-right">Com. %</TableHead>
                        <TableHead className="text-xs text-right">Com. Anual</TableHead>
                        <TableHead className="text-xs text-right">Com./Cuota</TableHead>
                        <TableHead className="w-16" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {oppProducts.map(p => {
                        const calc = calcCommission(p);
                        const freq = FREQUENCIES.find(f => f.value === p.payment_frequency);
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="text-xs py-2">{p.insurer?.name ?? '-'}</TableCell>
                            <TableCell className="text-xs py-2">
                              {p.product?.name ?? '-'}
                              <span className="text-muted-foreground ml-1">({freq?.label})</span>
                            </TableCell>
                            <TableCell className="text-xs text-right py-2">{fmt(p.annual_premium)}</TableCell>
                            <TableCell className="text-xs text-right py-2">{fmt(calc.installment)}</TableCell>
                            <TableCell className="text-xs text-right py-2">{p.commission_rate}%</TableCell>
                            <TableCell className="text-xs text-right py-2 font-medium text-green-600">{fmt(calc.annualCommission)}</TableCell>
                            <TableCell className="text-xs text-right py-2">{fmt(calc.commissionPerInstallment)}</TableCell>
                            <TableCell className="py-2">
                              <div className="flex gap-0.5">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditProd(p)}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteProd.mutate(p.id)}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2} className="font-semibold text-xs">Totales</TableCell>
                        <TableCell className="text-right font-semibold text-xs">{fmt(totalPremium)}</TableCell>
                        <TableCell />
                        <TableCell />
                        <TableCell className="text-right font-semibold text-xs text-green-600">{fmt(totalCommission)}</TableCell>
                        <TableCell />
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3">
                  No hay productos cotizados aún. Agrega uno para calcular comisiones.
                </p>
              )}
            </div>

            {/* Investments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  <TrendingDown className="h-4 w-4" /> Inversiones Realizadas
                </h3>
                <Button size="sm" variant="outline" onClick={() => setShowInvForm(v => !v)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Registrar
                </Button>
              </div>

              {showInvForm && (
                <Card className="mb-3">
                  <CardContent className="pt-3 pb-3 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Fecha</Label>
                        <Input className="h-8 text-xs" type="date" value={invForm.investment_date} onChange={e => setInvForm(f => ({ ...f, investment_date: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Monto (USD)</Label>
                        <Input className="h-8 text-xs" type="number" step="0.01" placeholder="0.00" value={invForm.amount} onChange={e => setInvForm(f => ({ ...f, amount: e.target.value }))} />
                      </div>
                      <div className="flex items-end gap-1">
                        <Button size="sm" className="h-8 text-xs" onClick={handleAddInvestment} disabled={addInvestment.isPending}>Agregar</Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowInvForm(false)}>Cancelar</Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Descripción</Label>
                      <Input className="h-8 text-xs" placeholder="Ej: Almuerzo con cliente, transporte..." value={invForm.description} onChange={e => setInvForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {investments.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Fecha</TableHead>
                        <TableHead className="text-xs">Descripción</TableHead>
                        <TableHead className="text-xs text-right">Monto</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {investments.map(inv => (
                        <TableRow key={inv.id}>
                          <TableCell className="text-xs py-2">{format(new Date(inv.investment_date), "dd MMM yyyy", { locale: es })}</TableCell>
                          <TableCell className="text-xs py-2">{inv.description}</TableCell>
                          <TableCell className="text-xs text-right py-2 font-medium text-orange-500">{fmt(inv.amount)}</TableCell>
                          <TableCell className="py-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteInvestment.mutate({ id: inv.id, opportunityId: opportunity.id })}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2} className="font-semibold text-xs">Total Invertido</TableCell>
                        <TableCell className="text-right font-semibold text-xs text-orange-500">{fmt(totalInvested)}</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Sin inversiones registradas. Registra gastos asociados a esta oportunidad.
                </p>
              )}
            </div>

            {/* Notes from opportunity */}
            {opportunity.notes && (
              <div>
                <h3 className="font-semibold text-sm mb-1">Descripción</h3>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{opportunity.notes}</p>
              </div>
            )}

            {/* Activity Notes */}
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" /> Notas de Seguimiento
              </h3>

              <div className="flex gap-2 mb-3">
                <Textarea
                  placeholder="Escribe una nota sobre esta oportunidad..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  className="min-h-[60px] text-xs resize-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="shrink-0 self-end h-8"
                  onClick={handleAddNote}
                  disabled={!noteText.trim() || addNote.isPending}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>

              {notes.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notes.map(note => (
                    <div key={note.id} className="border rounded-md p-3 bg-muted/30">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs whitespace-pre-wrap flex-1">{note.content}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 shrink-0 opacity-50 hover:opacity-100"
                          onClick={() => deleteNote.mutate({ id: note.id, opportunityId: opportunity.id })}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(note.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                        {note.profile?.full_name && ` — ${note.profile.full_name}`}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Sin notas aún. Agrega una para llevar registro del seguimiento.
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
