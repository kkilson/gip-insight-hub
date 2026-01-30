import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Search, Eye, Pencil } from 'lucide-react';
import { useBudgets, useActiveCostCenters, type Budget } from '@/hooks/useFinances';
import { Skeleton } from '@/components/ui/skeleton';
import { BudgetFormDialog } from './BudgetFormDialog';
import { BudgetDetailDialog } from './BudgetDetailDialog';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

const periodLabels: Record<string, string> = {
  mensual: 'Mensual',
  bimestral: 'Bimestral',
  trimestral: 'Trimestral',
  cuatrimestral: 'Cuatrimestral',
  semestral: 'Semestral',
  anual: 'Anual',
  bienal: 'Bienal',
  trienal: 'Trienal',
  cuatrienal: 'Cuatrienal',
  quinquenal: 'Quinquenal',
  decenal: 'Decenal',
};

export function BudgetsTab() {
  const [search, setSearch] = useState('');
  const [costCenterFilter, setCostCenterFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [viewingBudgetId, setViewingBudgetId] = useState<string | null>(null);
  
  const { data: budgets, isLoading } = useBudgets({
    costCenterId: costCenterFilter,
  });
  const { data: costCenters } = useActiveCostCenters();
  
  const filteredBudgets = budgets?.filter(budget => {
    if (!search) return true;
    return budget.name.toLowerCase().includes(search.toLowerCase());
  });

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingBudget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar presupuesto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={costCenterFilter} onValueChange={setCostCenterFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Centro de costos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los centros</SelectItem>
              {costCenters?.map((cc) => (
                <SelectItem key={cc.id} value={cc.id}>
                  {cc.code} - {cc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Presupuesto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Presupuestos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredBudgets?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay presupuestos registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="w-[120px]">Período</TableHead>
                  <TableHead className="w-[180px]">Fechas</TableHead>
                  <TableHead className="w-[120px]">Centro</TableHead>
                  <TableHead className="text-right w-[130px]">Presupuestado</TableHead>
                  <TableHead className="text-right w-[130px]">Ejecutado</TableHead>
                  <TableHead className="w-[150px]">Ejecución</TableHead>
                  <TableHead className="w-[80px]">Estado</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBudgets?.map((budget) => {
                  const executionPercent = budget.total_budgeted_usd > 0
                    ? (budget.total_spent_usd / budget.total_budgeted_usd) * 100
                    : 0;
                  const isOverBudget = executionPercent > 100;
                  
                  return (
                    <TableRow key={budget.id}>
                      <TableCell className="font-medium">{budget.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {periodLabels[budget.period] || budget.period}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(budget.start_date), 'dd/MM/yy')} - {format(new Date(budget.end_date), 'dd/MM/yy')}
                      </TableCell>
                      <TableCell>
                        {budget.cost_center?.code || '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(budget.total_budgeted_usd)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(budget.total_spent_usd)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={Math.min(executionPercent, 100)} 
                            className={`h-2 ${isOverBudget ? '[&>div]:bg-red-500' : ''}`}
                          />
                          <span className={`text-xs font-medium ${isOverBudget ? 'text-red-600' : ''}`}>
                            {executionPercent.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={budget.is_active ? 'default' : 'secondary'}>
                          {budget.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingBudgetId(budget.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(budget)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <BudgetFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        budget={editingBudget}
      />

      <BudgetDetailDialog
        budgetId={viewingBudgetId}
        onClose={() => setViewingBudgetId(null)}
      />
    </div>
  );
}
