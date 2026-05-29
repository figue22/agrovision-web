'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, CheckCheck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { alertsService, AlertaResponse } from '@/services/alerts.service';

const severidadStyle: Record<string, { bg: string; text: string; dot: string }> = {
  info:    { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  baja:    { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  media:   { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  alta:    { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  critica: { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500' },
};

export function Header() {
  const { usuario, logout } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: unreadCount } = useQuery({
    queryKey: ['alertas-unread-count'],
    queryFn: alertsService.countUnread,
    refetchInterval: 30000, // refresca cada 30s
    enabled: !!usuario,
  });

  const { data: alertas, isLoading } = useQuery({
    queryKey: ['alertas-preview'],
    queryFn: alertsService.getUnread,
    enabled: open && !!usuario,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => alertsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-preview'] });
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: alertsService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-preview'] });
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
    },
  });

  const count = unreadCount?.count || 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-6">
      <div />
      <div className="flex items-center gap-4">

        {/* Botón notificaciones */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative rounded-md p-2 hover:bg-accent"
          >
            <Bell className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-12 z-50 w-96 overflow-hidden rounded-xl border bg-card shadow-xl">
              {/* Header dropdown */}
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="text-sm font-semibold">Notificaciones</span>
                <div className="flex items-center gap-2">
                  {count > 0 && (
                    <button
                      onClick={() => markAllReadMutation.mutate()}
                      disabled={markAllReadMutation.isPending}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent"
                    >
                      <CheckCheck className="h-3 w-3" /> Marcar todas
                    </button>
                  )}
                  <button
                    onClick={() => { setOpen(false); router.push('/alerts'); }}
                    className="rounded-lg px-2 py-1 text-[11px] text-emerald-600 hover:bg-emerald-50"
                  >
                    Ver todas
                  </button>
                </div>
              </div>

              {/* Lista de alertas */}
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="flex h-24 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  </div>
                ) : alertas && alertas.length > 0 ? (
                  <div className="divide-y">
                    {alertas.slice(0, 10).map((a) => {
                      const sev = severidadStyle[a.severidad] || severidadStyle.info;
                      return (
                        <div
                          key={a.alerta_id}
                          className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-muted/40"
                          onClick={() => markReadMutation.mutate(a.alerta_id)}
                        >
                          <div className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${sev.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-[13px] font-medium">{a.titulo}</p>
                              <span className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${sev.bg} ${sev.text}`}>
                                {a.severidad}
                              </span>
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{a.mensaje}</p>
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {a.parcela?.nombre && `${a.parcela.nombre} · `}
                              {new Date(a.creado_en).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-24 flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Bell className="h-6 w-6 text-muted-foreground/30" />
                    No tienes alertas sin leer
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t px-4 py-2.5">
                <button
                  onClick={() => { setOpen(false); router.push('/alerts'); }}
                  className="w-full rounded-lg py-1.5 text-center text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                >
                  Ver todas las alertas →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Usuario */}
        {usuario && (
          <div className="flex items-center gap-3">
            <span className="text-sm">{usuario.nombre} {usuario.apellido}</span>
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