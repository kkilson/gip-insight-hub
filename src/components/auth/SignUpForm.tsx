import { useState } from 'react';
import { z } from 'zod';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre debe tener menos de 100 caracteres'),
  email: z.string().trim().email('Correo electrónico inválido').max(255, 'El correo debe tener menos de 255 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(72, 'La contraseña debe tener menos de 72 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

interface SignUpFormProps {
  onToggleMode: () => void;
}

export function SignUpForm({ onToggleMode }: SignUpFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const { signUp } = useAuthContext();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    const result = signUpSchema.safeParse({ fullName, email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof errors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);

      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: 'Usuario ya registrado',
            description: 'Este correo electrónico ya está registrado. Por favor inicia sesión.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error al registrarse',
            description: error.message,
            variant: 'destructive',
          });
        }
        return;
      }

      setIsSuccess(true);
      toast({
        title: 'Registro exitoso',
        description: 'Tu cuenta ha sido creada. Un administrador debe asignarte un rol para acceder al sistema.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado. Por favor intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-success">¡Registro Exitoso!</CardTitle>
          <CardDescription>
            Tu cuenta ha sido creada correctamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Un administrador debe asignarte un rol para que puedas acceder al sistema.
            Te notificaremos cuando tu cuenta esté activa.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={onToggleMode}
            className="w-full bg-accent hover:bg-accent/90"
          >
            Volver a Iniciar Sesión
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-0">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Solicitar Acceso</CardTitle>
        <CardDescription>
          Crea tu cuenta para solicitar acceso al sistema
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre Completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                autoComplete="name"
              />
            </div>
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Correo Electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="signup-email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full bg-accent hover:bg-accent/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              'Solicitar Acceso'
            )}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={onToggleMode}
              className="text-accent hover:underline font-medium"
            >
              Iniciar sesión
            </button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
