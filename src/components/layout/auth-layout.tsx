'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

const publicRoutes = ['/auth/login', '/auth/register'];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const isPublicRoute = publicRoutes.includes(pathname);

    if (!isAuthenticated && !isPublicRoute) {
      router.push('/auth/login');
    }

    if (isAuthenticated && isPublicRoute) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, pathname, mounted, router]);

  // Evitar flash mientras se monta
  if (!mounted) {
    return null;
  }

  const isPublicRoute = publicRoutes.includes(pathname);

  // Rutas públicas: solo el contenido, sin sidebar ni header
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Si no está autenticado y no es ruta pública, no mostrar nada (va a redirigir)
  if (!isAuthenticated) {
    return null;
  }

  // Rutas protegidas: sidebar + header + contenido
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