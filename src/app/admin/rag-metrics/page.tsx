'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Loader2, Star, MessageCircle, FileText,
  TrendingUp, Clock, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { ragService } from '@/services/rag.service';

export default function RagMetricsPage() {
  const { data: metricas, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['rag-metricas'],
    queryFn: ragService.getMetricas,
    refetchInterval: 30000,
  });

  if (isLoading) return (
    <div className="flex h-60 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  );

  const ratingsData = [
    { label: '1 ⭐', value: metricas?.rating_1 || 0, color: '#ef4444' },
    { label: '2 ⭐', value: metricas?.rating_2 || 0, color: '#f97316' },
    { label: '3 ⭐', value: metricas?.rating_3 || 0, color: '#f59e0b' },
    { label: '4 ⭐', value: metricas?.rating_4 || 0, color: '#84cc16' },
    { label: '5 ⭐', value: metricas?.rating_5 || 0, color: '#10b981' },
  ];

  const satisfaccion = metricas?.satisfaccion_promedio || 0;
  const satisfaccionColor = satisfaccion >= 4
    ? 'text-green-600'
    : satisfaccion >= 3
      ? 'text-yellow-600'
      : 'text-red-600';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Métricas de Calidad RAG</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitoreo del sistema de consultas agrícolas
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageCircle className="h-3.5 w-3.5" /> Total consultas
          </div>
          <p className="mt-1 text-3xl font-bold text-emerald-600">
            {metricas?.total_consultas || 0}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5" /> Satisfacción promedio
          </div>
          <p className={`mt-1 text-3xl font-bold ${satisfaccionColor}`}>
            {satisfaccion.toFixed(1)}
            <span className="text-sm font-normal text-muted-foreground">/5</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {metricas?.consultas_con_feedback || 0} con feedback
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" /> Relevancia promedio
          </div>
          <p className="mt-1 text-3xl font-bold text-blue-600">
            {metricas?.relevancia_promedio_pct?.toFixed(1) || '0'}
            <span className="text-sm font-normal text-muted-foreground">%</span>
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Latencia promedio
          </div>
          <p className="mt-1 text-3xl font-bold text-purple-600">
            {((metricas?.tiempo_respuesta_promedio_ms || 0) / 1000).toFixed(1)}
            <span className="text-sm font-normal text-muted-foreground">s</span>
          </p>
        </div>
      </div>

      {/* Distribución de ratings */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold">Distribución de calificaciones</h2>
        {metricas?.consultas_con_feedback ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ratingsData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v: number) => [v, 'respuestas']}
              />
              <Bar dataKey="value" name="Respuestas" radius={[4, 4, 0, 0]}>
                {ratingsData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            <Star className="mr-2 h-5 w-5 text-muted-foreground/30" />
            Aún no hay calificaciones registradas
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Consultas frecuentes */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">Consultas más frecuentes</h2>
          {metricas?.consultas_frecuentes && metricas.consultas_frecuentes.length > 0 ? (
            <div className="space-y-2">
              {metricas.consultas_frecuentes.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                  <p className="mr-2 flex-1 truncate text-xs">{c.pregunta}</p>
                  <span className="flex-shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    {c.veces}x
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
              <MessageCircle className="mr-2 h-4 w-4 text-muted-foreground/30" />
              Sin consultas aún
            </div>
          )}
        </div>

        {/* Documentos más citados */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">Documentos más citados</h2>
          {metricas?.documentos_mas_citados && metricas.documentos_mas_citados.length > 0 ? (
            <div className="space-y-2">
              {metricas.documentos_mas_citados.map((d, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                  <div className="mr-2 flex min-w-0 flex-1 items-center gap-2">
                    <FileText className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                    <p className="truncate text-xs">{d.documento_id}</p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                    {d.veces_citado}x
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
              <FileText className="mr-2 h-4 w-4 text-muted-foreground/30" />
              Sin documentos citados aún
            </div>
          )}
        </div>
      </div>

      {/* Nota de actualización */}
      <p className="text-center text-[11px] text-muted-foreground">
        Se actualiza automáticamente cada 30 segundos
      </p>
    </div>
  );
}