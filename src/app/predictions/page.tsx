'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, AlertTriangle, Loader2, Target } from 'lucide-react';
import { predictionsService, PrediccionResponse } from '@/services/predictions.service';
import { parcelasService } from '@/services/parcelas.service';
import { useAuthStore } from '@/store/auth-store';

const riesgoStyle: Record<string, { bg: string; text: string; label: string }> = {
  bajo: { bg: 'bg-green-50', text: 'text-green-700', label: 'Bajo' },
  medio: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Medio' },
  alto: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Alto' },
  critico: { bg: 'bg-red-50', text: 'text-red-700', label: 'Crítico' },
};

const inputClass = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200";

export default function PredictionsPage() {
  const { usuario } = useAuthStore();
  const [selectedParcela, setSelectedParcela] = useState('');

  const { data: parcelas } = useQuery({
    queryKey: ['parcelas-select'],
    queryFn: usuario?.rol === 'agricultor' ? parcelasService.getMyParcelas : parcelasService.getAll,
  });

  const { data: predicciones, isLoading } = useQuery({
    queryKey: ['predicciones', selectedParcela],
    queryFn: () => predictionsService.getByParcela(selectedParcela),
    enabled: !!selectedParcela,
  });

  const { data: ultima } = useQuery({
    queryKey: ['prediccion-ultima', selectedParcela],
    queryFn: () => predictionsService.getLatest(selectedParcela),
    enabled: !!selectedParcela,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Predicciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">Predicciones de rendimiento con modelos ML</p>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <label className="mb-1.5 block text-sm font-medium">Selecciona una parcela</label>
        <select value={selectedParcela} onChange={(e) => setSelectedParcela(e.target.value)} className={inputClass}>
          <option value="">-- Seleccionar parcela --</option>
          {parcelas?.map((p) => <option key={p.parcela_id} value={p.parcela_id}>{p.nombre} ({p.area_hectareas} ha)</option>)}
        </select>
      </div>

      {!selectedParcela ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border bg-card text-sm text-muted-foreground shadow-sm"><BarChart3 className="h-8 w-8 text-muted-foreground/30" />Selecciona una parcela</div>
      ) : isLoading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : (
        <>
          {/* Última predicción destacada */}
          {ultima && (
            <div className="rounded-xl border bg-gradient-to-r from-emerald-50 to-cyan-50 p-6 shadow-sm">
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Última predicción</h2>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Rendimiento</p>
                  <p className="text-3xl font-bold text-emerald-600">{ultima.rendimiento_predicho_ton} <span className="text-sm font-normal">ton/ha</span></p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Confianza</p>
                  <p className="text-3xl font-bold text-blue-600">{ultima.puntaje_confianza ?? '--'}<span className="text-sm font-normal">%</span></p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Intervalo</p>
                  <p className="text-lg font-semibold">{ultima.intervalo_conf_inferior ?? '--'} — {ultima.intervalo_conf_superior ?? '--'} <span className="text-xs font-normal">ton</span></p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Riesgo</p>
                  {(() => { const r = riesgoStyle[ultima.nivel_riesgo] || riesgoStyle.medio; return <span className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-medium ${r.bg} ${r.text}`}>{r.label}</span>; })()}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
                <span>Modelo: {ultima.tipo_modelo} v{ultima.version_modelo}</span>
                <span>Cultivo: {ultima.tipoCultivo?.nombre || ultima.tipo_cultivo_id}</span>
                <span>{new Date(ultima.fecha_prediccion).toLocaleString('es-CO')}</span>
              </div>
            </div>
          )}

          {/* Historial */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b px-5 py-3"><h2 className="text-sm font-semibold">Historial de predicciones</h2></div>
            <div className="divide-y">
              {predicciones && predicciones.length > 0 ? predicciones.map((p) => {
                const r = riesgoStyle[p.nivel_riesgo] || riesgoStyle.medio;
                return (
                  <div key={p.prediccion_id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-lg bg-purple-50 p-2 text-purple-600"><TrendingUp className="h-4 w-4" /></div>
                      <div>
                        <p className="text-sm font-medium">{p.rendimiento_predicho_ton} ton/ha <span className="text-xs font-normal text-muted-foreground">— {p.tipo_modelo} v{p.version_modelo}</span></p>
                        <p className="text-xs text-muted-foreground">{p.tipoCultivo?.nombre || 'Cultivo'} · Confianza: {p.puntaje_confianza ?? '--'}% · {new Date(p.fecha_prediccion).toLocaleDateString('es-CO')}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.bg} ${r.text}`}>Riesgo {r.label}</span>
                          {p.intervalo_conf_inferior && <span className="text-[11px] text-muted-foreground"><Target className="mr-0.5 inline h-3 w-3" />{p.intervalo_conf_inferior}–{p.intervalo_conf_superior} ton</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground"><BarChart3 className="h-8 w-8 text-muted-foreground/30" />No hay predicciones aún</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}