import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  RefreshCw, 
  Users, 
  CheckSquare,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Clock,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCollectionStats } from '@/hooks/useCollections';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export default function Dashboard() {
  const { profile } = useAuthContext();
  const navigate = useNavigate();
  
  const { data: collectionStats, isLoading: isLoadingCollections } = useCollectionStats();
  const { data: dashboardStats, isLoading: isLoadingDashboard } = useDashboardStats();

  const isLoading = isLoadingCollections || isLoadingDashboard;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          ¡Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}!
        </h1>
        <p className="text-muted-foreground">
          Aquí tienes un resumen de tu actividad
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Cobranzas */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-warning group"
          onClick={() => navigate('/collections')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cobranzas Pendientes
            </CardTitle>
            <div className="p-2 bg-warning/10 rounded-lg group-hover:bg-warning/20 transition-colors">
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-warning animate-spin" />
              ) : (
                <DollarSign className="h-5 w-5 text-warning" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? '...' : collectionStats?.totalPending || 0}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-muted-foreground">
                ${isLoading ? '...' : (collectionStats?.totalAmount || 0).toLocaleString()}
              </p>
              {!isLoading && (collectionStats?.overdue || 0) > 0 && (
                <span className="flex items-center gap-1 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  {collectionStats?.overdue} vencidas
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Renovaciones */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-info group"
          onClick={() => navigate('/renewals')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próximas Renovaciones
            </CardTitle>
            <div className="p-2 bg-info/10 rounded-lg group-hover:bg-info/20 transition-colors">
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-info animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5 text-info" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? '...' : dashboardStats?.renovaciones.count || 0}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-muted-foreground">
                ${isLoading ? '...' : (dashboardStats?.renovaciones.amount || 0).toLocaleString()}
              </p>
              {!isLoading && (dashboardStats?.renovaciones.thisWeek || 0) > 0 && (
                <span className="flex items-center gap-1 text-xs text-info">
                  <Calendar className="h-3 w-3" />
                  {dashboardStats?.renovaciones.thisWeek} esta semana
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Clientes */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-success group"
          onClick={() => navigate('/clients')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clientes
            </CardTitle>
            <div className="p-2 bg-success/10 rounded-lg group-hover:bg-success/20 transition-colors">
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-success animate-spin" />
              ) : (
                <Users className="h-5 w-5 text-success" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? '...' : dashboardStats?.clientes.total || 0}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {!isLoading && (dashboardStats?.clientes.thisMonth || 0) > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="text-sm text-success">
                    +{dashboardStats?.clientes.thisMonth} este mes
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Base de datos activa
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tareas */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-secondary group"
          onClick={() => navigate('/tasks')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tareas Internas
            </CardTitle>
            <div className="p-2 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
              <CheckSquare className="h-5 w-5 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-muted-foreground">
                Pendientes de completar
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-accent hover:bg-accent/5"
              onClick={() => navigate('/clients')}
            >
              <Users className="h-6 w-6 text-accent" />
              <span>Ver Clientes</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-accent hover:bg-accent/5"
              onClick={() => navigate('/clients/new')}
            >
              <Users className="h-6 w-6 text-accent" />
              <span>Nuevo Cliente</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-accent hover:bg-accent/5"
              onClick={() => navigate('/collections')}
            >
              <DollarSign className="h-6 w-6 text-accent" />
              <span>Cobranzas</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-accent hover:bg-accent/5"
              onClick={() => navigate('/renewals')}
            >
              <RefreshCw className="h-6 w-6 text-accent" />
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
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mb-4 opacity-50" />
              <p>No hay actividad reciente</p>
              <p className="text-sm">Las acciones aparecerán aquí</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
