import { useState, useRef, DragEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, DollarSign } from 'lucide-react';
import {
  type SalesOpportunity,
  type SalesStage,
  SALES_STAGES,
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
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<SalesStage | null>(null);
  const dragRef = useRef<{ opp: SalesOpportunity } | null>(null);

  const pipelineStages = SALES_STAGES.filter(
    s => !['ganado', 'perdido', 'postergado'].includes(s.value)
  );
  const terminalStages = SALES_STAGES.filter(
    s => ['ganado', 'perdido', 'postergado'].includes(s.value)
  );

  const getOppsForStage = (stage: SalesStage) =>
    opportunities.filter(o => o.stage === stage);

  const selectedPremium = (opp: SalesOpportunity) => {
    const sel = (opp.products ?? []).find(p => p.is_selected);
    return sel ? sel.annual_premium : 0;
  };

  const handleDragStart = (e: DragEvent, opp: SalesOpportunity) => {
    setDraggingId(opp.id);
    dragRef.current = { opp };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', opp.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
    dragRef.current = null;
  };

  const handleDragOver = (e: DragEvent, stage: SalesStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(stage);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: DragEvent, stage: SalesStage) => {
    e.preventDefault();
    setDropTarget(null);
    const opp = dragRef.current?.opp;
    if (opp && opp.stage !== stage) {
      updateStage.mutate({ id: opp.id, stage, previousStage: opp.stage });
    }
    dragRef.current = null;
    setDraggingId(null);
  };

  const renderOppCard = (opp: SalesOpportunity, draggable = true) => (
    <Card
      key={opp.id}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
        draggingId === opp.id ? 'opacity-40 scale-95' : ''
      }`}
      draggable={draggable}
      onDragStart={draggable ? (e) => handleDragStart(e, opp) : undefined}
      onDragEnd={draggable ? handleDragEnd : undefined}
    >
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{opp.prospect_name}</p>
            {opp.prospect_company && (
              <p className="text-xs text-muted-foreground truncate">{opp.prospect_company}</p>
            )}
            {opp.advisor?.full_name && (
              <p className="text-xs text-muted-foreground truncate">👤 {opp.advisor.full_name}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={(e) => { e.stopPropagation(); onViewDetail(opp); }}
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
        {selectedPremium(opp) > 0 && (
          <p className="text-xs font-medium flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> {fmt(selectedPremium(opp))}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4 min-w-max">
          {pipelineStages.map(stage => {
            const stageOpps = getOppsForStage(stage.value);
            const stageTotal = stageOpps.reduce((s, o) => s + selectedPremium(o), 0);
            const isOver = dropTarget === stage.value;
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
                <div
                  className={`space-y-2 min-h-[100px] rounded-lg p-2 transition-colors ${
                    isOver
                      ? 'bg-primary/10 ring-2 ring-primary/40'
                      : 'bg-muted/30'
                  }`}
                  onDragOver={(e) => handleDragOver(e, stage.value)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.value)}
                >
                  {stageOpps.map(opp => renderOppCard(opp))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Terminal states - also droppable */}
      <div className="grid grid-cols-3 gap-4">
        {terminalStages.map(stage => {
          const stageOpps = getOppsForStage(stage.value);
          const isOver = dropTarget === stage.value;
          return (
            <div key={stage.value}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <h3 className="text-sm font-semibold">{stage.label}</h3>
                <Badge variant="secondary" className="text-xs">{stageOpps.length}</Badge>
              </div>
              <div
                className={`space-y-2 rounded-lg p-2 min-h-[60px] transition-colors ${
                  isOver
                    ? 'bg-primary/10 ring-2 ring-primary/40'
                    : 'bg-muted/30'
                }`}
                onDragOver={(e) => handleDragOver(e, stage.value)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.value)}
              >
                {stageOpps.map(opp => renderOppCard(opp))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
