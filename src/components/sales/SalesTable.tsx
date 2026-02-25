import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import {
  type SalesOpportunity,
  type SalesStage,
  SALES_STAGES,
  getStageLabel,
  getStageColor,
  useUpdateStage,
  useDeleteOpportunity,
} from '@/hooks/useSales';

interface Props {
  opportunities: SalesOpportunity[];
  onViewDetail: (opp: SalesOpportunity) => void;
  onEdit: (opp: SalesOpportunity) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n);

export function SalesTableView({ opportunities, onViewDetail, onEdit }: Props) {
  const updateStage = useUpdateStage();
  const deleteOpp = useDeleteOpportunity();

  const totalPremium = (opp: SalesOpportunity) =>
    (opp.products ?? []).reduce((s, p) => s + p.annual_premium, 0);
  const totalCommission = (opp: SalesOpportunity) =>
    (opp.products ?? []).reduce((s, p) => s + p.annual_premium * (p.commission_rate / 100), 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Prospecto</TableHead>
          <TableHead>Empresa</TableHead>
          <TableHead>Etapa</TableHead>
          <TableHead className="text-right">Prima Total</TableHead>
          <TableHead className="text-right">Comisión Est.</TableHead>
          <TableHead>Fecha Cierre</TableHead>
          <TableHead>Productos</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {opportunities.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
              No hay oportunidades registradas
            </TableCell>
          </TableRow>
        ) : (
          opportunities.map(opp => (
            <TableRow key={opp.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{opp.prospect_name}</p>
                  {opp.prospect_email && <p className="text-xs text-muted-foreground">{opp.prospect_email}</p>}
                </div>
              </TableCell>
              <TableCell>{opp.prospect_company ?? '-'}</TableCell>
              <TableCell>
                <Select
                  value={opp.stage}
                  onValueChange={(v) =>
                    updateStage.mutate({ id: opp.id, stage: v as SalesStage, previousStage: opp.stage })
                  }
                >
                  <SelectTrigger className="w-44 h-8">
                    <Badge className={`${getStageColor(opp.stage)} text-white text-xs`}>
                      {getStageLabel(opp.stage)}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    {SALES_STAGES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right">{fmt(totalPremium(opp))}</TableCell>
              <TableCell className="text-right font-medium text-green-600">{fmt(totalCommission(opp))}</TableCell>
              <TableCell>{opp.expected_close_date ?? '-'}</TableCell>
              <TableCell>
                <Badge variant="secondary">{(opp.products ?? []).length}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onViewDetail(opp)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(opp)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteOpp.mutate(opp.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
