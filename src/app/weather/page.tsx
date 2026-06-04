'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Cloud, Droplets, Thermometer, Wind, Loader2, Sun, RefreshCw,
  CalendarDays, Gauge, Database, BarChart2, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { weatherService } from '@/services/weather.service';
import { parcelasService } from '@/services/parcelas.service';
import { useAuthStore } from '@/store/auth-store';

const inputClass = 'h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200';
const ITEMS_PER_PAGE = 10;

const formatFecha = (fecha: string, options: Intl.DateTimeFormatOptions) => {
  const [year, month, day] = fecha.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', options);
};

export default function WeatherPage() {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedParcela, setSelectedParcela] = useState('');
  const [showForecast, setShowForecast] = useState(false);
  const [historialPage, setHistorialPage] = useState(1);
  const [ideamDesde, setIdeamDesde] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [ideamHasta, setIdeamHasta] = useState(() => new Date().toISOString().split('T')[0]);
  const [ideamResult, setIdeamResult] = useState<{ guardados: number; estacion: string; distancia_km: number } | null>(null);

  // Estados para gráficos históricos
  const [showGraficos, setShowGraficos] = useState(false);
  const [graficoDesde, setGraficoDesde] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  });
  const [graficoHasta, setGraficoHasta] = useState(() => new Date().toISOString().split('T')[0]);

  const hoy = new Date().toISOString().split('T')[0];
  const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
    queryFn: () => weatherService.getByParcela(selectedParcela, 100),
    enabled: !!selectedParcela,
  });

  const { data: forecast } = useQuery({
    queryKey: ['weather-forecast', selectedParcela],
    queryFn: () => weatherService.fetchForecast(selectedParcela),
    enabled: !!selectedParcela,
  });

  const { data: promedios } = useQuery({
    queryKey: ['weather-promedios', selectedParcela],
    queryFn: () => weatherService.getPromedios(selectedParcela, hace30, hoy),
    enabled: !!selectedParcela,
  });

  const { data: historialGraficos, isLoading: loadingGraficos } = useQuery({
    queryKey: ['weather-graficos', selectedParcela, graficoDesde, graficoHasta],
    queryFn: () => weatherService.getByDateRange(selectedParcela, graficoDesde, graficoHasta),
    enabled: !!selectedParcela && showGraficos,
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

  const fetchIdeamMutation = useMutation({
    mutationFn: () => weatherService.fetchIdeam(selectedParcela, ideamDesde, ideamHasta),
    onSuccess: (data) => {
      setIdeamResult(data);
      setHistorialPage(1);
      queryClient.invalidateQueries({ queryKey: ['weather-historial', selectedParcela] });
      queryClient.invalidateQueries({ queryKey: ['weather-promedios', selectedParcela] });
    },
  });

  const totalPages = Math.ceil((historial?.length || 0) / ITEMS_PER_PAGE);
  const historialPaginado = historial?.slice(
    (historialPage - 1) * ITEMS_PER_PAGE,
    historialPage * ITEMS_PER_PAGE,
  );

  // Datos para gráficas: histórico real + pronóstico punteado
  const datosHistorico = historial
    ?.filter((d) => d.fuente !== 'openweathermap_forecast')
    .slice()
    .reverse()
    .map((d) => ({
      fecha: formatFecha(d.fecha, { day: 'numeric', month: 'short' }),
      temp_max: d.temp_maxima != null ? Number(d.temp_maxima) : undefined,
      temp_min: d.temp_minima != null ? Number(d.temp_minima) : undefined,
      temp_prom: d.temp_promedio != null ? Number(d.temp_promedio) : undefined,
      lluvia: d.precipitacion_mm != null ? Number(d.precipitacion_mm) : 0,
      humedad: d.humedad_pct != null ? Number(d.humedad_pct) : undefined,
    })) || [];

  const datosPronostico = forecast
    ?.slice(0, 5)
    .map((d) => ({
      fecha: formatFecha(d.fecha, { day: 'numeric', month: 'short' }),
      temp_max_pred: d.temp_maxima ? Number(d.temp_maxima) : null,
      temp_min_pred: d.temp_minima ? Number(d.temp_minima) : null,
      temp_prom_pred: d.temp_promedio ? Number(d.temp_promedio) : null,
      lluvia_pred: d.precipitacion_mm ? Number(d.precipitacion_mm) : 0,
    })) || [];

  const datosGrafico = [...datosHistorico, ...datosPronostico];

  // ── Agrupación mensual para gráficos históricos HU-036 ──
  const agruparPorMes = (datos: typeof historialGraficos) => {
    if (!datos) return [];
    const meses: Record<string, { temps: number[]; precip: number[]; hums: number[]; label: string }> = {};
    for (const d of datos) {
      if (d.fuente === 'openweathermap_forecast') continue;
      const fecha = d.fecha.split('T')[0];
      const [year, month] = fecha.split('-');
      const key = `${year}-${month}`;
      const label = new Date(Number(year), Number(month) - 1, 1)
        .toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
      if (!meses[key]) meses[key] = { temps: [], precip: [], hums: [], label };
      if (d.temp_promedio) meses[key].temps.push(Number(d.temp_promedio));
      if (d.precipitacion_mm) meses[key].precip.push(Number(d.precipitacion_mm));
      if (d.humedad_pct) meses[key].hums.push(Number(d.humedad_pct));
    }
    return Object.entries(meses)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({
        mes: v.label,
        temp_prom: v.temps.length
          ? Math.round(v.temps.reduce((s, t) => s + t, 0) / v.temps.length * 10) / 10 : null,
        precip_acum: v.precip.length
          ? Math.round(v.precip.reduce((s, p) => s + p, 0) * 10) / 10 : 0,
        humedad_prom: v.hums.length
          ? Math.round(v.hums.reduce((s, h) => s + h, 0) / v.hums.length * 10) / 10 : null,
      }));
  };

  const agruparPorMesAnio = (datos: typeof historialGraficos, anio: number) => {
    if (!datos) return [];
    const meses: Record<string, number[]> = {};
    for (const d of datos) {
      if (d.fuente === 'openweathermap_forecast') continue;
      const fecha = d.fecha.split('T')[0];
      const [year, month] = fecha.split('-');
      if (Number(year) !== anio) continue;
      if (!meses[month]) meses[month] = [];
      if (d.temp_promedio) meses[month].push(Number(d.temp_promedio));
    }
    return Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0');
      const label = new Date(anio, i, 1).toLocaleDateString('es-CO', { month: 'short' });
      const temps = meses[m] || [];
      return {
        mes: label,
        temp: temps.length
          ? Math.round(temps.reduce((s, t) => s + t, 0) / temps.length * 10) / 10 : null,
      };
    });
  };

  const datosAgrupados = agruparPorMes(historialGraficos);
  const anioActual = new Date().getFullYear();
  const datosAnioActual = agruparPorMesAnio(historialGraficos, anioActual);
  const datosAnioAnterior = agruparPorMesAnio(historialGraficos, anioActual - 1);
  const datosComparacion = datosAnioActual.map((d, i) => ({
    mes: d.mes,
    [`${anioActual}`]: d.temp,
    [`${anioActual - 1}`]: datosAnioAnterior[i]?.temp,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clima</h1>
        <p className="mt-1 text-sm text-muted-foreground">Dashboard meteorológico por parcela</p>
      </div>

      {/* Selector de parcela */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <label className="mb-1.5 block text-sm font-medium">Selecciona una parcela</label>
        <select
          value={selectedParcela}
          onChange={(e) => {
            setSelectedParcela(e.target.value);
            setShowForecast(false);
            setIdeamResult(null);
            setHistorialPage(1);
            setShowGraficos(false);
          }}
          className={inputClass}
        >
          <option value="">-- Seleccionar parcela --</option>
          {parcelas?.map((p) => (
            <option key={p.parcela_id} value={p.parcela_id}>{p.nombre} ({p.area_hectareas} ha)</option>
          ))}
        </select>
      </div>

      {/* Botones y panel IDEAM */}
      {selectedParcela && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => fetchCurrentMutation.mutate()} disabled={fetchCurrentMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {fetchCurrentMutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Consultando...</>
                : <><RefreshCw className="h-4 w-4" /> Actualizar clima actual</>}
            </button>
            <button onClick={() => fetchForecastMutation.mutate()} disabled={fetchForecastMutation.isPending}
              className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50">
              {fetchForecastMutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Consultando...</>
                : <><CalendarDays className="h-4 w-4" /> Pronóstico 5 días</>}
            </button>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Datos históricos IDEAM</span>
              <span className="text-xs text-muted-foreground">(estación meteorológica más cercana)</span>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Desde</label>
                <input type="date" value={ideamDesde} max={ideamHasta}
                  onChange={(e) => { setIdeamDesde(e.target.value); setIdeamResult(null); }}
                  className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:border-blue-300" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Hasta</label>
                <input type="date" value={ideamHasta} min={ideamDesde} max={hoy}
                  onChange={(e) => { setIdeamHasta(e.target.value); setIdeamResult(null); }}
                  className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:border-blue-300" />
              </div>
              <button
                onClick={() => { setIdeamResult(null); fetchIdeamMutation.mutate(); }}
                disabled={fetchIdeamMutation.isPending || !ideamDesde || !ideamHasta}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {fetchIdeamMutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Consultando IDEAM...</>
                  : <><Database className="h-4 w-4" /> Cargar datos</>}
              </button>
            </div>
            {ideamResult && (
              <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-sm font-medium text-blue-800">✅ {ideamResult.guardados} registros guardados en el historial</p>
                <p className="mt-0.5 text-xs text-blue-600">Estación: {ideamResult.estacion} · {ideamResult.distancia_km} km de distancia</p>
              </div>
            )}
            {fetchIdeamMutation.isError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                Error al consultar IDEAM. Verifica que la parcela tenga coordenadas válidas.
              </div>
            )}
          </div>
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
                Último dato — {formatFecha(ultimo.fecha, { weekday: 'long', day: 'numeric', month: 'long' })}
                <span className="ml-2 text-[11px] text-muted-foreground/70">{ultimo.fuente}</span>
              </h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Thermometer className="h-3.5 w-3.5" /> Temperatura</div>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">{ultimo.temp_promedio ?? '--'}°C</p>
                  <p className="text-[11px] text-muted-foreground">Min {ultimo.temp_minima ?? '--'}° / Max {ultimo.temp_maxima ?? '--'}°</p>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Droplets className="h-3.5 w-3.5" /> Humedad</div>
                  <p className="mt-1 text-2xl font-bold text-cyan-600">{ultimo.humedad_pct ?? '--'}<span className="text-sm font-normal">%</span></p>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Droplets className="h-3.5 w-3.5 text-blue-400" /> Precipitación</div>
                  <p className="mt-1 text-2xl font-bold text-blue-600">{ultimo.precipitacion_mm ?? '0'} <span className="text-sm font-normal">mm</span></p>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Wind className="h-3.5 w-3.5" /> Viento</div>
                  <p className="mt-1 text-2xl font-bold text-gray-600">{ultimo.velocidad_viento ?? '--'} <span className="text-sm font-normal">km/h</span></p>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Cloud className="h-3.5 w-3.5" /> Nubosidad</div>
                  <p className="mt-1 text-2xl font-bold text-slate-600">{ultimo.cobertura_nubes_pct ?? '--'}<span className="text-sm font-normal">%</span></p>
                </div>
                {ultimo.presion_atm && (
                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Gauge className="h-3.5 w-3.5" /> Presión</div>
                    <p className="mt-1 text-2xl font-bold text-purple-600">{ultimo.presion_atm} <span className="text-sm font-normal">hPa</span></p>
                  </div>
                )}
                {ultimo.indice_uv !== null && ultimo.indice_uv !== undefined && (
                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Sun className="h-3.5 w-3.5" /> Índice UV</div>
                    <p className="mt-1 text-2xl font-bold text-yellow-600">{ultimo.indice_uv}</p>
                  </div>
                )}
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
                      {formatFecha(d.fecha, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="mt-2 text-lg font-bold text-emerald-600">{d.temp_promedio ?? '--'}°</p>
                    <p className="text-[11px] text-muted-foreground">{d.temp_minima ?? '--'}° / {d.temp_maxima ?? '--'}°</p>
                    <div className="mt-2 space-y-1">
                      <p className="flex items-center justify-center gap-1 text-[11px] text-blue-600">
                        <Droplets className="h-3 w-3" />{d.precipitacion_mm ?? '0'} mm
                      </p>
                      <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                        <Cloud className="h-3 w-3" />{d.cobertura_nubes_pct ?? '--'}%
                      </p>
                      {(d.datos_crudos as any)?.prob_lluvia_pct !== undefined && (
                        <p className="flex items-center justify-center gap-1 text-[11px] text-indigo-500">
                          <Droplets className="h-3 w-3" />{(d.datos_crudos as any).prob_lluvia_pct}% prob.
                        </p>
                      )}
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

          {/* Gráficos históricos recientes */}
          {datosGrafico.length >= 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Gráficos recientes</h2>
                {datosPronostico.length > 0 && (
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-emerald-600" /> Histórico real</span>
                    <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-emerald-600" /> Pronóstico</span>
                  </div>
                )}
              </div>

              {/* Temperatura */}
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="mb-4 text-xs font-medium text-muted-foreground">Temperatura (°C)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={datosGrafico} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(value: number) => [`${value}°C`]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="temp_max" name="Máx" stroke="#ef4444" dot={datosGrafico.length < 5} strokeWidth={1.5} connectNulls />
                    <Line type="monotone" dataKey="temp_prom" name="Prom" stroke="#10b981" dot={datosGrafico.length < 5} strokeWidth={2} connectNulls />
                    <Line type="monotone" dataKey="temp_min" name="Mín" stroke="#3b82f6" dot={datosGrafico.length < 5} strokeWidth={1.5} connectNulls />
                    <Line type="monotone" dataKey="temp_max_pred" name="Máx (pred)" stroke="#ef4444" dot={false} strokeWidth={1.5} strokeDasharray="5 5" connectNulls />
                    <Line type="monotone" dataKey="temp_prom_pred" name="Prom (pred)" stroke="#10b981" dot={false} strokeWidth={2} strokeDasharray="5 5" connectNulls />
                    <Line type="monotone" dataKey="temp_min_pred" name="Mín (pred)" stroke="#3b82f6" dot={false} strokeWidth={1.5} strokeDasharray="5 5" connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Precipitación */}
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="mb-4 text-xs font-medium text-muted-foreground">Precipitación (mm)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={datosGrafico} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(value: number) => [`${value} mm`]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="lluvia" name="Lluvia real" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="lluvia_pred" name="Lluvia (pred)" fill="#3b82f6" opacity={0.4} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Humedad */}
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="mb-4 text-xs font-medium text-muted-foreground">Humedad (%)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={datosGrafico} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(value: number) => [`${value}%`]} />
                    <Line type="monotone" dataKey="humedad" name="Humedad" stroke="#06b6d4" dot={datosGrafico.length < 5} strokeWidth={2} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── HU-036: Gráficos históricos de tendencias ── */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <button
              onClick={() => setShowGraficos((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-muted/20"
            >
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold">Gráficos históricos de tendencias</span>
              </div>
              {showGraficos ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {showGraficos && (
              <div className="border-t p-5 space-y-6">
                {/* Selector de rango */}
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Desde</label>
                    <input type="date" value={graficoDesde} max={graficoHasta}
                      onChange={(e) => setGraficoDesde(e.target.value)}
                      className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Hasta</label>
                    <input type="date" value={graficoHasta} min={graficoDesde}
                      onChange={(e) => setGraficoHasta(e.target.value)}
                      className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300" />
                  </div>
                </div>

                {loadingGraficos ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : datosAgrupados.length > 0 ? (
                  <>
                    {/* Temperatura promedio mensual */}
                    <div>
                      <p className="mb-3 text-xs font-medium text-muted-foreground">Temperatura promedio mensual (°C)</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={datosAgrupados} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`${v}°C`]} />
                          <Line type="monotone" dataKey="temp_prom" name="Temp. prom" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Precipitación acumulada mensual */}
                    <div>
                      <p className="mb-3 text-xs font-medium text-muted-foreground">Precipitación acumulada mensual (mm)</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={datosAgrupados} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`${v} mm`]} />
                          <Bar dataKey="precip_acum" name="Precipitación" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Comparación anual */}
                    {datosComparacion.some((d) => d[`${anioActual}`] || d[`${anioActual - 1}`]) && (
                      <div>
                        <p className="mb-3 text-xs font-medium text-muted-foreground">
                          Comparación anual — Temperatura promedio (°C)
                        </p>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={datosComparacion} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`${v}°C`]} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line type="monotone" dataKey={`${anioActual}`} name={`${anioActual}`} stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                            <Line type="monotone" dataKey={`${anioActual - 1}`} name={`${anioActual - 1}`} stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                    No hay datos históricos en el rango seleccionado
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Historial con paginación */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b px-5 py-3">
              <h2 className="text-sm font-semibold">Historial reciente</h2>
            </div>
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
                    <th className="px-4 py-2.5 text-right">Viento</th>
                    <th className="px-4 py-2.5 text-right">Presión</th>
                    <th className="px-4 py-2.5 text-right">Nubosidad</th>
                    <th className="px-4 py-2.5 text-right">Fuente</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {historialPaginado && historialPaginado.length > 0 ? historialPaginado.map((d) => (
                    <tr key={d.dato_climatico_id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5">{formatFecha(d.fecha, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-2.5 text-right">{d.temp_minima ?? '--'}°</td>
                      <td className="px-4 py-2.5 text-right">{d.temp_maxima ?? '--'}°</td>
                      <td className="px-4 py-2.5 text-right font-medium">{d.temp_promedio ?? '--'}°</td>
                      <td className="px-4 py-2.5 text-right">{d.precipitacion_mm ?? '0'} mm</td>
                      <td className="px-4 py-2.5 text-right">{d.humedad_pct ?? '--'}%</td>
                      <td className="px-4 py-2.5 text-right">{d.velocidad_viento ?? '--'} km/h</td>
                      <td className="px-4 py-2.5 text-right">{d.presion_atm ?? '--'} hPa</td>
                      <td className="px-4 py-2.5 text-right">{d.cobertura_nubes_pct ?? '--'}%</td>
                      <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{d.fuente}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">No hay datos climáticos registrados. Presiona &quot;Actualizar clima actual&quot;.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-5 py-3">
                <p className="text-xs text-muted-foreground">
                  Página {historialPage} de {totalPages} · {historial?.length} registros totales
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setHistorialPage(1)} disabled={historialPage === 1}
                    className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-40">«</button>
                  <button onClick={() => setHistorialPage((p) => p - 1)} disabled={historialPage === 1}
                    className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-40">‹</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) { page = i + 1; }
                    else if (historialPage <= 3) { page = i + 1; }
                    else if (historialPage >= totalPages - 2) { page = totalPages - 4 + i; }
                    else { page = historialPage - 2 + i; }
                    return (
                      <button key={page} onClick={() => setHistorialPage(page)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs ${historialPage === page ? 'bg-emerald-600 text-white border-emerald-600' : 'hover:bg-accent'}`}>
                        {page}
                      </button>
                    );
                  })}
                  <button onClick={() => setHistorialPage((p) => p + 1)} disabled={historialPage === totalPages}
                    className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-40">›</button>
                  <button onClick={() => setHistorialPage(totalPages)} disabled={historialPage === totalPages}
                    className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-40">»</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}