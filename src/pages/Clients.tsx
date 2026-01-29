import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Users, Loader2, Eye, Upload } from 'lucide-react';
import { ClientFormWizard } from '@/components/clients/ClientFormWizard';
import { ClientEditWizard } from '@/components/clients/ClientEditWizard';
import { ClientDetailDialog } from '@/components/clients/ClientDetailDialog';
import { ClientImportWizard } from '@/components/clients/ClientImportWizard';
import { ClientFilters, type ClientFiltersState } from '@/components/clients/ClientFilters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const identificationLabels: Record<string, string> = {
  cedula: 'Cédula',
  pasaporte: 'Pasaporte',
  rif: 'RIF',
  otro: 'Otro',
};

export default function Clients() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editClientId, setEditClientId] = useState<string | null>(null);
  const [viewClientId, setViewClientId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ClientFiltersState>({
    search: '',
    insurerId: null,
    productId: null,
    status: null,
    dateFrom: '',
    dateTo: '',
  });

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', filters],
    queryFn: async () => {
      // Base query for clients with policies and advisors
      let query = supabase
        .from('clients')
        .select(`
          *,
          policies:policies(
            id,
            insurer_id,
            product_id,
            status,
            start_date,
            end_date,
            policy_advisors:policy_advisors(
              advisor_role,
              advisor:advisors(id, full_name)
            )
          )
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Client-side filtering for advanced filters
      let filtered = data || [];

      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(
          (client) =>
            client.first_name.toLowerCase().includes(search) ||
            client.last_name.toLowerCase().includes(search) ||
            client.identification_number.toLowerCase().includes(search) ||
            client.email?.toLowerCase().includes(search)
        );
      }

      // Insurer filter
      if (filters.insurerId) {
        filtered = filtered.filter((client) =>
          client.policies?.some((p: any) => p.insurer_id === filters.insurerId)
        );
      }

      // Product filter
      if (filters.productId) {
        filtered = filtered.filter((client) =>
          client.policies?.some((p: any) => p.product_id === filters.productId)
        );
      }

      // Status filter
      if (filters.status) {
        filtered = filtered.filter((client) =>
          client.policies?.some((p: any) => p.status === filters.status)
        );
      }

      // Date from filter (policy start date)
      if (filters.dateFrom) {
        filtered = filtered.filter((client) =>
          client.policies?.some((p: any) => p.start_date >= filters.dateFrom)
        );
      }

      // Date to filter (policy end date)
      if (filters.dateTo) {
        filtered = filtered.filter((client) =>
          client.policies?.some((p: any) => p.end_date <= filters.dateTo)
        );
      }

      return filtered;
    },
  });

  const handleViewClient = (clientId: string) => {
    setViewClientId(clientId);
  };

  const handleEditClient = (clientId: string) => {
    setViewClientId(null);
    setEditClientId(clientId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gestión de clientes y sus pólizas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar Excel
          </Button>
          <Button onClick={() => setIsWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <ClientFilters filters={filters} onFiltersChange={setFilters} />

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : clients && clients.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Identificación</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Asesores</TableHead>
                  <TableHead>Pólizas</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell onClick={() => handleViewClient(client.id)}>
                      <div className="font-medium">
                        {client.first_name} {client.last_name}
                      </div>
                      {client.city && (
                        <div className="text-xs text-muted-foreground">
                          {client.city}, {client.province}
                        </div>
                      )}
                    </TableCell>
                    <TableCell onClick={() => handleViewClient(client.id)}>
                      <div className="text-sm">{client.identification_number}</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {identificationLabels[client.identification_type] || client.identification_type}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={() => handleViewClient(client.id)}>
                      <div className="text-sm">{client.email || '-'}</div>
                      <div className="text-xs text-muted-foreground">
                        {client.mobile || client.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell onClick={() => handleViewClient(client.id)}>
                      {(() => {
                        // Get unique advisors from all policies
                        const advisors = new Set<string>();
                        client.policies?.forEach((p: any) => {
                          p.policy_advisors?.forEach((pa: any) => {
                            if (pa.advisor?.full_name) {
                              advisors.add(pa.advisor.full_name);
                            }
                          });
                        });
                        const advisorList = Array.from(advisors);
                        return advisorList.length > 0 ? (
                          <div className="space-y-1">
                            {advisorList.slice(0, 2).map((name, i) => (
                              <div key={i} className="text-xs text-muted-foreground">{name}</div>
                            ))}
                            {advisorList.length > 2 && (
                              <div className="text-xs text-muted-foreground">+{advisorList.length - 2} más</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell onClick={() => handleViewClient(client.id)}>
                      <Badge variant="secondary">
                        {client.policies?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {client.created_at && format(new Date(client.created_at), 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleViewClient(client.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">Sin clientes registrados</h3>
            <p className="text-muted-foreground max-w-md">
              {filters.search || filters.insurerId || filters.productId || filters.status
                ? 'No se encontraron clientes con los filtros seleccionados.'
                : 'Aún no hay clientes en el sistema. Comienza agregando tu primer cliente con toda su información y pólizas.'}
            </p>
            {!filters.search && !filters.insurerId && !filters.productId && !filters.status && (
              <Button className="mt-4" onClick={() => setIsWizardOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar primer cliente
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <ClientFormWizard open={isWizardOpen} onOpenChange={setIsWizardOpen} />
      
      <ClientImportWizard open={isImportOpen} onOpenChange={setIsImportOpen} />
      
      <ClientEditWizard
        clientId={editClientId}
        open={!!editClientId}
        onOpenChange={(open) => !open && setEditClientId(null)}
      />
      
      <ClientDetailDialog
        clientId={viewClientId}
        open={!!viewClientId}
        onOpenChange={(open) => !open && setViewClientId(null)}
        onEdit={handleEditClient}
      />
    </div>
  );
}
