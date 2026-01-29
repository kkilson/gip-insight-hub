import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, Loader2 } from 'lucide-react';
import { BrokerSettingsSection } from '@/components/settings/BrokerSettingsSection';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRole {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: AppRole | null;
  role_id: string | null;
}

const roleLabels: Record<AppRole, string> = {
  acceso_total: 'Acceso Total',
  revision_edicion_1: 'Revisión y Edición 1',
  revision_edicion_2: 'Revisión y Edición 2',
  revision: 'Solo Lectura',
};

const roleColors: Record<AppRole, string> = {
  acceso_total: 'bg-destructive text-destructive-foreground',
  revision_edicion_1: 'bg-warning text-warning-foreground',
  revision_edicion_2: 'bg-info text-info-foreground',
  revision: 'bg-muted text-muted-foreground',
};

export default function Settings() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const { user: currentUser } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          created_at: profile.created_at,
          role: userRole?.role ?? null,
          role_id: userRole?.id ?? null,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los usuarios.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: AppRole | 'none') => {
    setUpdatingUser(userId);
    
    try {
      const targetUser = users.find((u) => u.user_id === userId);
      if (!targetUser) return;

      if (newRole === 'none') {
        // Remove role
        if (targetUser.role_id) {
          const { error } = await supabase
            .from('user_roles')
            .delete()
            .eq('id', targetUser.role_id);

          if (error) throw error;

          // Log the action
          await supabase.from('audit_logs').insert({
            user_id: currentUser?.id,
            user_email: currentUser?.email,
            action: 'delete',
            module: 'user_roles',
            record_id: targetUser.role_id as `${string}-${string}-${string}-${string}-${string}`,
            record_type: 'user_role',
            details: { 
              target_user_id: userId, 
              target_email: targetUser.email,
              previous_role: targetUser.role 
            },
          });
        }
      } else if (targetUser.role_id) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('id', targetUser.role_id);

        if (error) throw error;

        // Log the action
        await supabase.from('audit_logs').insert({
          user_id: currentUser?.id,
          user_email: currentUser?.email,
          action: 'update',
          module: 'user_roles',
          record_id: targetUser.role_id as `${string}-${string}-${string}-${string}-${string}`,
          record_type: 'user_role',
          details: { 
            target_user_id: userId, 
            target_email: targetUser.email,
            previous_role: targetUser.role,
            new_role: newRole 
          },
        });
      } else {
        // Insert new role
        const { data: newRoleData, error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole })
          .select()
          .single();

        if (error) throw error;

        // Log the action
        await supabase.from('audit_logs').insert({
          user_id: currentUser?.id,
          user_email: currentUser?.email,
          action: 'insert',
          module: 'user_roles',
          record_id: newRoleData.id,
          record_type: 'user_role',
          details: { 
            target_user_id: userId, 
            target_email: targetUser.email,
            new_role: newRole 
          },
        });
      }

      toast({
        title: 'Rol actualizado',
        description: `El rol de ${targetUser.email} ha sido actualizado.`,
      });

      // Refresh the users list
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el rol.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">Administración del sistema</p>
      </div>

      {/* Broker Settings Section */}
      <BrokerSettingsSection />

      {/* User Management */}
      <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              <CardTitle>Gestión de Usuarios</CardTitle>
            </div>
            <CardDescription>
              Administra los usuarios del sistema y asigna roles de acceso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay usuarios registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Fecha de Registro</TableHead>
                      <TableHead>Rol Actual</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.full_name || 'Sin nombre'}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          {user.role ? (
                            <Badge className={roleColors[user.role]}>
                              <Shield className="h-3 w-3 mr-1" />
                              {roleLabels[user.role]}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Sin rol
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Select
                              value={user.role || 'none'}
                              onValueChange={(value) =>
                                handleRoleChange(user.user_id, value as AppRole | 'none')
                              }
                              disabled={
                                updatingUser === user.user_id ||
                                user.user_id === currentUser?.id
                              }
                            >
                              <SelectTrigger className="w-[200px]">
                                {updatingUser === user.user_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <SelectValue placeholder="Seleccionar rol" />
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  <span className="text-muted-foreground">Sin rol</span>
                                </SelectItem>
                                <SelectItem value="acceso_total">
                                  Acceso Total
                                </SelectItem>
                                <SelectItem value="revision_edicion_1">
                                  Revisión y Edición 1
                                </SelectItem>
                                <SelectItem value="revision_edicion_2">
                                  Revisión y Edición 2
                                </SelectItem>
                                <SelectItem value="revision">
                                  Solo Lectura
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {user.user_id === currentUser?.id && (
                              <span className="text-xs text-muted-foreground">
                                (Tú)
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Role descriptions */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-sm font-semibold mb-4">Descripción de Roles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={roleColors.acceso_total}>Acceso Total</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Acceso completo a todas las funciones del sistema, incluyendo
                    administración de usuarios, finanzas y configuración.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={roleColors.revision_edicion_1}>
                      Revisión y Edición 1
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Puede ver y editar clientes, pólizas, cobranzas y renovaciones.
                    Acceso a finanzas y auditoría.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={roleColors.revision_edicion_2}>
                      Revisión y Edición 2
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Puede ver y editar clientes, pólizas, cobranzas y renovaciones.
                    Sin acceso a finanzas ni administración.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={roleColors.revision}>Solo Lectura</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Solo puede visualizar información. No puede crear, editar ni
                    eliminar registros.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
