/**
 * Error Message Utility
 * Maps database and API errors to user-friendly messages
 * Prevents information disclosure through error messages
 */

export function getUserFriendlyError(error: unknown): string {
  if (!error) {
    return 'Ocurrió un error inesperado. Por favor intenta nuevamente.';
  }

  const errorObj = error as { message?: string; code?: string };
  const errorMessage = errorObj?.message || '';
  const errorCode = errorObj?.code || '';

  // PostgreSQL error codes
  // 23505 - unique_violation
  if (errorCode === '23505' || errorMessage.includes('duplicate key') || errorMessage.includes('already exists')) {
    return 'Este registro ya existe. Por favor verifica los datos ingresados.';
  }

  // 23503 - foreign_key_violation
  if (errorCode === '23503' || errorMessage.includes('foreign key')) {
    return 'No se puede completar la operación debido a registros relacionados.';
  }

  // 23502 - not_null_violation
  if (errorCode === '23502' || errorMessage.includes('not-null constraint') || errorMessage.includes('null value')) {
    return 'Faltan datos requeridos. Por favor completa todos los campos obligatorios.';
  }

  // 23514 - check_violation
  if (errorCode === '23514' || errorMessage.includes('check constraint')) {
    return 'Los datos ingresados no cumplen con las validaciones requeridas.';
  }

  // Row Level Security errors
  if (
    errorMessage.toLowerCase().includes('row-level security') ||
    errorMessage.toLowerCase().includes('rls') ||
    errorMessage.toLowerCase().includes('policy')
  ) {
    return 'No tienes permisos para realizar esta acción.';
  }

  // Authentication/JWT errors
  if (
    errorMessage.toLowerCase().includes('jwt') ||
    errorMessage.toLowerCase().includes('token') ||
    errorMessage.toLowerCase().includes('expired') ||
    errorMessage.toLowerCase().includes('invalid claim')
  ) {
    return 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
  }

  // Supabase Auth specific errors
  if (errorMessage.toLowerCase().includes('invalid login credentials')) {
    return 'Credenciales incorrectas. Por favor verifica tu correo y contraseña.';
  }

  if (errorMessage.toLowerCase().includes('email not confirmed')) {
    return 'Por favor confirma tu correo electrónico antes de iniciar sesión.';
  }

  if (errorMessage.toLowerCase().includes('user already registered') || 
      errorMessage.toLowerCase().includes('user already exists')) {
    return 'Ya existe una cuenta con este correo electrónico.';
  }

  if (errorMessage.toLowerCase().includes('password')) {
    return 'La contraseña no cumple con los requisitos de seguridad.';
  }

  if (errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('too many requests')) {
    return 'Demasiados intentos. Por favor espera un momento antes de intentar nuevamente.';
  }

  // Network errors
  if (
    errorMessage.toLowerCase().includes('network') ||
    errorMessage.toLowerCase().includes('fetch') ||
    errorMessage.toLowerCase().includes('connection')
  ) {
    return 'Error de conexión. Por favor verifica tu conexión a internet.';
  }

  // Storage errors
  if (errorMessage.toLowerCase().includes('storage') || errorMessage.toLowerCase().includes('bucket')) {
    return 'Error al procesar el archivo. Por favor intenta nuevamente.';
  }

  // File size errors
  if (errorMessage.toLowerCase().includes('size') || errorMessage.toLowerCase().includes('too large')) {
    return 'El archivo es demasiado grande. Por favor selecciona un archivo más pequeño.';
  }

  // Log the original error for debugging (only in development)
  if (import.meta.env.DEV) {
    console.error('Original error:', error);
  }

  // Generic fallback
  return 'Ocurrió un error. Por favor intenta nuevamente o contacta al soporte.';
}

/**
 * Get error message for form validation contexts
 */
export function getFormValidationError(error: unknown): string {
  const message = getUserFriendlyError(error);
  return message;
}

/**
 * Sanitize error for logging purposes (removes sensitive data patterns)
 */
export function sanitizeErrorForLogging(error: unknown): Record<string, unknown> {
  const errorObj = error as { message?: string; code?: string; stack?: string };
  
  return {
    code: errorObj?.code,
    hasMessage: !!errorObj?.message,
    timestamp: new Date().toISOString(),
  };
}
