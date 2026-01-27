import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
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
import { Search, Plus, Users, Loader2, Eye } from 'lucide-react';
import { ClientFormWizard } from '@/components/clients/ClientFormWizard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          policies:policies(count)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredClients = clients?.filter((client) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      client.first_name.toLowerCase().includes(search) ||
      client.last_name.toLowerCase().includes(search) ||
      client.identification_number.toLowerCase().includes(search) ||
      client.email?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gestión de clientes y sus pólizas</p>
        </div>
        <Button onClick={() => setIsWizardOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, cédula o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : filteredClients && filteredClients.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Identificación</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Pólizas</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="font-medium">
                        {client.first_name} {client.last_name}
                      </div>
                      {client.city && (
                        <div className="text-xs text-muted-foreground">
                          {client.city}, {client.province}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{client.identification_number}</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {client.identification_type === 'cedula' ? 'Cédula' : 
                         client.identification_type === 'ruc' ? 'RUC' : 
                         client.identification_type === 'pasaporte' ? 'Pasaporte' : 'Otro'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{client.email || '-'}</div>
                      <div className="text-xs text-muted-foreground">
                        {client.mobile || client.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {(client.policies as { count: number }[])?.[0]?.count || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(client.created_at), 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
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
              Aún no hay clientes en el sistema. Comienza agregando tu primer cliente
              con toda su información y pólizas.
            </p>
            <Button className="mt-4" onClick={() => setIsWizardOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar primer cliente
            </Button>
          </CardContent>
        </Card>
      )}

      <ClientFormWizard open={isWizardOpen} onOpenChange={setIsWizardOpen} />
    </div>
  );
}