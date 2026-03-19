'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MapPin,
  Sprout,
  ClipboardList,
  BarChart3,
  Lightbulb,
  Cloud,
  Bell,
  MessageCircle,
  Users,
  FileText,
  BookOpen,
  Shield,
  Activity,
  PieChart,
  Settings,
  User,
  ChevronLeft,
  Leaf,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';

type Rol = 'admin' | 'tecnico' | 'agricultor';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Rol[]; // qué roles pueden ver esta ruta
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['agricultor', 'tecnico', 'admin'] },
  { label: 'Parcelas', href: '/parcels', icon: MapPin, roles: ['agricultor', 'tecnico', 'admin'] },
  { label: 'Cultivos', href: '/crops', icon: Sprout, roles: ['agricultor', 'tecnico', 'admin'] },
  { label: 'Actividades', href: '/activities', icon: ClipboardList, roles: ['agricultor', 'tecnico', 'admin'] },
  { label: 'Predicciones', href: '/predictions', icon: BarChart3, roles: ['agricultor', 'tecnico', 'admin'] },
  { label: 'Recomendaciones', href: '/recommendations', icon: Lightbulb, roles: ['agricultor', 'tecnico', 'admin'] },
  { label: 'Clima', href: '/weather', icon: Cloud, roles: ['agricultor', 'tecnico', 'admin'] },
  { label: 'Alertas', href: '/alerts', icon: Bell, roles: ['agricultor', 'tecnico', 'admin'] },
  { label: 'Chat IA', href: '/chat', icon: MessageCircle, roles: ['agricultor', 'tecnico', 'admin'] },
];

const adminItems: NavItem[] = [
  { label: 'Usuarios', href: '/admin/users', icon: Users, roles: ['admin'] },
  { label: 'Documentos RAG', href: '/admin/documents', icon: FileText, roles: ['admin'] },
  { label: 'Catálogos', href: '/admin/catalogs', icon: BookOpen, roles: ['admin'] },
  { label: 'Auditoría', href: '/admin/audit', icon: Shield, roles: ['admin'] },
  { label: 'Monitoreo', href: '/admin/monitoring', icon: Activity, roles: ['admin', 'tecnico'] },
  { label: 'Analíticas', href: '/admin/analytics', icon: PieChart, roles: ['admin'] },
];

const bottomItems: NavItem[] = [
  { label: 'Perfil', href: '/profile', icon: User, roles: ['agricultor', 'tecnico', 'admin'] },
  { label: 'Configuración', href: '/settings', icon: Settings, roles: ['agricultor', 'tecnico', 'admin'] },
];

function NavLink({ item, sidebarOpen, pathname }: { item: NavItem; sidebarOpen: boolean; pathname: string }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={!sidebarOpen ? item.label : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
        isActive
          ? 'bg-emerald-600 font-medium text-white shadow-sm'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-white')} />
      {sidebarOpen && <span>{item.label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { usuario } = useAuthStore();

  const userRole = usuario?.rol || 'agricultor';

  // Filtrar items según el rol del usuario
  const visibleNavItems = navItems.filter((item) => item.roles.includes(userRole));
  const visibleAdminItems = adminItems.filter((item) => item.roles.includes(userRole));
  const visibleBottomItems = bottomItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-[68px]',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <Leaf className="h-5 w-5" />
        </div>
        {sidebarOpen && (
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">AgroVision</span>
            <span className="text-[10px] text-muted-foreground">Predictor & RAG</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {sidebarOpen && (
          <span className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Principal
          </span>
        )}
        {visibleNavItems.map((item) => (
          <NavLink key={item.href} item={item} sidebarOpen={sidebarOpen} pathname={pathname} />
        ))}

        {/* Admin - solo se muestra si hay items visibles para este rol */}
        {visibleAdminItems.length > 0 && (
          <div className="mt-5">
            {sidebarOpen && (
              <span className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Administración
              </span>
            )}
            {!sidebarOpen && <div className="mx-3 mb-2 border-t" />}
            {visibleAdminItems.map((item) => (
              <NavLink key={item.href} item={item} sidebarOpen={sidebarOpen} pathname={pathname} />
            ))}
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t p-3">
        {visibleBottomItems.map((item) => (
          <NavLink key={item.href} item={item} sidebarOpen={sidebarOpen} pathname={pathname} />
        ))}
      </div>
    </aside>
  );
}