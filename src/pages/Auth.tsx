import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, isLoading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <div>
          <h1 className="text-3xl font-bold text-primary-foreground">
            Kover Management Assist
          </h1>
          <p className="mt-2 text-primary-foreground/80">
            Sistema de Gestión de Seguros
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-primary-foreground">
              Gestión Centralizada
            </h2>
            <p className="text-primary-foreground/70">
              Administra clientes, pólizas, cobranzas y renovaciones en un solo lugar.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-primary-foreground">
              Automatización Inteligente
            </h2>
            <p className="text-primary-foreground/70">
              Alertas automáticas de cobranzas y renovaciones para nunca perder un pago.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-primary-foreground">
              Control Total
            </h2>
            <p className="text-primary-foreground/70">
              Sistema de roles y auditoría completa de todas las acciones.
            </p>
          </div>
        </div>

        <p className="text-sm text-primary-foreground/50">
          © {new Date().getFullYear()} Kover Enabler. Todos los derechos reservados.
        </p>
      </div>

      {/* Right side - Auth forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-muted/30">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold text-primary">
              Kover Management Assist
            </h1>
            <p className="text-muted-foreground">
              Sistema de Gestión de Seguros
            </p>
          </div>

          {isLogin ? (
            <LoginForm onToggleMode={() => setIsLogin(false)} />
          ) : (
            <SignUpForm onToggleMode={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
}
