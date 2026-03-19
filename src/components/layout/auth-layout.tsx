'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

const publicRoutes = ['/auth/login', '/auth/register'];

// Rutas protegidas por rol
const routePermissions: Record<string, string[]> = {
  '/admin/users': ['admin'],
  '/admin/documents': ['admin'],
  '/admin/catalogs': ['admin'],
  '/admin/audit': ['admin'],
  '/admin/analytics': ['admin'],
  '/admin/monitoring': ['admin', 'tecnico'],
};

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, usuario } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const isPublicRoute = publicRoutes.includes(pathname);

    if (!isAuthenticated && !isPublicRoute) {
      router.push('/auth/login');
      return;
    }

    if (isAuthenticated && isPublicRoute) {
      router.push('/dashboard');
      return;
    }

    // Verificar permisos de rol
    if (isAuthenticated && usuario) {
      const allowedRoles = Object.entries(routePermissions).find(
        ([route]) => pathname.startsWith(route),
      );

      if (allowedRoles && !allowedRoles[1].includes(usuario.rol)) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, pathname, mounted, router, usuario]);

  if (!mounted) {
    return null;
  }

  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-64 flex flex-1 flex-col transition-all duration-300">
        <Header />
        <main className="flex-1 bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  );
}