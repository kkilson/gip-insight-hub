import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, LayoutGrid, List, DollarSign, TrendingUp, Users, Target } from 'lucide-react';
import { useSalesOpportunities, type SalesOpportunity } from '@/hooks/useSales';
import { SalesKanban } from '@/components/sales/SalesKanban';
import { SalesTableView } from '@/components/sales/SalesTable';
import { OpportunityFormDialog } from '@/components/sales/OpportunityFormDialog';
import { OpportunityDetailDialog } from '@/components/sales/OpportunityDetailDialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n);

export default function Sales() {
  const { data: opportunities = [], isLoading } = useSalesOpportunities();
  const [showForm, setShowForm] = useState(false);
  const [editOpp, setEditOpp] = useState<SalesOpportunity | null>(null);
  const [detailOppId, setDetailOppId] = useState<string | null>(null);
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [advisorFilter, setAdvisorFilter] = useState<string>('all');

  const { data: advisors = [] } = useQuery({
    queryKey: ['advisors-for-sales-filter'],
    queryFn: async () => {
      const { data, error } = await supabase.from('advisors').select('id, full_name').eq('is_active', true).order('full_name');
      if (error) throw error;
      return data;
    },
  });

  const filteredOpportunities = advisorFilter === 'all'
    ? opportunities
    : advisorFilter === 'unassigned'
      ? opportunities.filter(o => !o.advisor_id)
      : opportunities.filter(o => o.advisor_id === advisorFilter);

  const detailOpp = filteredOpportunities.find((o) => o.id === detailOppId)
    ?? opportunities.find((o) => o.id === detailOppId)
    ?? null;

  const totalPremium = filteredOpportunities.reduce(
    (s, o) => s + ((o.products ?? []).find(p => p.is_selected)?.annual_premium ?? 0), 0
  );
  const totalCommission = filteredOpportunities.reduce(
    (s, o) => {
      const sel = (o.products ?? []).find(p => p.is_selected);
      return s + (sel ? sel.annual_premium * (sel.commission_rate / 100) : 0);
    }, 0
  );
  const activeOpps = filteredOpportunities.filter(o => !['ganado', 'perdido', 'postergado'].includes(o.stage));
  const wonOpps = filteredOpportunities.filter(o => o.stage === 'ganado');

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <div className="p-6 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Ventas</h1>
            <p className="text-muted-foreground">Pipeline de ventas y seguimiento de oportunidades</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={advisorFilter} onValueChange={setAdvisorFilter}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Filtrar por asesor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los asesores</SelectItem>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                {advisors.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex border rounded-md">
              <Button
                variant={view === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('kanban')}
              >
                <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
              </Button>
              <Button
                variant={view === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('table')}
              >
                <List className="h-4 w-4 mr-1" /> Tabla
              </Button>
            </div>
            <Button onClick={() => { setEditOpp(null); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Nueva Oportunidad
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> Oportunidades Activas
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{activeOpps.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Prima en Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{fmt(totalPremium)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Comisión Estimada
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-600">{fmt(totalCommission)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" /> Negocios Ganados
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{wonOpps.length}</p></CardContent>
          </Card>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Cargando...</p>
        ) : view === 'kanban' ? (
          <SalesKanban opportunities={filteredOpportunities} onViewDetail={(opp) => setDetailOppId(opp.id)} />
        ) : (
          <SalesTableView
            opportunities={filteredOpportunities}
            onViewDetail={(opp) => setDetailOppId(opp.id)}
            onEdit={(opp) => { setEditOpp(opp); setShowForm(true); }}
          />
        )}
      </div>

      <OpportunityFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        opportunity={editOpp}
      />
      <OpportunityDetailDialog
        open={!!detailOppId}
        onOpenChange={(open) => { if (!open) setDetailOppId(null); }}
        opportunity={detailOpp}
      />
    </div>
  );
}
