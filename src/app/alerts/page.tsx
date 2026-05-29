'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell, BellOff, CheckCheck, Loader2, AlertTriangle,
  MapPin, Clock, Zap, Trash2, Megaphone, RefreshCw,
} from 'lucide-react';
import { alertsService, AlertaResponse } from '@/services/alerts.service';
import { useAuthStore } from '@/store/auth-store';

const severidadStyle: Record<string, { bg: string; text: string; border: string; label: string; icon: string }> = {
  info:    { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-300',   label: 'Info',    icon: 'ℹ️' },
  baja:    { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-300',  label: 'Baja',    icon: '✅' },
  media:   { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300', label: 'Media',   icon: '⚠️' },
  alta:    { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', label: 'Alta',    icon: '🔴' },
  critica: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-300',    label: 'Crítica', icon: '🚨' },
};

function AlertaCard({ alerta, onRead, onUnread, onDelete }: {
  alerta: AlertaResponse;
  onRead?: (id: string) => void;
  onUnread?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sev = severidadStyle[alerta.severidad] || severidadStyle.info;
  const leida = alerta.esta_leida;

  return (
    <div className={`border-l-4 ${sev.border} ${leida ? 'opacity-70' : ''} rounded-r-xl bg-card shadow-sm overflow-hidden`}>
      <div
        className="flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-muted/20"
        onClick={() => {
          if (!leida && onRead) onRead(alerta.alerta_id);
          setExpanded((v) => !v);
        }}
      >
        <div className={`mt-0.5 flex-shrink-0 rounded-lg p-2 ${sev.bg}`}>
          {leida ? <BellOff className={`h-4 w-4 ${sev.text}`} /> : <Bell className={`h-4 w-4 ${sev.text}`} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{alerta.titulo}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sev.bg} ${sev.text}`}>
              {sev.icon} {sev.label}
            </span>
            {alerta.tipoAlerta?.nombre && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {alerta.tipoAlerta.nombre}
              </span>
            )}
            {!leida && <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />}
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{alerta.mensaje}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            {alerta.parcela?.nombre && (
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{alerta.parcela.nombre}</span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(alerta.creado_en).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
            {alerta.expira_en && (
              <span className="flex items-center gap-1 text-amber-600">
                <Zap className="h-3 w-3" />
                Expira: {new Date(alerta.expira_en).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {alerta.fecha_lectura && (
              <span className="text-muted-foreground/70">
                Leída: {new Date(alerta.fecha_lectura).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
          {leida ? (
            <button onClick={() => onUnread?.(alerta.alerta_id)} title="Marcar como no leída"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-blue-50 hover:text-blue-600">
              <Bell className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button onClick={() => onRead?.(alerta.alerta_id)} title="Marcar como leída"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600">
              <CheckCheck className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => { if (confirm('¿Eliminar esta alerta?')) onDelete?.(alerta.alerta_id); }}
            title="Eliminar"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded && alerta.accion_requerida && (
        <div className={`border-t px-5 py-3 ${sev.bg}`}>
          <p className="flex items-start gap-2 text-xs">
            <AlertTriangle className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${sev.text}`} />
            <span><span className={`font-medium ${sev.text}`}>Acción requerida: </span>
            <span className="text-muted-foreground">{alerta.accion_requerida}</span></span>
          </p>
        </div>
      )}
    </div>
  );
}

export default function AlertsPage() {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = usuario?.rol === 'admin';
  const isTecnico = usuario?.rol === 'tecnico';
  const [filtro, setFiltro] = useState<'todas' | 'no_leidas' | 'critica' | 'alta' | 'recordatorio' | 'sistema'>('todas');
  const [showSistema, setShowSistema] = useState(false);
  const [sistemaTitle, setSistemaTitle] = useState('');
  const [sistemaMsg, setSistemaMsg] = useState('');

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-preview'] });
    },
  });

  const markUnreadMutation = useMutation({
    mutationFn: (id: string) => alertsService.markAsUnread(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-preview'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: alertsService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-preview'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-preview'] });
    },
  });

  const remindersMutation = useMutation({
    mutationFn: alertsService.evaluateReminders,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-unread-count'] });
      alert(`✅ ${data.recordatorios_generados} recordatorios generados`);
    },
  });

  const sistemaMutation = useMutation({
    mutationFn: () => alertsService.createSystemNotification(sistemaTitle, sistemaMsg),
    onSuccess: (data) => {
      setShowSistema(false);
      setSistemaTitle('');
      setSistemaMsg('');
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      alert(`✅ Notificación enviada a ${data.notificaciones_creadas} usuarios`);
    },
  });

  if (isLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  );

  const noLeidas = alertas?.filter((a) => !a.esta_leida) || [];

  const alertasFiltradas = alertas?.filter((a) => {
    if (filtro === 'no_leidas') return !a.esta_leida;
    if (filtro === 'critica') return a.severidad === 'critica';
    if (filtro === 'alta') return a.severidad === 'alta' || a.severidad === 'critica';
    if (filtro === 'recordatorio') return a.tipoAlerta?.nombre?.toLowerCase().includes('recordatorio');
    if (filtro === 'sistema') return a.tipoAlerta?.nombre?.toLowerCase().includes('sistema');
    return true;
  }) || [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alertas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount?.count || 0} sin leer · {alertas?.length || 0} total
          </p>
        </div>
        <div className="flex gap-2">
          {noLeidas.length > 0 && (
            <button onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending}
              className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50">
              {markAllReadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              Marcar todas
            </button>
          )}
          {(isAdmin || isTecnico) && (
            <button onClick={() => remindersMutation.mutate()} disabled={remindersMutation.isPending}
              className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50">
              {remindersMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Evaluar recordatorios
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setShowSistema(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
              <Megaphone className="h-4 w-4" /> Notif. sistema
            </button>
          )}
        </div>
      </div>

      {/* Panel notificación sistema */}
      {showSistema && isAdmin && (
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold">Nueva notificación del sistema</h2>
          <p className="text-xs text-muted-foreground">Se enviará a todos los agricultores activos</p>
          <input
            value={sistemaTitle}
            onChange={(e) => setSistemaTitle(e.target.value)}
            placeholder="Título de la notificación"
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-blue-300"
          />
          <textarea
            value={sistemaMsg}
            onChange={(e) => setSistemaMsg(e.target.value)}
            placeholder="Mensaje..."
            rows={3}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-blue-300 resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowSistema(false)}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-accent">Cancelar</button>
            <button
              onClick={() => sistemaMutation.mutate()}
              disabled={sistemaMutation.isPending || !sistemaTitle.trim() || !sistemaMsg.trim()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {sistemaMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
              Enviar
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'todas',        label: `Todas (${alertas?.length || 0})` },
          { key: 'no_leidas',    label: `Sin leer (${noLeidas.length})` },
          { key: 'critica',      label: '🚨 Crítica' },
          { key: 'alta',         label: '🔴 Alta+' },
          { key: 'recordatorio', label: '🌾 Recordatorios' },
          { key: 'sistema',      label: '⚙️ Sistema' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFiltro(key as any)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filtro === key ? 'bg-emerald-600 text-white' : 'border hover:bg-accent'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {alertasFiltradas.length > 0 ? (
        <div className="space-y-2">
          {alertasFiltradas.map((a) => (
            <AlertaCard
              key={a.alerta_id}
              alerta={a}
              onRead={(id) => markReadMutation.mutate(id)}
              onUnread={(id) => markUnreadMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border bg-card text-sm text-muted-foreground shadow-sm">
          <Bell className="h-8 w-8 text-muted-foreground/30" />
          {filtro === 'todas' ? 'No tienes alertas' : 'No hay alertas con este filtro'}
        </div>
      )}
    </div>
  );
}