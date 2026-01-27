import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, RefreshCw, History, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const actionColors: Record<string, string> = {
  create: 'bg-green-500/10 text-green-600 border-green-500/20',
  update: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  delete: 'bg-red-500/10 text-red-600 border-red-500/20',
  login: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  logout: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  role_assigned: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  role_removed: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  system_init: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
};

const actionLabels: Record<string, string> = {
  create: 'Crear',
  update: 'Actualizar',
  delete: 'Eliminar',
  login: 'Inicio de sesión',
  logout: 'Cierre de sesión',
  role_assigned: 'Rol asignado',
  role_removed: 'Rol eliminado',
  system_init: 'Inicialización',
};

const moduleLabels: Record<string, string> = {
  users: 'Usuarios',
  clients: 'Clientes',
  policies: 'Pólizas',
  collections: 'Cobranzas',
  renewals: 'Renovaciones',
  settings: 'Configuración',
  auth: 'Autenticación',
  system: 'Sistema',
};

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const { data: logs, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['audit-logs', moduleFilter, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (moduleFilter !== 'all') {
        query = query.eq('module', moduleFilter);
      }
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filteredLogs = logs?.filter((log) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.user_email?.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      log.module.toLowerCase().includes(search) ||
      log.record_type?.toLowerCase().includes(search)
    );
  });

  const uniqueModules = [...new Set(logs?.map((log) => log.module) || [])];
  const uniqueActions = [...new Set(logs?.map((log) => log.action) || [])];

  const formatDetails = (details: unknown) => {
    if (!details) return '-';
    if (typeof details === 'object') {
      const d = details as Record<string, unknown>;
      if (d.role) return `Rol: ${d.role}`;
      if (d.target_user) return `Usuario: ${d.target_user}`;
      return JSON.stringify(details);
    }
    return String(details);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Logs de Auditoría</h1>
          <p className="text-muted-foreground">Historial de acciones del sistema</p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuario, acción o módulo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los módulos</SelectItem>
                {uniqueModules.map((module) => (
                  <SelectItem key={module} value={module}>
                    {moduleLabels[module] || module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {actionLabels[action] || action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Detalles</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {format(new Date(log.created_at), 'dd MMM yyyy', { locale: es })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), 'HH:mm:ss')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{log.user_email || 'Sistema'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={actionColors[log.action] || 'bg-gray-500/10 text-gray-600'}
                      >
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {moduleLabels[log.module] || log.module}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
                        {formatDetails(log.details)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground font-mono">
                        {log.ip_address || '-'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground">Sin registros</h3>
              <p className="text-muted-foreground">
                No hay logs de auditoría que coincidan con los filtros
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Información de auditoría</p>
            <p className="text-sm text-muted-foreground">
              Los logs se conservan por 90 días. Se muestran los últimos 100 registros.
              Para exportar o consultar registros históricos, contacte al administrador.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
