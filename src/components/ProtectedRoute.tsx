import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: AppRole[];
  requireAnyRole?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles,
  requireAnyRole = true 
}: ProtectedRouteProps) {
  const { user, role, hasRole, isLoading } = useAuthContext();
  const location = useLocation();
  const [noAdminExists, setNoAdminExists] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkIfAdminExists = async () => {
      if (!user || hasRole) {
        setCheckingAdmin(false);
        return;
      }

      try {
        // Call the RPC function to check if any admin exists
        const { data, error } = await supabase.rpc('no_admin_exists');
        
        if (error) {
          console.error('Error checking admin existence:', error);
          setNoAdminExists(false);
        } else {
          setNoAdminExists(data as boolean);
        }
      } catch (err) {
        console.error('Error:', err);
        setNoAdminExists(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    if (!isLoading) {
      checkIfAdminExists();
    }
  }, [user, hasRole, isLoading]);

  if (isLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User has no role but no admin exists - redirect to first time setup
  if (!hasRole && noAdminExists) {
    if (location.pathname !== '/setup') {
      return <Navigate to="/setup" replace />;
    }
    return <>{children}</>;
  }

  // User has no role assigned and there is an admin
  if (requireAnyRole && !hasRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-warning/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-warning"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Acceso Pendiente
          </h1>
          <p className="text-muted-foreground">
            Tu cuenta ha sido creada pero aún no tienes un rol asignado.
            Un administrador debe asignarte permisos para acceder al sistema.
          </p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="text-accent hover:underline"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  // Check specific roles if required
  if (requiredRoles && requiredRoles.length > 0) {
    if (!role || !requiredRoles.includes(role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-destructive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Acceso Denegado
            </h1>
            <p className="text-muted-foreground">
              No tienes los permisos necesarios para acceder a esta sección.
            </p>
            <button
              onClick={() => window.history.back()}
              className="text-accent hover:underline"
            >
              Volver atrás
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
