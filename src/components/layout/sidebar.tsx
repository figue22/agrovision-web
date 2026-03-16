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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Parcelas', href: '/parcels', icon: MapPin },
  { label: 'Cultivos', href: '/crops', icon: Sprout },
  { label: 'Actividades', href: '/activities', icon: ClipboardList },
  { label: 'Predicciones', href: '/predictions', icon: BarChart3 },
  { label: 'Recomendaciones', href: '/recommendations', icon: Lightbulb },
  { label: 'Clima', href: '/weather', icon: Cloud },
  { label: 'Alertas', href: '/alerts', icon: Bell },
  { label: 'Chat IA', href: '/chat', icon: MessageCircle },
];

const adminItems = [
  { label: 'Usuarios', href: '/admin/users', icon: Users },
  { label: 'Documentos RAG', href: '/admin/documents', icon: FileText },
  { label: 'Catálogos', href: '/admin/catalogs', icon: BookOpen },
  { label: 'Auditoría', href: '/admin/audit', icon: Shield },
  { label: 'Monitoreo', href: '/admin/monitoring', icon: Activity },
  { label: 'Analíticas', href: '/admin/analytics', icon: PieChart },
];

const bottomItems = [
  { label: 'Perfil', href: '/profile', icon: User },
  { label: 'Configuración', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16',
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {sidebarOpen && (
          <span className="text-lg font-bold text-primary">🌱 AgroVision</span>
        )}
        <button onClick={toggleSidebar} className="rounded-md p-1.5 hover:bg-accent">
          <ChevronLeft
            className={cn('h-5 w-5 transition-transform', !sidebarOpen && 'rotate-180')}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 overflow-y-auto p-2" style={{ height: 'calc(100vh - 4rem)' }}>
        <div className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </div>

        {/* Admin section */}
        <div className="mt-4 border-t pt-4">
          {sidebarOpen && (
            <span className="mb-2 block px-3 text-xs font-semibold uppercase text-muted-foreground">
              Administración
            </span>
          )}
          <div className="flex flex-col gap-1">
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  pathname.startsWith(item.href)
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom items */}
        <div className="mt-auto border-t pt-4">
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                pathname === item.href
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}
