'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, CheckCheck, Loader2 } from 'lucide-react';
import { alertsService, AlertaResponse } from '@/services/alerts.service';
import { useAuthStore } from '@/store/auth-store';

const severidadStyle: Record<string, { bg: string; text: string }> = {
  info: { bg: 'bg-blue-50', text: 'text-blue-700' },
  baja: { bg: 'bg-green-50', text: 'text-green-700' },
  media: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  alta: { bg: 'bg-orange-50', text: 'text-orange-700' },
  critica: { bg: 'bg-red-50', text: 'text-red-700' },
};

export default function AlertsPage() {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = usuario?.rol === 'admin' || usuario?.rol === 'tecnico';

  const { data: alertas, isLoading } = useQuery({
    queryKey: ['alertas'],
    queryFn: alertsService.getMy,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['alertas-unread-count'],
    queryFn: alertsService.countUnread,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => alertsService.markAsRead(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['alertas'] }); queryClient.invalidateQueries({ queryKey: ['alertas-unread-count'] }); },
  });

  const markAllReadMutation = useMutation({
    mutationFn: alertsService.markAllAsRead,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['alertas'] }); queryClient.invalidateQueries({ queryKey: ['alertas-unread-count'] }); },
  });

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  const noLeidas = alertas?.filter((a) => !a.esta_leida) || [];
  const leidas = alertas?.filter((a) => a.esta_leida) || [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alertas</h1>
          <p className="mt-1 text-sm text-muted-foreground">{unreadCount?.count || 0} sin leer · {alertas?.length || 0} total</p>
        </div>
        {noLeidas.length > 0 && (
          <button onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent">
            <CheckCheck className="h-4 w-4" /> Marcar todas como leídas
          </button>
        )}
      </div>

      {/* No leídas */}
      {noLeidas.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Sin leer ({noLeidas.length})</h2>
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm divide-y">
            {noLeidas.map((a) => {
              const sev = severidadStyle[a.severidad] || severidadStyle.info;
              return (
                <div key={a.alerta_id} className="flex items-start gap-3 px-5 py-4 bg-emerald-50/30 cursor-pointer hover:bg-emerald-50/50" onClick={() => markReadMutation.mutate(a.alerta_id)}>
                  <div className="mt-0.5 rounded-lg bg-amber-50 p-2 text-amber-600"><Bell className="h-4 w-4" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{a.titulo}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sev.bg} ${sev.text}`}>{a.severidad}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.mensaje}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{a.parcela?.nombre && `${a.parcela.nombre} · `}{new Date(a.creado_en).toLocaleString('es-CO')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leídas */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Leídas ({leidas.length})</h2>
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm divide-y">
          {leidas.length > 0 ? leidas.map((a) => {
            const sev = severidadStyle[a.severidad] || severidadStyle.info;
            return (
              <div key={a.alerta_id} className="flex items-start gap-3 px-5 py-4 opacity-60">
                <div className="mt-0.5 rounded-lg bg-gray-100 p-2 text-gray-400"><BellOff className="h-4 w-4" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{a.titulo}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sev.bg} ${sev.text}`}>{a.severidad}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.mensaje}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{new Date(a.creado_en).toLocaleString('es-CO')}</p>
                </div>
              </div>
            );
          }) : (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">No hay alertas leídas</div>
          )}
        </div>
      </div>
    </div>
  );
}