'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cloud, Droplets, Thermometer, Wind, Loader2, Sun } from 'lucide-react';
import { weatherService } from '@/services/weather.service';
import { parcelasService } from '@/services/parcelas.service';
import { useAuthStore } from '@/store/auth-store';

const inputClass = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200";

export default function WeatherPage() {
  const { usuario } = useAuthStore();
  const [selectedParcela, setSelectedParcela] = useState('');

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

  const hoy = new Date().toISOString().split('T')[0];
  const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: promedios } = useQuery({
    queryKey: ['weather-promedios', selectedParcela],
    queryFn: () => weatherService.getPromedios(selectedParcela, hace30, hoy),
    enabled: !!selectedParcela,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clima</h1>
        <p className="mt-1 text-sm text-muted-foreground">Dashboard meteorológico por parcela</p>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <label className="mb-1.5 block text-sm font-medium">Selecciona una parcela</label>
        <select value={selectedParcela} onChange={(e) => setSelectedParcela(e.target.value)} className={inputClass}>
          <option value="">-- Seleccionar parcela --</option>
          {parcelas?.map((p) => <option key={p.parcela_id} value={p.parcela_id}>{p.nombre} ({p.area_hectareas} ha)</option>)}
        </select>
      </div>

      {!selectedParcela ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border bg-card text-sm text-muted-foreground shadow-sm"><Cloud className="h-8 w-8 text-muted-foreground/30" />Selecciona una parcela</div>
      ) : isLoading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : (
        <>
          {/* Último dato */}
          {ultimo && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Thermometer className="h-3.5 w-3.5" /> Temperatura</div>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{ultimo.temp_promedio ?? '--'}°C</p>
                <p className="text-[11px] text-muted-foreground">Min {ultimo.temp_minima ?? '--'}° / Max {ultimo.temp_maxima ?? '--'}°</p>
              </div>
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Droplets className="h-3.5 w-3.5" /> Precipitación</div>
                <p className="mt-1 text-2xl font-bold text-blue-600">{ultimo.precipitacion_mm ?? '--'} mm</p>
              </div>
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Cloud className="h-3.5 w-3.5" /> Humedad</div>
                <p className="mt-1 text-2xl font-bold text-cyan-600">{ultimo.humedad_pct ?? '--'}%</p>
              </div>
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Wind className="h-3.5 w-3.5" /> Viento</div>
                <p className="mt-1 text-2xl font-bold text-gray-600">{ultimo.velocidad_viento ?? '--'} km/h</p>
              </div>
            </div>
          )}

          {/* Promedios 30 días */}
          {promedios && promedios.dias_registrados > 0 && (
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Promedios últimos 30 días ({promedios.dias_registrados} registros)</h2>
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
                <thead><tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 text-left">Fecha</th><th className="px-4 py-2.5 text-right">T. Min</th><th className="px-4 py-2.5 text-right">T. Max</th><th className="px-4 py-2.5 text-right">T. Prom</th><th className="px-4 py-2.5 text-right">Lluvia</th><th className="px-4 py-2.5 text-right">Humedad</th><th className="px-4 py-2.5 text-right">Fuente</th>
                </tr></thead>
                <tbody className="divide-y">
                  {historial && historial.length > 0 ? historial.map((d) => (
                    <tr key={d.dato_climatico_id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5">{new Date(d.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</td>
                      <td className="px-4 py-2.5 text-right">{d.temp_minima ?? '--'}°</td>
                      <td className="px-4 py-2.5 text-right">{d.temp_maxima ?? '--'}°</td>
                      <td className="px-4 py-2.5 text-right font-medium">{d.temp_promedio ?? '--'}°</td>
                      <td className="px-4 py-2.5 text-right">{d.precipitacion_mm ?? '--'} mm</td>
                      <td className="px-4 py-2.5 text-right">{d.humedad_pct ?? '--'}%</td>
                      <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{d.fuente}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No hay datos climáticos registrados</td></tr>
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