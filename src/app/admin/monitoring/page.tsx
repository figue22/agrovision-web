'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { RefreshCw, Play, RotateCcw, Clock, CheckCircle2, XCircle, Loader2, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

interface JobStats {
  counts: { waiting: number; active: number; completed: number; failed: number; delayed: number };
  active: { id: string | number; nombre: string; progreso: number; iniciado_en: string }[];
  completados: { id: string | number; nombre: string; resultado: { actualizadas: number; errores: number; duracion_ms: number }; completado_en: string }[];
  fallidos: { id: string | number; nombre: string; error: string; intentos: number; fallido_en: string }[];
  proxima_ejecucion: string;
}

const PAGE_SIZE = 5;

export default function AdminMonitoringPage() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [completadosPage, setCompletadosPage] = useState(0);
  const [fallidosPage, setFallidosPage] = useState(0);
  const [activosPage, setActivosPage] = useState(0);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['weather-job-stats', completadosPage, fallidosPage, activosPage],
    queryFn: async (): Promise<JobStats> => {
      const res = await api.get('/weather/jobs/stats', {
        params: { completadosPage, fallidosPage, activosPage, pageSize: PAGE_SIZE },
      });
      return res.data;
    },
    refetchInterval: 5000,
    staleTime: 0,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['weather-job-stats'] });
    await queryClient.refetchQueries({ queryKey: ['weather-job-stats'] });
    setIsRefreshing(false);
  };

  const triggerMutation = useMutation({
    mutationFn: () => api.post('/weather/jobs/trigger'),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['weather-job-stats'] });
      setTimeout(() => queryClient.refetchQueries({ queryKey: ['weather-job-stats'] }), 1000);
      setTimeout(() => queryClient.refetchQueries({ queryKey: ['weather-job-stats'] }), 3000);
      setTimeout(() => queryClient.refetchQueries({ queryKey: ['weather-job-stats'] }), 6000);
      setTimeout(() => queryClient.refetchQueries({ queryKey: ['weather-job-stats'] }), 10000);
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => api.post('/weather/jobs/retry-failed'),
    onSuccess: () => queryClient.refetchQueries({ queryKey: ['weather-job-stats'] }),
  });

  const formatDuracion = (ms: number) => ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const totalCompletadosPags = Math.ceil((stats?.counts.completed || 0) / PAGE_SIZE);
  const totalFallidosPags = Math.ceil((stats?.counts.failed || 0) / PAGE_SIZE);
  const totalActivosPags = Math.ceil((stats?.counts.active || 0) / PAGE_SIZE);

  const Paginador = ({ page, setPage, total }: { page: number; setPage: (p: number) => void; total: number }) => (
    <div className="flex items-center gap-1 border-t px-5 py-2.5">
      <p className="text-xs text-muted-foreground mr-auto">Página {page + 1} de {Math.max(total, 1)}</p>
      <button onClick={() => setPage(page - 1)} disabled={page === 0}
        className="rounded-lg border p-1.5 hover:bg-accent disabled:opacity-40">
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => setPage(page + 1)} disabled={page >= total - 1}
        className="rounded-lg border p-1.5 hover:bg-accent disabled:opacity-40">
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  if (isLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monitoreo</h1>
          <p className="mt-1 text-sm text-muted-foreground">Estado del job de recolección automática de clima · auto-refresh cada 5s</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} disabled={isRefreshing}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Actualizar
          </button>
          <button onClick={() => triggerMutation.mutate()} disabled={triggerMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {triggerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Ejecutar ahora
          </button>
        </div>
      </div>

      {stats && (
        <>
          {/* Contadores */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {[
              { label: 'En espera', value: stats.counts.waiting, color: 'text-yellow-600' },
              { label: 'Activos', value: stats.counts.active, color: 'text-blue-600' },
              { label: 'Completados', value: stats.counts.completed, color: 'text-emerald-600' },
              { label: 'Fallidos', value: stats.counts.failed, color: 'text-red-600' },
              { label: 'Retrasados', value: stats.counts.delayed, color: 'text-gray-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border bg-card p-4 shadow-sm text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Próxima ejecución */}
          <div className="flex items-center gap-2 rounded-xl border bg-card px-5 py-3 shadow-sm">
            <Clock className="h-4 w-4 text-emerald-600" />
            <span className="text-sm">Próxima ejecución automática:</span>
            <span className="text-sm font-medium">{formatFecha(stats.proxima_ejecucion)}</span>
            <span className="ml-auto text-xs text-muted-foreground">Cron: 0 */6 * * * (cada 6 horas)</span>
          </div>

          {/* Jobs activos */}
          {stats.counts.active > 0 && (
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="border-b px-5 py-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
                <h2 className="text-sm font-semibold">Jobs en ejecución ({stats.counts.active})</h2>
              </div>
              <div className="divide-y">
                {stats.active.map((j) => (
                  <div key={j.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{j.nombre} <span className="text-xs text-muted-foreground">#{j.id}</span></p>
                      <p className="text-xs text-muted-foreground">Iniciado: {formatFecha(j.iniciado_en)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 rounded-full bg-muted h-2">
                        <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${j.progreso}%` }} />
                      </div>
                      <span className="text-sm font-medium">{j.progreso}%</span>
                    </div>
                  </div>
                ))}
              </div>
              {totalActivosPags > 1 && <Paginador page={activosPage} setPage={setActivosPage} total={totalActivosPags} />}
            </div>
          )}

          {/* Jobs completados */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b px-5 py-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-semibold">Completados ({stats.counts.completed})</h2>
            </div>
            {stats.completados.length > 0 ? (
              <>
                <div className="divide-y">
                  {stats.completados.map((j) => (
                    <div key={j.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium">{j.nombre} <span className="text-xs text-muted-foreground">#{j.id}</span></p>
                        <p className="text-xs text-muted-foreground">{formatFecha(j.completado_en)}</p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="text-emerald-600 font-medium">{j.resultado?.actualizadas ?? '--'} actualizadas</p>
                        {j.resultado?.errores > 0 && <p className="text-red-500">{j.resultado.errores} errores</p>}
                        <p className="text-muted-foreground">{j.resultado?.duracion_ms ? formatDuracion(j.resultado.duracion_ms) : '--'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {totalCompletadosPags > 1 && <Paginador page={completadosPage} setPage={setCompletadosPage} total={totalCompletadosPags} />}
              </>
            ) : (
              <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                No hay jobs completados aún
              </div>
            )}
          </div>

          {/* Jobs fallidos */}
          {stats.counts.failed > 0 && (
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="border-b px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <h2 className="text-sm font-semibold">Fallidos ({stats.counts.failed})</h2>
                </div>
                <button onClick={() => retryMutation.mutate()} disabled={retryMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                  <RotateCcw className="h-3.5 w-3.5" /> Reintentar todos
                </button>
              </div>
              <div className="divide-y">
                {stats.fallidos.map((j) => (
                  <div key={j.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{j.nombre} <span className="text-xs text-muted-foreground">#{j.id}</span></p>
                      <span className="text-xs text-muted-foreground">{j.intentos} intentos · {formatFecha(j.fallido_en)}</span>
                    </div>
                    <p className="mt-1 text-xs text-red-600 font-mono">{j.error}</p>
                  </div>
                ))}
              </div>
              {totalFallidosPags > 1 && <Paginador page={fallidosPage} setPage={setFallidosPage} total={totalFallidosPags} />}
            </div>
          )}
        </>
      )}
    </div>
  );
}