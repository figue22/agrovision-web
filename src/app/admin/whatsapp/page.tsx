'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageCircle, Send, Pause, Play, Users,
  Phone, Loader2, ChevronDown, ChevronUp, Clock,
} from 'lucide-react';
import { api } from '@/services/api';

interface SesionWA {
  sesion_wa_id: string;
  wa_id: string;
  nombre_mostrado?: string;
  estado_registro: string;
  bot_pausado: boolean;
  esta_bloqueado: boolean;
  mensajes_enviados: number;
  mensajes_recibidos: number;
  ultima_interaccion: string;
  usuario?: { nombre: string; apellido: string; correo: string };
}

const inputClass = 'h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200';

export default function WhatsappAdminPage() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mensajeManual, setMensajeManual] = useState<Record<string, string>>({});
  const [historialWaId, setHistorialWaId] = useState<string | null>(null);

  const { data: sesiones, isLoading } = useQuery({
    queryKey: ['whatsapp-sesiones'],
    queryFn: async () => {
      const r = await api.get<SesionWA[]>('/whatsapp');
      return r.data;
    },
  });

  const { data: resumen } = useQuery({
    queryKey: ['whatsapp-resumen'],
    queryFn: async () => {
      const r = await api.get('/whatsapp/resumen');
      return r.data;
    },
  });

  const { data: historial } = useQuery({
    queryKey: ['whatsapp-historial', historialWaId],
    queryFn: async () => {
      const r = await api.get(`/whatsapp/historial/${historialWaId}`);
      return r.data;
    },
    enabled: !!historialWaId,
  });

  const enviarMutation = useMutation({
    mutationFn: ({ waId, mensaje }: { waId: string; mensaje: string }) =>
      api.post(`/whatsapp/enviar/${waId}`, { mensaje }),
    onSuccess: (_, vars) => {
      setMensajeManual((prev) => ({ ...prev, [vars.waId]: '' }));
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sesiones'] });
    },
  });

  const pausarMutation = useMutation({
    mutationFn: ({ waId, minutos }: { waId: string; minutos?: number }) =>
      api.post(`/whatsapp/pausar/${waId}`, { minutos }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp-sesiones'] }),
  });

  const reanudarMutation = useMutation({
    mutationFn: (waId: string) => api.post(`/whatsapp/reanudar/${waId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp-sesiones'] }),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gestión WhatsApp</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Intervención manual en conversaciones activas
        </p>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total sesiones', value: resumen.total, color: 'text-gray-700' },
            { label: 'Registrados', value: resumen.registrados, color: 'text-green-700' },
            { label: 'Activos 24h', value: resumen.activos_24h, color: 'text-blue-700' },
            { label: 'Bloqueados', value: resumen.bloqueados, color: 'text-red-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border bg-card p-4 shadow-sm text-center">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Lista de sesiones */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" /> Sesiones WhatsApp ({sesiones?.length || 0})
          </h2>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : sesiones && sesiones.length > 0 ? (
          <div className="divide-y">
            {sesiones.map((s) => (
              <div key={s.sesion_wa_id}>
                <div
                  className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === s.sesion_wa_id ? null : s.sesion_wa_id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${s.bot_pausado ? 'bg-yellow-400' : s.esta_bloqueado ? 'bg-red-500' : 'bg-green-500'}`} />
                    <div>
                      <p className="text-sm font-medium">
                        {s.nombre_mostrado || s.wa_id}
                        {s.usuario && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            — {s.usuario.nombre} {s.usuario.apellido}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Phone className="h-3 w-3" />{s.wa_id}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(s.ultima_interaccion).toLocaleString('es-CO')}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          ↑{s.mensajes_enviados} ↓{s.mensajes_recibidos}
                        </span>
                        {s.bot_pausado && (
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] text-yellow-700">Bot pausado</span>
                        )}
                        {s.esta_bloqueado && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] text-red-700">Bloqueado</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {s.bot_pausado ? (
                        <button onClick={() => reanudarMutation.mutate(s.wa_id)}
                            className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs text-green-600 hover:bg-green-50">
                            <Play className="h-3.5 w-3.5" /> Reanudar
                        </button>
                    ) : (
                        <button onClick={() => pausarMutation.mutate({ waId: s.wa_id, minutos: 30 })}
                            className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs text-yellow-600 hover:bg-yellow-50">
                            <Pause className="h-3.5 w-3.5" /> Pausar 30min
                        </button>
                    )}
                    <button
                        onClick={() => setHistorialWaId(historialWaId === s.wa_id ? null : s.wa_id)}
                        className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs hover:bg-accent">
                        <MessageCircle className="h-3.5 w-3.5" /> Historial
                    </button>
                    <button
                        onClick={() => setExpandedId(expandedId === s.sesion_wa_id ? null : s.sesion_wa_id)}
                        className="rounded-lg border p-1.5 hover:bg-accent">
                        {expandedId === s.sesion_wa_id
                            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                {/* Historial */}
                {historialWaId === s.wa_id && historial && (
                  <div className="border-t bg-muted/10 px-5 py-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Historial de conversación</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {historial.length > 0 ? historial.map((msg: any, i: number) => (
                        <div key={i} className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${msg.rol === 'usuario' ? 'bg-emerald-100 text-emerald-900' : 'bg-white border'}`}>
                            <p>{msg.contenido}</p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              {new Date(msg.timestamp).toLocaleTimeString('es-CO')}
                            </p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-xs text-muted-foreground">Sin historial disponible</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Enviar mensaje manual */}
                {expandedId === s.sesion_wa_id && (
                  <div className="border-t bg-muted/10 px-5 py-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Enviar mensaje manual</p>
                    <div className="flex gap-2">
                      <input
                        value={mensajeManual[s.wa_id] || ''}
                        onChange={(e) => setMensajeManual((prev) => ({ ...prev, [s.wa_id]: e.target.value }))}
                        placeholder="Escribe un mensaje para enviar directamente..."
                        className={inputClass}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && mensajeManual[s.wa_id]?.trim()) {
                            enviarMutation.mutate({ waId: s.wa_id, mensaje: mensajeManual[s.wa_id] });
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (mensajeManual[s.wa_id]?.trim()) {
                            enviarMutation.mutate({ waId: s.wa_id, mensaje: mensajeManual[s.wa_id] });
                          }
                        }}
                        disabled={!mensajeManual[s.wa_id]?.trim() || enviarMutation.isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            <MessageCircle className="mr-2 h-5 w-5 text-muted-foreground/30" />
            No hay sesiones WhatsApp registradas
          </div>
        )}
      </div>
    </div>
  );
}