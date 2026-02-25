import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, ChevronRight, DollarSign } from 'lucide-react';
import {
  type SalesOpportunity,
  type SalesStage,
  SALES_STAGES,
  getStageLabel,
  getStageColor,
  useUpdateStage,
} from '@/hooks/useSales';

interface Props {
  opportunities: SalesOpportunity[];
  onViewDetail: (opp: SalesOpportunity) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export function SalesKanban({ opportunities, onViewDetail }: Props) {
  const updateStage = useUpdateStage();

  // Active pipeline stages (exclude terminal states for main board)
  const pipelineStages = SALES_STAGES.filter(
    s => !['ganado', 'perdido', 'postergado'].includes(s.value)
  );
  const terminalStages = SALES_STAGES.filter(
    s => ['ganado', 'perdido', 'postergado'].includes(s.value)
  );

  const getOppsForStage = (stage: SalesStage) =>
    opportunities.filter(o => o.stage === stage);

  const handleMoveNext = (opp: SalesOpportunity) => {
    const idx = SALES_STAGES.findIndex(s => s.value === opp.stage);
    if (idx < SALES_STAGES.length - 1) {
      const next = SALES_STAGES[idx + 1];
      updateStage.mutate({ id: opp.id, stage: next.value, previousStage: opp.stage });
    }
  };

  const handleChangeStage = (opp: SalesOpportunity, newStage: SalesStage) => {
    if (newStage !== opp.stage) {
      updateStage.mutate({ id: opp.id, stage: newStage, previousStage: opp.stage });
    }
  };

  const totalPremium = (opp: SalesOpportunity) =>
    (opp.products ?? []).reduce((s, p) => s + p.annual_premium, 0);

  return (
    <div className="space-y-4">
      {/* Pipeline kanban */}
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4 min-w-max">
          {pipelineStages.map(stage => {
            const stageOpps = getOppsForStage(stage.value);
            const stageTotal = stageOpps.reduce((s, o) => s + totalPremium(o), 0);
            return (
              <div key={stage.value} className="w-64 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <h3 className="text-sm font-semibold">{stage.label}</h3>
                  <Badge variant="secondary" className="text-xs">{stageOpps.length}</Badge>
                </div>
                {stageTotal > 0 && (
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> {fmt(stageTotal)}
                  </p>
                )}
                <div className="space-y-2 min-h-[100px] bg-muted/30 rounded-lg p-2">
                  {stageOpps.map(opp => (
                    <Card key={opp.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{opp.prospect_name}</p>
                            {opp.prospect_company && (
                              <p className="text-xs text-muted-foreground">{opp.prospect_company}</p>
                            )}
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onViewDetail(opp)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                        {totalPremium(opp) > 0 && (
                          <p className="text-xs font-medium">{fmt(totalPremium(opp))}</p>
                        )}
                        <div className="flex items-center gap-1">
                          <Select
                            value={opp.stage}
                            onValueChange={(v) => handleChangeStage(opp, v as SalesStage)}
                          >
                            <SelectTrigger className="h-6 text-xs flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SALES_STAGES.map(s => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => handleMoveNext(opp)}
                            title="Avanzar etapa"
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Terminal states */}
      <div className="grid grid-cols-3 gap-4">
        {terminalStages.map(stage => {
          const stageOpps = getOppsForStage(stage.value);
          return (
            <div key={stage.value}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <h3 className="text-sm font-semibold">{stage.label}</h3>
                <Badge variant="secondary" className="text-xs">{stageOpps.length}</Badge>
              </div>
              <div className="space-y-2 bg-muted/30 rounded-lg p-2 min-h-[60px]">
                {stageOpps.map(opp => (
                  <Card key={opp.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onViewDetail(opp)}>
                    <CardContent className="p-2">
                      <p className="text-sm font-medium">{opp.prospect_name}</p>
                      {totalPremium(opp) > 0 && <p className="text-xs text-muted-foreground">{fmt(totalPremium(opp))}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
