'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Cloud, Droplets, Thermometer, Wind, Loader2, Sun, RefreshCw, CalendarDays } from 'lucide-react';
import { weatherService, DatoClimaticoResponse } from '@/services/weather.service';
import { parcelasService } from '@/services/parcelas.service';
import { useAuthStore } from '@/store/auth-store';

const inputClass = 'h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200';

export default function WeatherPage() {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedParcela, setSelectedParcela] = useState('');
  const [showForecast, setShowForecast] = useState(false);

  const { data: parcelas } = useQuery({
    queryKey: ['parcelas-select'],
    queryFn: usuario?.rol === 'agricultor' ? parcelasService.getMyParcelas : parcelasService.getAll,
  });

  const { data: ultimo } = useQuery({
    queryKey: ['weather-ultimo', selectedParcela],
    queryFn: () => weatherService.getUltimo(selectedParcela),
    enabled: !!selectedParcela,
  });

  const { data: historial, isLoading } = useQuery({
    queryKey: ['weather-historial', selectedParcela],
    queryFn: () => weatherService.getByParcela(selectedParcela, 15),
    enabled: !!selectedParcela,
  });

  const { data: forecast } = useQuery({
    queryKey: ['weather-forecast', selectedParcela],
    queryFn: () => weatherService.fetchForecast(selectedParcela),
    enabled: !!selectedParcela && showForecast,
  });

  const hoy = new Date().toISOString().split('T')[0];
  const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: promedios } = useQuery({
    queryKey: ['weather-promedios', selectedParcela],
    queryFn: () => weatherService.getPromedios(selectedParcela, hace30, hoy),
    enabled: !!selectedParcela,
  });

  const fetchCurrentMutation = useMutation({
    mutationFn: () => weatherService.fetchCurrent(selectedParcela),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weather-ultimo', selectedParcela] });
      queryClient.invalidateQueries({ queryKey: ['weather-historial', selectedParcela] });
      queryClient.invalidateQueries({ queryKey: ['weather-promedios', selectedParcela] });
    },
  });

  const fetchForecastMutation = useMutation({
    mutationFn: () => weatherService.fetchForecast(selectedParcela),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weather-forecast', selectedParcela] });
      setShowForecast(true);
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clima</h1>
        <p className="mt-1 text-sm text-muted-foreground">Dashboard meteorológico por parcela</p>
      </div>

      {/* Selector de parcela */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <label className="mb-1.5 block text-sm font-medium">Selecciona una parcela</label>
        <select value={selectedParcela} onChange={(e) => { setSelectedParcela(e.target.value); setShowForecast(false); }} className={inputClass}>
          <option value="">-- Seleccionar parcela --</option>
          {parcelas?.map((p) => <option key={p.parcela_id} value={p.parcela_id}>{p.nombre} ({p.area_hectareas} ha)</option>)}
        </select>
      </div>

      {/* Botones OpenWeatherMap */}
      {selectedParcela && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fetchCurrentMutation.mutate()}
            disabled={fetchCurrentMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {fetchCurrentMutation.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Consultando...</>
              : <><RefreshCw className="h-4 w-4" /> Actualizar clima actual</>}
          </button>
          <button
            onClick={() => fetchForecastMutation.mutate()}
            disabled={fetchForecastMutation.isPending}
            className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            {fetchForecastMutation.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Consultando...</>
              : <><CalendarDays className="h-4 w-4" /> Pronóstico 5 días</>}
          </button>
        </div>
      )}

      {!selectedParcela ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border bg-card text-sm text-muted-foreground shadow-sm">
          <Cloud className="h-8 w-8 text-muted-foreground/30" />Selecciona una parcela
        </div>
      ) : isLoading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : (
        <>
          {/* Clima actual */}
          {ultimo && (
            <div>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                Último dato — {new Date(ultimo.fecha).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                <span className="ml-2 text-[11px] text-muted-foreground/70">{ultimo.fuente}</span>
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Thermometer className="h-3.5 w-3.5" /> Temperatura</div>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">{ultimo.temp_promedio ?? '--'}°C</p>
                  <p className="text-[11px] text-muted-foreground">Min {ultimo.temp_minima ?? '--'}° / Max {ultimo.temp_maxima ?? '--'}°</p>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Droplets className="h-3.5 w-3.5" /> Precipitación</div>
                  <p className="mt-1 text-2xl font-bold text-blue-600">{ultimo.precipitacion_mm ?? '--'} <span className="text-sm font-normal">mm</span></p>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Cloud className="h-3.5 w-3.5" /> Humedad</div>
                  <p className="mt-1 text-2xl font-bold text-cyan-600">{ultimo.humedad_pct ?? '--'}<span className="text-sm font-normal">%</span></p>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Wind className="h-3.5 w-3.5" /> Viento</div>
                  <p className="mt-1 text-2xl font-bold text-gray-600">{ultimo.velocidad_viento ?? '--'} <span className="text-sm font-normal">km/h</span></p>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Sun className="h-3.5 w-3.5" /> Índice UV</div>
                  <p className="mt-1 text-2xl font-bold text-yellow-600">{ultimo.indice_uv ?? '--'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Pronóstico 5 días */}
          {showForecast && forecast && forecast.length > 0 && (
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="border-b px-5 py-3"><h2 className="text-sm font-semibold">Pronóstico 5 días</h2></div>
              <div className="grid grid-cols-5 divide-x">
                {forecast.slice(0, 5).map((d) => (
                  <div key={d.dato_climatico_id} className="p-4 text-center">
                    <p className="text-xs font-medium text-muted-foreground">
                      {new Date(d.fecha).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="mt-2 text-lg font-bold text-emerald-600">{d.temp_promedio ?? '--'}°</p>
                    <p className="text-[11px] text-muted-foreground">{d.temp_minima ?? '--'}° / {d.temp_maxima ?? '--'}°</p>
                    <div className="mt-2 space-y-1">
                      {d.precipitacion_mm !== undefined && (
                        <p className="flex items-center justify-center gap-1 text-[11px] text-blue-600">
                          <Droplets className="h-3 w-3" />{d.precipitacion_mm} mm
                        </p>
                      )}
                      <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                        <Cloud className="h-3 w-3" />{d.cobertura_nubes_pct ?? '--'}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Promedios 30 días */}
          {promedios && promedios.dias_registrados > 0 && (
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold">Promedios últimos 30 días ({promedios.dias_registrados} registros)</h2>
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-xs text-muted-foreground">Temp. promedio</p><p className="text-lg font-bold">{promedios.temp_promedio}°C</p></div>
                <div><p className="text-xs text-muted-foreground">Precipitación total</p><p className="text-lg font-bold">{promedios.precipitacion_total} mm</p></div>
                <div><p className="text-xs text-muted-foreground">Humedad promedio</p><p className="text-lg font-bold">{promedios.humedad_promedio}%</p></div>
              </div>
            </div>
          )}

          {/* Historial */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b px-5 py-3"><h2 className="text-sm font-semibold">Historial reciente</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 text-left">Fecha</th>
                    <th className="px-4 py-2.5 text-right">T. Min</th>
                    <th className="px-4 py-2.5 text-right">T. Max</th>
                    <th className="px-4 py-2.5 text-right">T. Prom</th>
                    <th className="px-4 py-2.5 text-right">Lluvia</th>
                    <th className="px-4 py-2.5 text-right">Humedad</th>
                    <th className="px-4 py-2.5 text-right">UV</th>
                    <th className="px-4 py-2.5 text-right">Fuente</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {historial && historial.length > 0 ? historial.map((d) => (
                    <tr key={d.dato_climatico_id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5">{new Date(d.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</td>
                      <td className="px-4 py-2.5 text-right">{d.temp_minima ?? '--'}°</td>
                      <td className="px-4 py-2.5 text-right">{d.temp_maxima ?? '--'}°</td>
                      <td className="px-4 py-2.5 text-right font-medium">{d.temp_promedio ?? '--'}°</td>
                      <td className="px-4 py-2.5 text-right">{d.precipitacion_mm ?? '--'} mm</td>
                      <td className="px-4 py-2.5 text-right">{d.humedad_pct ?? '--'}%</td>
                      <td className="px-4 py-2.5 text-right">{d.indice_uv ?? '--'}</td>
                      <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{d.fuente}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No hay datos climáticos registrados. Presiona "Actualizar clima actual".</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}