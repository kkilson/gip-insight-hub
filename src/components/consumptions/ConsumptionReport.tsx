import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, eachMonthOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Users,
  FileText,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ConsumptionReportData {
  totalConsumptions: number;
  totalUsd: number;
  totalBs: number;
  avgPerConsumption: number;
  byType: Array<{ name: string; count: number; total_usd: number }>;
  byMonth: Array<{ month: string; count: number; total_usd: number }>;
  byClient: Array<{ 
    client_name: string; 
    policy_number: string;
    count: number; 
    total_usd: number;
  }>;
  topBeneficiaries: Array<{ name: string; count: number; total_usd: number }>;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function ConsumptionReport() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(subMonths(new Date(), 5)),
    to: endOfMonth(new Date()),
  });
  const [selectedPeriod, setSelectedPeriod] = useState('6m');

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const now = new Date();
    let from: Date;

    switch (period) {
      case '1m':
        from = startOfMonth(now);
        break;
      case '3m':
        from = startOfMonth(subMonths(now, 2));
        break;
      case '6m':
        from = startOfMonth(subMonths(now, 5));
        break;
      case '12m':
        from = startOfMonth(subMonths(now, 11));
        break;
      default:
        from = startOfMonth(subMonths(now, 5));
    }

    setDateRange({ from, to: endOfMonth(now) });
  };

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['consumption-report', dateRange],
    queryFn: async (): Promise<ConsumptionReportData> => {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      // Fetch all consumptions in range
      const { data: consumptions, error } = await supabase
        .from('policy_consumptions')
        .select(`
          id,
          usage_date,
          amount_bs,
          amount_usd,
          beneficiary_name,
          description,
          usage_type:usage_types(name),
          policy:policies(
            id,
            policy_number,
            client:clients(first_name, last_name)
          )
        `)
        .eq('deleted', false)
        .gte('usage_date', fromDate)
        .lte('usage_date', toDate)
        .order('usage_date', { ascending: true });

      if (error) throw error;

      const data = consumptions || [];

      // Calculate totals
      const totalUsd = data.reduce((sum, c) => sum + (Number(c.amount_usd) || 0), 0);
      const totalBs = data.reduce((sum, c) => sum + (Number(c.amount_bs) || 0), 0);
      const avgPerConsumption = data.length > 0 ? totalUsd / data.length : 0;

      // Group by type
      const typeMap = new Map<string, { count: number; total_usd: number }>();
      data.forEach(c => {
        const typeName = Array.isArray(c.usage_type) 
          ? c.usage_type[0]?.name 
          : (c.usage_type as any)?.name || 'Sin tipo';
        const existing = typeMap.get(typeName) || { count: 0, total_usd: 0 };
        existing.count++;
        existing.total_usd += Number(c.amount_usd) || 0;
        typeMap.set(typeName, existing);
      });

      // Group by month
      const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
      const monthMap = new Map<string, { count: number; total_usd: number }>();
      months.forEach(m => {
        monthMap.set(format(m, 'yyyy-MM'), { count: 0, total_usd: 0 });
      });

      data.forEach(c => {
        const monthKey = format(parseISO(c.usage_date), 'yyyy-MM');
        const existing = monthMap.get(monthKey) || { count: 0, total_usd: 0 };
        existing.count++;
        existing.total_usd += Number(c.amount_usd) || 0;
        monthMap.set(monthKey, existing);
      });

      // Group by client/policy
      const clientMap = new Map<string, { policy_number: string; count: number; total_usd: number }>();
      data.forEach(c => {
        const policy = Array.isArray(c.policy) ? c.policy[0] : c.policy;
        const client = policy?.client;
        const clientName = client 
          ? `${(Array.isArray(client) ? client[0] : client)?.first_name || ''} ${(Array.isArray(client) ? client[0] : client)?.last_name || ''}`.trim()
          : 'Sin cliente';
        const policyNumber = policy?.policy_number || 'Sin póliza';
        const key = `${clientName}|${policyNumber}`;
        
        const existing = clientMap.get(key) || { policy_number: policyNumber, count: 0, total_usd: 0 };
        existing.count++;
        existing.total_usd += Number(c.amount_usd) || 0;
        clientMap.set(key, existing);
      });

      // Group by beneficiary
      const beneficiaryMap = new Map<string, { count: number; total_usd: number }>();
      data.forEach(c => {
        const name = c.beneficiary_name || 'Sin beneficiario';
        const existing = beneficiaryMap.get(name) || { count: 0, total_usd: 0 };
        existing.count++;
        existing.total_usd += Number(c.amount_usd) || 0;
        beneficiaryMap.set(name, existing);
      });

      return {
        totalConsumptions: data.length,
        totalUsd,
        totalBs,
        avgPerConsumption,
        byType: Array.from(typeMap.entries())
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => b.total_usd - a.total_usd),
        byMonth: Array.from(monthMap.entries())
          .map(([month, stats]) => ({ 
            month: format(parseISO(`${month}-01`), 'MMM yyyy', { locale: es }), 
            ...stats 
          })),
        byClient: Array.from(clientMap.entries())
          .map(([key, stats]) => ({ 
            client_name: key.split('|')[0], 
            ...stats 
          }))
          .sort((a, b) => b.total_usd - a.total_usd)
          .slice(0, 10),
        topBeneficiaries: Array.from(beneficiaryMap.entries())
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
      };
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate trend (compare last month to previous)
  const calculateTrend = () => {
    if (!reportData?.byMonth || reportData.byMonth.length < 2) return null;
    const months = reportData.byMonth;
    const lastMonth = months[months.length - 1]?.total_usd || 0;
    const prevMonth = months[months.length - 2]?.total_usd || 0;
    if (prevMonth === 0) return null;
    return ((lastMonth - prevMonth) / prevMonth) * 100;
  };

  const trend = calculateTrend();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Último mes</SelectItem>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="12m">Último año</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(dateRange.from, 'dd MMM yyyy', { locale: es })} - {format(dateRange.to, 'dd MMM yyyy', { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                    setSelectedPeriod('custom');
                  }
                }}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consumos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.totalConsumptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              en el período seleccionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total USD</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData?.totalUsd || 0)}</div>
            {trend !== null && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                trend > 0 ? "text-destructive" : "text-success"
              )}>
                {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend).toFixed(1)}% vs mes anterior
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Consumo</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData?.avgPerConsumption || 0)}</div>
            <p className="text-xs text-muted-foreground">
              monto promedio USD
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.byClient.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              con consumos en el período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendencia Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData?.byMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Total USD']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total_usd" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Type Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData?.byType || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="total_usd"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {(reportData?.byType || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Total USD']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Consumos por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData?.byMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'count' ? value : formatCurrency(value),
                      name === 'count' ? 'Cantidad' : 'Total USD'
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Clientes por Consumo</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Póliza</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">Total USD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(reportData?.byClient || []).map((client, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{client.client_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {client.policy_number}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{client.count}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(client.total_usd)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Type Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen por Tipo de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Uso</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="text-right">Total USD</TableHead>
                <TableHead className="text-right">Promedio</TableHead>
                <TableHead className="text-right">% del Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(reportData?.byType || []).map((type, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} 
                      />
                      {type.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{type.count}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(type.total_usd)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {type.count > 0 ? formatCurrency(type.total_usd / type.count) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">
                      {reportData?.totalUsd && reportData.totalUsd > 0
                        ? `${((type.total_usd / reportData.totalUsd) * 100).toFixed(1)}%`
                        : '0%'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
