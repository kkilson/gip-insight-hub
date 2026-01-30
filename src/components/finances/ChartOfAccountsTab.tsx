import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, ChevronRight, ChevronDown } from 'lucide-react';
import { useChartOfAccounts, type ChartOfAccount } from '@/hooks/useFinances';
import { Skeleton } from '@/components/ui/skeleton';
import { AccountFormDialog } from './AccountFormDialog';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

const classColors: Record<string, string> = {
  activos: 'bg-green-100 text-green-800',
  pasivos: 'bg-red-100 text-red-800',
  patrimonio: 'bg-blue-100 text-blue-800',
  ingresos: 'bg-purple-100 text-purple-800',
  costos: 'bg-orange-100 text-orange-800',
  gastos: 'bg-amber-100 text-amber-800',
  ajustes: 'bg-gray-100 text-gray-800',
};

const classLabels: Record<string, string> = {
  activos: 'Activos',
  pasivos: 'Pasivos',
  patrimonio: 'Patrimonio',
  ingresos: 'Ingresos',
  costos: 'Costos',
  gastos: 'Gastos',
  ajustes: 'Ajustes',
};

export function ChartOfAccountsTab() {
  const [search, setSearch] = useState('');
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set(['1000', '2000', '3000', '4000', '5000', '6000', '7000']));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
  
  const { data: accounts, isLoading } = useChartOfAccounts();
  
  const toggleExpand = (code: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(code)) {
      newExpanded.delete(code);
    } else {
      newExpanded.add(code);
    }
    setExpandedAccounts(newExpanded);
  };

  const buildAccountTree = (accounts: ChartOfAccount[]) => {
    const accountMap = new Map<string, ChartOfAccount & { children: ChartOfAccount[] }>();
    const roots: (ChartOfAccount & { children: ChartOfAccount[] })[] = [];
    
    // First pass: create map
    accounts.forEach(acc => {
      accountMap.set(acc.id, { ...acc, children: [] });
    });
    
    // Second pass: build tree
    accounts.forEach(acc => {
      const node = accountMap.get(acc.id)!;
      if (acc.parent_id) {
        const parent = accountMap.get(acc.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });
    
    return roots;
  };

  const renderAccountRow = (
    account: ChartOfAccount & { children: ChartOfAccount[] },
    depth = 0
  ): React.ReactNode => {
    const hasChildren = account.children.length > 0;
    const isExpanded = expandedAccounts.has(account.code);
    const matchesSearch = !search || 
      account.code.toLowerCase().includes(search.toLowerCase()) ||
      account.name.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch && !account.children.some(child => 
      child.code.toLowerCase().includes(search.toLowerCase()) ||
      child.name.toLowerCase().includes(search.toLowerCase())
    )) {
      return null;
    }

    return (
      <>
        <TableRow key={account.id} className={!account.is_active ? 'opacity-50' : ''}>
          <TableCell>
            <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 mr-1"
                  onClick={() => toggleExpand(account.code)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <span className="w-7" />
              )}
              <span className="font-mono">{account.code}</span>
            </div>
          </TableCell>
          <TableCell className={depth === 0 ? 'font-semibold' : ''}>
            {account.name}
          </TableCell>
          <TableCell>
            <Badge className={classColors[account.class]}>
              {classLabels[account.class]}
            </Badge>
          </TableCell>
          <TableCell className="capitalize">
            {account.nature}
          </TableCell>
          <TableCell className="text-right font-mono">
            {formatCurrency(account.balance_usd)}
          </TableCell>
          <TableCell>
            <Badge variant={account.is_active ? 'default' : 'secondary'}>
              {account.is_active ? 'Activa' : 'Inactiva'}
            </Badge>
          </TableCell>
          <TableCell>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingAccount(account);
                setIsFormOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && account.children
          .sort((a, b) => a.code.localeCompare(b.code))
          .map(child => renderAccountRow(child as ChartOfAccount & { children: ChartOfAccount[] }, depth + 1))}
      </>
    );
  };

  const accountTree = accounts ? buildAccountTree(accounts) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cuenta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setExpandedAccounts(new Set(accounts?.map(a => a.code) || []))}
          >
            Expandir todo
          </Button>
          <Button
            variant="outline"
            onClick={() => setExpandedAccounts(new Set())}
          >
            Colapsar todo
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cuenta
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan de Cuentas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="w-[120px]">Clase</TableHead>
                  <TableHead className="w-[100px]">Naturaleza</TableHead>
                  <TableHead className="text-right w-[130px]">Saldo USD</TableHead>
                  <TableHead className="w-[100px]">Estado</TableHead>
                  <TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountTree
                  .sort((a, b) => a.code.localeCompare(b.code))
                  .map(account => renderAccountRow(account))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AccountFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingAccount(null);
        }}
        account={editingAccount}
      />
    </div>
  );
}
