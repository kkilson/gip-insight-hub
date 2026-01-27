import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  RefreshCw, 
  Users, 
  CheckSquare,
  LogOut,
  Settings,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const roleLabels: Record<string, string> = {
  acceso_total: 'Acceso Total',
  revision_edicion_1: 'Revisión y Edición 1',
  revision_edicion_2: 'Revisión y Edición 2',
  revision: 'Solo Lectura',
};

export default function Dashboard() {
  const { user, profile, role, signOut } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Placeholder data - will be replaced with real data from database
  const stats = {
    cobranzas: { count: 0, amount: 0 },
    renovaciones: { count: 0, amount: 0 },
    clientes: { count: 0 },
    tareas: { count: 0 },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">GIP Asesores Integrales</h1>
              <p className="text-sm text-primary-foreground/70">Sistema de Gestión</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{profile?.full_name || user?.email}</p>
                <p className="text-xs text-primary-foreground/70 flex items-center justify-end gap-1">
                  <Shield className="h-3 w-3" />
                  {role ? roleLabels[role] : 'Sin rol'}
                </p>
              </div>
              <div className="flex gap-2">
                {role === 'acceso_total' && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={() => navigate('/settings')}
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Vista general del sistema</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Cobranzas */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-warning">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cobranzas Pendientes
              </CardTitle>
              <DollarSign className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cobranzas.count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ${stats.cobranzas.amount.toLocaleString()} total
              </p>
            </CardContent>
          </Card>

          {/* Renovaciones */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-info">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Próximas Renovaciones
              </CardTitle>
              <RefreshCw className="h-5 w-5 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.renovaciones.count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ${stats.renovaciones.amount.toLocaleString()} total
              </p>
            </CardContent>
          </Card>

          {/* Clientes */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-success">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Clientes
              </CardTitle>
              <Users className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clientes.count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Base de datos activa
              </p>
            </CardContent>
          </Card>

          {/* Tareas */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-secondary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tareas Internas
              </CardTitle>
              <CheckSquare className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tareas.count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pendientes de completar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => navigate('/clients')}
              >
                <Users className="h-6 w-6" />
                <span>Ver Clientes</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => navigate('/clients/new')}
              >
                <Users className="h-6 w-6" />
                <span>Nuevo Cliente</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => navigate('/collections')}
              >
                <DollarSign className="h-6 w-6" />
                <span>Cobranzas</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => navigate('/renewals')}
              >
                <RefreshCw className="h-6 w-6" />
                <span>Renovaciones</span>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas acciones realizadas en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay actividad reciente</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
