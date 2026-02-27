import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Settings2, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCommissionRules, useSaveRule, useDeleteRule } from '@/hooks/useCommissions';
import { useToast } from '@/hooks/use-toast';

export function RulesTab() {
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | undefined>();
  const [advisorId, setAdvisorId] = useState('');
  const [insurerId, setInsurerId] = useState('');
  const [planType, setPlanType] = useState('general');
  const [percentage, setPercentage] = useState('');

  const { data: rules, isLoading } = useCommissionRules();
  const saveRule = useSaveRule();
  const deleteRule = useDeleteRule();
  const { toast } = useToast();

  const { data: advisors } = useQuery({
    queryKey: ['advisors-active'],
    queryFn: async () => {
      const { data } = await supabase.from('advisors').select('id, full_name').eq('is_active', true).order('full_name');
      return data || [];
    },
  });

  const { data: insurers } = useQuery({
    queryKey: ['insurers-list'],
    queryFn: async () => {
      const { data } = await supabase.from('insurers').select('id, name').eq('is_active', true).order('name');
      return data || [];
    },
  });

  const openNew = () => {
    setEditId(undefined); setAdvisorId(''); setInsurerId(''); setPlanType('general'); setPercentage('');
    setShowDialog(true);
  };

  const openEdit = (rule: any) => {
    setEditId(rule.id); setAdvisorId(rule.advisor_id); setInsurerId(rule.insurer_id);
    setPlanType(rule.plan_type); setPercentage(String(rule.commission_percentage));
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!advisorId || !insurerId || !percentage) {
      toast({ title: 'Completa todos los campos', variant: 'destructive' }); return;
    }
    saveRule.mutate({
      id: editId, advisor_id: advisorId, insurer_id: insurerId,
      plan_type: planType, commission_percentage: parseFloat(percentage),
    }, { onSuccess: () => setShowDialog(false) });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Reglas de Comisión</h2>
          <p className="text-sm text-muted-foreground">Define porcentajes por asesor, aseguradora y tipo de plan para autosugerir al asignar.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nueva Regla</Button>
      </div>

      {isLoading ? (
        <Card><CardContent className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></CardContent></Card>
      ) : rules && rules.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asesor</TableHead>
                  <TableHead>Aseguradora</TableHead>
                  <TableHead>Tipo de Plan</TableHead>
                  <TableHead>% Comisión</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map(r => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => openEdit(r)}>
                    <TableCell className="font-medium">{(r.advisor as any)?.full_name}</TableCell>
                    <TableCell>{(r.insurer as any)?.name}</TableCell>
                    <TableCell className="capitalize">{r.plan_type}</TableCell>
                    <TableCell className="font-semibold">{Number(r.commission_percentage)}%</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); deleteRule.mutate(r.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="flex flex-col items-center py-12 text-center">
          <Settings2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">Sin reglas</h3>
          <p className="text-muted-foreground">Configura reglas para autosugerir porcentajes al asignar comisiones.</p>
          <Button className="mt-4" onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nueva Regla</Button>
        </CardContent></Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Nueva'} Regla de Comisión</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Asesor</Label>
              <Select value={advisorId} onValueChange={setAdvisorId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar asesor" /></SelectTrigger>
                <SelectContent>{advisors?.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Aseguradora</Label>
              <Select value={insurerId} onValueChange={setInsurerId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar aseguradora" /></SelectTrigger>
                <SelectContent>{insurers?.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Plan</Label>
              <Input value={planType} onChange={e => setPlanType(e.target.value)} placeholder="general, vida, salud..." />
            </div>
            <div className="space-y-2">
              <Label>% Comisión del Asesor</Label>
              <Input type="number" value={percentage} onChange={e => setPercentage(e.target.value)} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveRule.isPending}>
              {saveRule.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
