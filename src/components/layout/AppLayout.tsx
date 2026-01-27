import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  RefreshCw,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Cake,
  PiggyBank,
  Percent,
  ClipboardList,
  BookOpen,
  Target,
  Handshake,
  ScrollText,
  Menu,
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: AppRole[];
  badge?: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Clientes',
    href: '/clients',
    icon: Users,
  },
  {
    title: 'Cobranzas',
    href: '/collections',
    icon: DollarSign,
  },
  {
    title: 'Renovaciones',
    href: '/renewals',
    icon: RefreshCw,
  },
  {
    title: 'Plantillas',
    href: '/templates',
    icon: FileText,
  },
  {
    title: 'Cumpleaños',
    href: '/birthdays',
    icon: Cake,
  },
  {
    title: 'Finanzas',
    href: '/finances',
    icon: PiggyBank,
    roles: ['acceso_total', 'revision_edicion_1'],
  },
  {
    title: 'Comisiones',
    href: '/commissions',
    icon: Percent,
    roles: ['acceso_total', 'revision_edicion_1'],
  },
  {
    title: 'Tareas',
    href: '/tasks',
    icon: ClipboardList,
  },
  {
    title: 'Tutoriales',
    href: '/tutorials',
    icon: BookOpen,
  },
  {
    title: 'Ventas',
    href: '/sales',
    icon: Target,
  },
  {
    title: 'Alianzas',
    href: '/partnerships',
    icon: Handshake,
  },
  {
    title: 'Auditoría',
    href: '/audit-logs',
    icon: ScrollText,
    roles: ['acceso_total', 'revision_edicion_1'],
  },
];

const roleLabels: Record<AppRole, string> = {
  acceso_total: 'Acceso Total',
  revision_edicion_1: 'Revisión y Edición 1',
  revision_edicion_2: 'Revisión y Edición 2',
  revision: 'Solo Lectura',
};

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, profile, role, signOut } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (href: string) => location.pathname === href;

  const canAccess = (item: NavItem) => {
    if (!item.roles) return true;
    return role && item.roles.includes(role);
  };

  const filteredNavItems = navigationItems.filter(canAccess);

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    const content = (
      <button
        onClick={() => {
          navigate(item.href);
          setIsMobileOpen(false);
        }}
        className={cn(
          'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          active
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isCollapsed && 'justify-center px-2'
        )}
      >
        <Icon className={cn('h-5 w-5 shrink-0', active && 'text-sidebar-primary-foreground')} />
        {!isCollapsed && <span className="truncate">{item.title}</span>}
      </button>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-sidebar flex flex-col transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64',
          'lg:relative',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-sidebar-border',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground">GIP</span>
              <span className="text-xs text-sidebar-foreground/60">Asesores Integrales</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-2 space-y-1">
            {filteredNavItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2 space-y-1">
          {role === 'acceso_total' && (
            <NavItemComponent
              item={{
                title: 'Configuración',
                href: '/settings',
                icon: Settings,
              }}
            />
          )}

          {/* User info */}
          {!isCollapsed && (
            <div className="px-3 py-2 mb-1">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.full_name || user?.email}
              </p>
              <p className="text-xs text-sidebar-foreground/60 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {role ? roleLabels[role] : 'Sin rol'}
              </p>
            </div>
          )}

          {/* Sign out */}
          {isCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center w-full px-2 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Cerrar sesión</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Cerrar sesión</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center h-14 px-4 border-b bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-3 font-semibold">GIP Asesores Integrales</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
