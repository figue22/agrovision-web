'use client';

import { Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

export function Header() {
  const { usuario, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-6">
      <div />
      <div className="flex items-center gap-4">
        <button className="relative rounded-md p-2 hover:bg-accent">
          <Bell className="h-5 w-5" />
        </button>
        {usuario && (
          <div className="flex items-center gap-3">
            <span className="text-sm">
              {usuario.nombre} {usuario.apellido}
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {usuario.rol}
            </span>
            <button onClick={logout} className="rounded-md p-2 hover:bg-accent" title="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
