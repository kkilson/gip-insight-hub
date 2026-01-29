import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  FileText,
  Users,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Paperclip,
} from 'lucide-react';
import { FileAttachments } from './FileAttachments';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatInstallment } from '@/lib/premiumCalculations';

interface ClientDetailDialogProps {
  clientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (clientId: string) => void;
}

const statusColors: Record<string, string> = {
  vigente: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  cancelada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  vencida: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  en_tramite: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

const statusLabels: Record<string, string> = {
  vigente: 'Vigente',
  pendiente: 'Pendiente',
  cancelada: 'Cancelada',
  vencida: 'Vencida',
  en_tramite: 'En trámite',
};

const relationshipLabels: Record<string, string> = {
  tomador_titular: 'Tomador y titular',
  conyuge: 'Cónyuge',
  hijo: 'Hijo/a',
  padre: 'Padre',
  madre: 'Madre',
  hermano: 'Hermano/a',
  otro: 'Otro',
};

export function ClientDetailDialog({
  clientId,
  open,
  onOpenChange,
  onEdit,
}: ClientDetailDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: client, isLoading: loadingClient } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId && open,
  });

  const { data: policies, isLoading: loadingPolicies } = useQuery({
    queryKey: ['client-policies', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('policies')
        .select(`
          *,
          insurer:insurers(name, short_name),
          product:products(name, category)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clientId && open,
  });

  const { data: beneficiaries, isLoading: loadingBeneficiaries } = useQuery({
    queryKey: ['client-beneficiaries', clientId],
    queryFn: async () => {
      if (!clientId || !policies?.length) return [];
      const policyIds = policies.map((p) => p.id);
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .in('policy_id', policyIds)
        .order('percentage', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clientId && !!policies?.length,
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['client-audit', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('record_id', clientId)
        .eq('record_type', 'client')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!clientId && open,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!clientId || !user) throw new Error('Datos incompletos');

      // Delete beneficiaries first
      if (policies?.length) {
        const policyIds = policies.map((p) => p.id);
        await supabase.from('beneficiaries').delete().in('policy_id', policyIds);
      }

      // Delete policies
      await supabase.from('policies').delete().eq('client_id', clientId);

      // Delete client
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) throw error;

      // Audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_email: user.email,
        action: 'delete',
        module: 'clients',
        record_id: clientId,
        record_type: 'client',
        details: {
          client_name: client ? `${client.first_name} ${client.last_name}` : 'Unknown',
          policies_deleted: policies?.length || 0,
        },
      });
    },
    onSuccess: () => {
      toast({ title: 'Cliente eliminado', description: 'El cliente y sus datos asociados han sido eliminados.' });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const isLoading = loadingClient || loadingPolicies;

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalle del Cliente</span>
              {client && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(clientId!)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !client ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Cliente no encontrado</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="info">Información</TabsTrigger>
                  <TabsTrigger value="policies">Pólizas ({policies?.length || 0})</TabsTrigger>
                  <TabsTrigger value="beneficiaries">Beneficiarios</TabsTrigger>
                  <TabsTrigger value="attachments">Archivos</TabsTrigger>
                  <TabsTrigger value="history">Historial</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Datos Personales
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nombre completo</p>
                        <p className="font-medium">{client.first_name} {client.last_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Identificación</p>
                        <p className="font-medium">
                          {client.identification_number}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {client.identification_type === 'cedula' ? 'Cédula' : client.identification_type}
                          </Badge>
                        </p>
                      </div>
                      {client.birth_date && (
                        <div>
                          <p className="text-sm text-muted-foreground">Fecha de nacimiento</p>
                          <p className="font-medium">
                            {format(new Date(client.birth_date), 'dd MMMM yyyy', { locale: es })}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Registro</p>
                        <p className="font-medium">
                          {format(new Date(client.created_at), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Contacto
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{client.email || 'No registrado'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{client.phone || client.mobile || 'No registrado'}</span>
                      </div>
                      <div className="flex items-start gap-2 col-span-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>
                          {client.address || 'Sin dirección'}
                          {client.city && `, ${client.city}`}
                          {client.province && `, ${client.province}`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {(client.occupation || client.workplace) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Briefcase className="h-5 w-5" />
                          Información Laboral
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        {client.occupation && (
                          <div>
                            <p className="text-sm text-muted-foreground">Ocupación</p>
                            <p className="font-medium">{client.occupation}</p>
                          </div>
                        )}
                        {client.workplace && (
                          <div>
                            <p className="text-sm text-muted-foreground">Lugar de trabajo</p>
                            <p className="font-medium">{client.workplace}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {client.notes && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Notas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{client.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="policies" className="space-y-4 mt-4">
                  {policies?.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">Sin pólizas registradas</p>
                      </CardContent>
                    </Card>
                  ) : (
                    policies?.map((policy) => (
                      <Card key={policy.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="font-medium">
                                {(policy.insurer as any)?.name || 'Sin aseguradora'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {(policy.product as any)?.name || 'Sin producto'}
                              </p>
                            </div>
                            <Badge className={statusColors[policy.status || 'en_tramite']}>
                              {statusLabels[policy.status || 'en_tramite']}
                            </Badge>
                          </div>
                          <Separator className="my-4" />
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span>{policy.policy_number || 'Sin número'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {format(new Date(policy.start_date), 'dd/MM/yyyy')} -
                                {format(new Date(policy.end_date), 'dd/MM/yyyy')}
                              </span>
                            </div>
                            {policy.premium && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span>Anual: ${parseFloat(String(policy.premium)).toFixed(2)}</span>
                              </div>
                            )}
                            {policy.premium && policy.payment_frequency && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Cuota:</span>
                                <span>{formatInstallment(policy.premium, policy.payment_frequency)}</span>
                              </div>
                            )}
                            {policy.coverage_amount && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Suma:</span>
                                <span>${parseFloat(String(policy.coverage_amount)).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="beneficiaries" className="space-y-4 mt-4">
                  {loadingBeneficiaries ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : beneficiaries?.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">Sin beneficiarios registrados</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="pt-6 space-y-4">
                        {beneficiaries?.map((ben) => (
                          <div key={ben.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">{ben.first_name} {ben.last_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {relationshipLabels[ben.relationship] || ben.relationship}
                                {ben.identification_number && ` • ${ben.identification_number}`}
                              </p>
                            </div>
                            <Badge variant="secondary">{ben.percentage}%</Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="attachments" className="space-y-6 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Documentos del Tomador
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FileAttachments
                        entityType="client"
                        entityId={clientId || undefined}
                        title="Archivos del tomador"
                      />
                    </CardContent>
                  </Card>

                  {policies?.map((policy) => (
                    <Card key={policy.id}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Documentos de Póliza: {policy.policy_number || 'Sin número'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FileAttachments
                          entityType="policy"
                          entityId={policy.id}
                          title="Archivos de la póliza"
                        />
                      </CardContent>
                    </Card>
                  ))}

                  {beneficiaries?.map((ben) => (
                    <Card key={ben.id}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Documentos de {ben.first_name} {ben.last_name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FileAttachments
                          entityType="beneficiary"
                          entityId={ben.id}
                          title="Archivos del beneficiario"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="history" className="space-y-4 mt-4">
                  {auditLogs?.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">Sin historial de cambios</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="pt-6 space-y-3">
                        {auditLogs?.map((log) => (
                          <div key={log.id} className="flex items-start gap-3 text-sm">
                            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                            <div className="flex-1">
                              <p className="font-medium capitalize">{log.action}</p>
                              <p className="text-muted-foreground">
                                {log.user_email} •{' '}
                                {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al cliente, todas sus pólizas y beneficiarios asociados.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
