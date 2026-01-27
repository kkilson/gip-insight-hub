import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, CheckCircle } from 'lucide-react';

export default function FirstTimeSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { user, refreshUserData, signOut } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSetupAdmin = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Try to insert the admin role for the first user
      const { error } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: user.id, 
          role: 'acceso_total' 
        });

      if (error) {
        if (error.code === '42501') {
          toast({
            title: 'No autorizado',
            description: 'Ya existe un administrador en el sistema. Contacta al administrador para que te asigne un rol.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      // Log the action
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_email: user.email,
        action: 'first_admin_setup',
        module: 'user_roles',
        record_type: 'user_role',
        details: { 
          message: 'First administrator account created',
          role: 'acceso_total'
        },
      });

      setIsSuccess(true);
      toast({
        title: '¡Configuración completada!',
        description: 'Tu cuenta ha sido configurada como administrador.',
      });

      // Refresh user data to get the new role
      refreshUserData();
      
      // Wait a moment then redirect
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error setting up admin:', error);
      toast({
        title: 'Error',
        description: 'No se pudo configurar tu cuenta. Por favor intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <CardTitle className="text-2xl text-success">¡Configuración Exitosa!</CardTitle>
            <CardDescription>
              Tu cuenta ha sido configurada como administrador del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Serás redirigido al dashboard en unos segundos...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-accent" />
          </div>
          <CardTitle className="text-2xl">Configuración Inicial</CardTitle>
          <CardDescription>
            Bienvenido a GIP Asesores Integrales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">
            Eres el primer usuario del sistema. Para comenzar, necesitas configurar
            tu cuenta como <strong>Administrador</strong> con acceso total.
          </p>
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Como administrador podrás:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Gestionar usuarios y asignar roles</li>
              <li>• Acceder a todas las funciones del sistema</li>
              <li>• Ver registros de auditoría</li>
              <li>• Configurar el sistema</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button 
            onClick={handleSetupAdmin}
            className="w-full bg-accent hover:bg-accent/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Configurando...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Configurar como Administrador
              </>
            )}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleSignOut}
            className="w-full"
            disabled={isLoading}
          >
            Cerrar sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
