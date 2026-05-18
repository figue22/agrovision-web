'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lightbulb, CheckCircle2, Clock, Loader2, Star } from 'lucide-react';
import { recommendationsService, RecomendacionResponse } from '@/services/recommendations.service';
import { useAuthStore } from '@/store/auth-store';
import { useState } from 'react';

const prioridadStyle: Record<string, { bg: string; text: string; label: string }> = {
  baja: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Baja' },
  media: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Media' },
  alta: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Alta' },
  urgente: { bg: 'bg-red-50', text: 'text-red-700', label: 'Urgente' },
};

const estadoStyle: Record<string, { icon: typeof Clock; label: string; color: string }> = {
  pendiente: { icon: Clock, label: 'Pendiente', color: 'text-yellow-600' },
  en_progreso: { icon: Loader2, label: 'En progreso', color: 'text-blue-600' },
  completada: { icon: CheckCircle2, label: 'Completada', color: 'text-green-600' },
  descartada: { icon: Clock, label: 'Descartada', color: 'text-gray-400' },
};

export default function RecommendationsPage() {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(0);

  const { data: pendientes, isLoading } = useQuery({
    queryKey: ['recomendaciones-pendientes'],
    queryFn: recommendationsService.getPendientes,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => recommendationsService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recomendaciones-pendientes'] }); setFeedbackId(null); setFeedbackText(''); setRating(0); },
  });

  const markCompleted = (id: string) => {
    updateMutation.mutate({ id, data: { estado_implementacion: 'completada', fecha_implementacion: new Date().toISOString() } });
  };

  const submitFeedback = (id: string) => {
    updateMutation.mutate({
      id,
      data: {
        estado_implementacion: 'completada',
        fecha_implementacion: new Date().toISOString(),
        feedback_agricultor: feedbackText || undefined,
        calificacion_eficacia: rating > 0 ? rating : undefined,
      },
    });
  };

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Recomendaciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">{pendientes?.length || 0} recomendaciones pendientes</p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="divide-y">
          {pendientes && pendientes.length > 0 ? pendientes.map((rec) => {
            const prio = prioridadStyle[rec.prioridad] || prioridadStyle.media;
            const est = estadoStyle[rec.estado_implementacion] || estadoStyle.pendiente;
            const EstIcon = est.icon;

            return (
              <div key={rec.recomendacion_id} className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-amber-50 p-2 text-amber-600"><Lightbulb className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm font-medium">{rec.titulo}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{rec.descripcion}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${prio.bg} ${prio.text}`}>{prio.label}</span>
                        <span className={`flex items-center gap-1 text-[11px] ${est.color}`}><EstIcon className="h-3 w-3" />{est.label}</span>
                        {rec.tipoRecomendacion?.nombre && <span className="text-[11px] text-muted-foreground">{rec.tipoRecomendacion.nombre}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rec.estado_implementacion === 'pendiente' && (
                      <>
                        <button onClick={() => setFeedbackId(feedbackId === rec.recomendacion_id ? null : rec.recomendacion_id)} className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent">Feedback</button>
                        <button onClick={() => markCompleted(rec.recomendacion_id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">Completar</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Feedback form */}
                {feedbackId === rec.recomendacion_id && (
                  <div className="mt-3 ml-11 space-y-3 rounded-lg border bg-muted/20 p-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium">Calificación</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} onClick={() => setRating(s)} className={`p-0.5 ${s <= rating ? 'text-yellow-500' : 'text-gray-300'}`}><Star className="h-5 w-5" fill={s <= rating ? 'currentColor' : 'none'} /></button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Comentario</label>
                      <input value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none" placeholder="¿Cómo funcionó esta recomendación?" />
                    </div>
                    <button onClick={() => submitFeedback(rec.recomendacion_id)} disabled={updateMutation.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700">
                      Enviar feedback y completar
                    </button>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground"><Lightbulb className="h-8 w-8 text-muted-foreground/30" />No hay recomendaciones pendientes</div>
          )}
        </div>
      </div>
    </div>
  );
}