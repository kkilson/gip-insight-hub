import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import FirstTimeSetup from "./pages/FirstTimeSetup";
import Clients from "./pages/Clients";
import Collections from "./pages/Collections";
import Renewals from "./pages/Renewals";
import Templates from "./pages/Templates";
import AuditLogs from "./pages/AuditLogs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component for protected pages with layout
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/setup"
              element={
                <ProtectedRoute requireAnyRole={false}>
                  <FirstTimeSetup />
                </ProtectedRoute>
              }
            />
            
            {/* Protected routes with layout */}
            <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
            <Route path="/clients" element={<ProtectedLayout><Clients /></ProtectedLayout>} />
            <Route path="/collections" element={<ProtectedLayout><Collections /></ProtectedLayout>} />
            <Route path="/renewals" element={<ProtectedLayout><Renewals /></ProtectedLayout>} />
            <Route path="/templates" element={<ProtectedLayout><Templates /></ProtectedLayout>} />
            
            {/* Placeholder pages */}
            <Route path="/birthdays" element={<ProtectedLayout><PlaceholderPage title="Cumpleaños" description="Gestiona los cumpleaños de tus clientes" /></ProtectedLayout>} />
            <Route path="/finances" element={
              <ProtectedRoute requiredRoles={['acceso_total', 'revision_edicion_1']}>
                <AppLayout><PlaceholderPage title="Finanzas" description="Administra ingresos, gastos y presupuestos" /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/commissions" element={
              <ProtectedRoute requiredRoles={['acceso_total', 'revision_edicion_1']}>
                <AppLayout><PlaceholderPage title="Comisiones" description="Gestiona las comisiones por póliza" /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/tasks" element={<ProtectedLayout><PlaceholderPage title="Tareas" description="Gestiona las tareas internas del equipo" /></ProtectedLayout>} />
            <Route path="/tutorials" element={<ProtectedLayout><PlaceholderPage title="Tutoriales" description="Guías y procesos del sistema" /></ProtectedLayout>} />
            <Route path="/sales" element={<ProtectedLayout><PlaceholderPage title="Ventas" description="Objetivos y seguimiento de ventas" /></ProtectedLayout>} />
            <Route path="/partnerships" element={<ProtectedLayout><PlaceholderPage title="Alianzas" description="Gestiona alianzas y cupones" /></ProtectedLayout>} />
            <Route path="/audit-logs" element={
              <ProtectedRoute requiredRoles={['acceso_total', 'revision_edicion_1']}>
                <AppLayout><AuditLogs /></AppLayout>
              </ProtectedRoute>
            } />
            
            <Route
              path="/settings"
              element={
                <ProtectedRoute requiredRoles={['acceso_total']}>
                  <AppLayout><Settings /></AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
