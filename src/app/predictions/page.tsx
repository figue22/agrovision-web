'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3, TrendingUp, Loader2, Target, Plus, X,
  ChevronDown, ChevronUp, Zap, Info, Calendar,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { predictionsService } from '@/services/predictions.service';
import { parcelasService } from '@/services/parcelas.service';
import { cultivosService } from '@/services/cultivos.service';
import { weatherService } from '@/services/weather.service';
import { useAuthStore } from '@/store/auth-store';

const riesgoStyle: Record<string, { bg: string; text: string; border: string; label: string; color: string }> = {
  bajo:    { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-300',  label: 'Bajo',    color: '#10b981' },
  medio:   { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300', label: 'Medio',   color: '#f59e0b' },
  alto:    { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', label: 'Alto',    color: '#f97316' },
  critico: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-300',    label: 'Crítico', color: '#ef4444' },
};

const inputClass = 'h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200';

const MODELOS = [
  { value: 'ensemble', label: 'Ensemble (XGBoost + LSTM)', desc: 'Más preciso — RMSE 2.24%' },
  { value: 'xgboost', label: 'XGBoost', desc: 'Rápido — R² 0.9988' },
  { value: 'lstm', label: 'LSTM', desc: 'Series temporales — R² 0.9901' },
];

export default function PredictionsPage() {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedParcela, setSelectedParcela] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cultivo_parcela_id: '',
    modelo: 'ensemble',
    materia_organica_pct: '3.0',
    nivel_fertilizacion: '1',
    tiene_riego: '0',
    nivel_control_plagas: '1',
    variedad: 'mejorada',
    tipo_labranza: 'convencional',
    densidad_siembra_rel: '1.0',
  });

  const { data: parcelas } = useQuery({
    queryKey: ['parcelas-select'],
    queryFn: usuario?.rol === 'agricultor' ? parcelasService.getMyParcelas : parcelasService.getAll,
  });

  const { data: cultivos } = useQuery({
    queryKey: ['cultivos-parcela', selectedParcela],
    queryFn: () => cultivosService.getCultivosByParcela(selectedParcela),
    enabled: !!selectedParcela,
  });

  const { data: climaActual } = useQuery({
    queryKey: ['weather-ultimo-pred', selectedParcela],
    queryFn: () => weatherService.getUltimo(selectedParcela),
    enabled: !!selectedParcela,
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

  const createMutation = useMutation({
    mutationFn: (data: any) => predictionsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predicciones', selectedParcela] });
      queryClient.invalidateQueries({ queryKey: ['prediccion-ultima', selectedParcela] });
      queryClient.invalidateQueries({ queryKey: ['cultivos-parcela', selectedParcela] });
      setShowForm(false);
    },
  });

  const handleSubmit = () => {
    const cultivoSelected = cultivos?.find((c) => c.cultivo_parcela_id === formData.cultivo_parcela_id);

    // Normalizar nombre del cultivo
    const cultivoNombre = cultivoSelected?.tipoCultivo?.nombre?.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_') || 'platano';
    const cultivo = cultivoNombre.includes('cacao') ? 'cacao' : 'platano';

    const payload = {
      parcela_id: selectedParcela,
      cultivo_parcela_id: formData.cultivo_parcela_id,
      tipo_cultivo_id: cultivoSelected?.tipo_cultivo_id || '',
      modelo: formData.modelo,
      datos_agronomicos: {
        cultivo,
        // Datos agronómicos del formulario — el backend enriquece con datos reales de BD
        materia_organica_pct: parseFloat(formData.materia_organica_pct),
        nivel_fertilizacion: parseInt(formData.nivel_fertilizacion),
        tiene_riego: parseInt(formData.tiene_riego),
        nivel_control_plagas: parseInt(formData.nivel_control_plagas),
        variedad: formData.variedad,
        tipo_labranza: formData.tipo_labranza,
        densidad_siembra_rel: parseFloat(formData.densidad_siembra_rel),
      },
    };
    createMutation.mutate(payload);
  };

  // Datos para gráfica
  const chartData = predicciones?.slice(0, 8).reverse().map((p, i) => ({
    name: `P${i + 1}`,
    rendimiento: p.rendimiento_predicho_ton,
    inferior: p.intervalo_conf_inferior,
    superior: p.intervalo_conf_superior,
    riesgo: p.nivel_riesgo,
    fecha: new Date(p.fecha_prediccion).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
  })) || [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Predicciones ML</h1>
          <p className="mt-1 text-sm text-muted-foreground">Predicción de rendimiento con XGBoost + LSTM</p>
        </div>
        {selectedParcela && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Nueva predicción
          </button>
        )}
      </div>

      {/* Selector de parcela */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <label className="mb-1.5 block text-sm font-medium">Selecciona una parcela</label>
        <select value={selectedParcela} onChange={(e) => { setSelectedParcela(e.target.value); setShowForm(false); }} className={inputClass}>
          <option value="">-- Seleccionar parcela --</option>
          {parcelas?.map((p) => <option key={p.parcela_id} value={p.parcela_id}>{p.nombre} ({p.area_hectareas} ha)</option>)}
        </select>
      </div>

      {/* Formulario nueva predicción */}
      {showForm && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Nueva predicción</h2>
            <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
          </div>

          {/* Info clima actual */}
          {climaActual && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-xs text-blue-700">
              <Info className="h-3.5 w-3.5 flex-shrink-0" />
              El backend usará automáticamente datos reales de la parcela: clima últimos 90 días,
              pH {climaActual ? '✅' : '--'}, altitud, tipo de suelo y días desde siembra.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Cultivo</label>
              <select value={formData.cultivo_parcela_id} onChange={(e) => setFormData({ ...formData, cultivo_parcela_id: e.target.value })} className={inputClass}>
                <option value="">-- Seleccionar cultivo --</option>
                {cultivos?.map((c) => (
                  <option key={c.cultivo_parcela_id} value={c.cultivo_parcela_id}>
                    {c.tipoCultivo?.nombre} — {c.estado}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Modelo ML</label>
              <select value={formData.modelo} onChange={(e) => setFormData({ ...formData, modelo: e.target.value })} className={inputClass}>
                {MODELOS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">{MODELOS.find((m) => m.value === formData.modelo)?.desc}</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Materia orgánica (%)</label>
              <input type="number" step="0.1" value={formData.materia_organica_pct}
                onChange={(e) => setFormData({ ...formData, materia_organica_pct: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Variedad</label>
              <select value={formData.variedad} onChange={(e) => setFormData({ ...formData, variedad: e.target.value })} className={inputClass}>
                <option value="mejorada">Mejorada</option>
                <option value="hibrida">Híbrida</option>
                <option value="tradicional">Tradicional</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nivel fertilización</label>
              <select value={formData.nivel_fertilizacion} onChange={(e) => setFormData({ ...formData, nivel_fertilizacion: e.target.value })} className={inputClass}>
                <option value="0">Sin fertilización</option>
                <option value="1">Parcial</option>
                <option value="2">Completa</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Control de plagas</label>
              <select value={formData.nivel_control_plagas} onChange={(e) => setFormData({ ...formData, nivel_control_plagas: e.target.value })} className={inputClass}>
                <option value="0">Sin control</option>
                <option value="1">Básico</option>
                <option value="2">Completo</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Sistema de riego</label>
              <select value={formData.tiene_riego} onChange={(e) => setFormData({ ...formData, tiene_riego: e.target.value })} className={inputClass}>
                <option value="0">Sin riego</option>
                <option value="1">Con riego</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Labranza</label>
              <select value={formData.tipo_labranza} onChange={(e) => setFormData({ ...formData, tipo_labranza: e.target.value })} className={inputClass}>
                <option value="convencional">Convencional</option>
                <option value="minima">Mínima</option>
                <option value="conservacion">Conservación</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="h-10 rounded-lg border px-4 text-sm hover:bg-accent">Cancelar</button>
            <button onClick={handleSubmit} disabled={!formData.cultivo_parcela_id || createMutation.isPending}
              className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Generar predicción
            </button>
          </div>
        </div>
      )}

      {!selectedParcela ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border bg-card text-sm text-muted-foreground shadow-sm">
          <BarChart3 className="h-8 w-8 text-muted-foreground/30" />Selecciona una parcela
        </div>
      ) : isLoading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : (
        <>
          {/* Última predicción */}
          {ultima && (
            <div className={`rounded-xl border-l-4 ${riesgoStyle[ultima.nivel_riesgo]?.border || 'border-emerald-300'} bg-card p-6 shadow-sm`}>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">Última predicción</h2>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Rendimiento</p>
                  <p className="text-3xl font-bold text-emerald-600">{ultima.rendimiento_predicho_ton} <span className="text-sm font-normal">ton/ha</span></p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ultima.intervalo_conf_inferior ?? '--'} — {ultima.intervalo_conf_superior ?? '--'} ton/ha
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Confianza</p>
                  <p className="text-3xl font-bold text-blue-600">{ultima.puntaje_confianza ?? '--'}<span className="text-sm font-normal">%</span></p>
                  <div className="mt-2 h-2 w-full rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${ultima.puntaje_confianza ?? 0}%` }} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nivel de riesgo</p>
                  {(() => {
                    const r = riesgoStyle[ultima.nivel_riesgo] || riesgoStyle.medio;
                    return <span className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-medium ${r.bg} ${r.text}`}>{r.label}</span>;
                  })()}
                </div>
                {(ultima as any).fecha_cosecha_estimada && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Cosecha estimada</p>
                    <p className="text-lg font-bold text-amber-600">
                      {new Date((ultima as any).fecha_cosecha_estimada).toLocaleDateString('es-CO', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                    {(ultima as any).dias_para_cosecha != null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        En {(ultima as any).dias_para_cosecha} días
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                <span>Modelo: <span className="font-medium">{ultima.tipo_modelo}</span> v{ultima.version_modelo}</span>
                <span>Cultivo: {(ultima as any).tipoCultivo?.nombre || ultima.tipo_cultivo_id}</span>
                <span>{new Date(ultima.fecha_prediccion).toLocaleString('es-CO')}</span>
              </div>
            </div>
          )}

          {/* Gráfica */}
          {chartData.length > 1 && (
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold">Historial de predicciones</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value: number, name: string) => [
                      `${value} ton/ha`,
                      name === 'rendimiento' ? 'Predicción' : name === 'inferior' ? 'Límite inferior' : 'Límite superior',
                    ]}
                  />
                  <Bar dataKey="rendimiento" name="rendimiento" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={riesgoStyle[entry.riesgo]?.color || '#10b981'} />
                    ))}
                  </Bar>
                  <ReferenceLine y={0} stroke="#666" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                {Object.entries(riesgoStyle).map(([key, val]) => (
                  <span key={key} className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: val.color }} />
                    {val.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Historial */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b px-5 py-3"><h2 className="text-sm font-semibold">Historial ({predicciones?.length || 0} predicciones)</h2></div>
            <div className="divide-y">
              {predicciones && predicciones.length > 0 ? predicciones.map((p) => {
                const r = riesgoStyle[p.nivel_riesgo] || riesgoStyle.medio;
                const isExpanded = expandedId === p.prediccion_id;
                return (
                  <div key={p.prediccion_id}>
                    <div
                      className="flex cursor-pointer items-center justify-between px-5 py-4 hover:bg-muted/20"
                      onClick={() => setExpandedId(isExpanded ? null : p.prediccion_id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-lg bg-purple-50 p-2 text-purple-600"><TrendingUp className="h-4 w-4" /></div>
                        <div>
                          <p className="text-sm font-medium">
                            {p.rendimiento_predicho_ton} ton/ha
                            <span className="ml-2 text-xs font-normal text-muted-foreground">{p.tipo_modelo} v{p.version_modelo}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(p as any).tipoCultivo?.nombre || 'Cultivo'} · {new Date(p.fecha_prediccion).toLocaleDateString('es-CO')}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.bg} ${r.text}`}>Riesgo {r.label}</span>
                            {p.puntaje_confianza && <span className="text-[11px] text-muted-foreground">Confianza: {p.puntaje_confianza}%</span>}
                            {p.intervalo_conf_inferior && (
                              <span className="text-[11px] text-muted-foreground">
                                <Target className="mr-0.5 inline h-3 w-3" />{p.intervalo_conf_inferior}–{p.intervalo_conf_superior} ton/ha
                              </span>
                            )}
                            {(p as any).fecha_cosecha_estimada && (
                              <span className="text-[11px] text-amber-600">
                                <Calendar className="mr-0.5 inline h-3 w-3" />
                                Cosecha: {new Date((p as any).fecha_cosecha_estimada).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    {isExpanded && (
                      <div className="border-t bg-muted/10 px-5 py-4 space-y-3">
                        {/* Fecha cosecha */}
                        {(p as any).fecha_cosecha_estimada && (
                          <div className="flex items-center gap-3 rounded-lg bg-amber-50 px-4 py-2.5 border border-amber-200">
                            <Calendar className="h-4 w-4 text-amber-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-amber-800">Cosecha estimada</p>
                              <p className="text-sm font-bold text-amber-700">
                                {new Date((p as any).fecha_cosecha_estimada).toLocaleDateString('es-CO', {
                                  day: 'numeric', month: 'long', year: 'numeric',
                                })}
                                {(p as any).dias_para_cosecha != null && (
                                  <span className="ml-2 text-xs font-normal text-amber-600">
                                    ({(p as any).dias_para_cosecha} días restantes)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Factores de riesgo */}
                        {p.factores_riesgo && Object.keys(p.factores_riesgo).length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Factores de riesgo</p>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(p.factores_riesgo).map(([k, v]) => (
                                <p key={k} className="text-xs"><span className="font-medium">{k}:</span> {String(v)}</p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Datos clima usados */}
                        {(p as any).datos_clima_usados && Object.keys((p as any).datos_clima_usados).length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Datos climáticos usados</p>
                            <div className="grid grid-cols-3 gap-2">
                              {Object.entries((p as any).datos_clima_usados)
                                .filter(([, v]) => v != null)
                                .map(([k, v]) => (
                                  <p key={k} className="text-xs"><span className="font-medium">{k}:</span> {String(v)}</p>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Feature importance */}
                        {p.importancia_features && Object.keys(p.importancia_features).length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Features más importantes</p>
                            <div className="space-y-1">
                              {Object.entries(p.importancia_features).slice(0, 5).map(([feat, imp]) => (
                                <div key={feat} className="flex items-center gap-2">
                                  <span className="w-32 truncate text-[11px]">{feat}</span>
                                  <div className="flex-1 rounded-full bg-muted h-1.5">
                                    <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Number(imp) * 100}%` }} />
                                  </div>
                                  <span className="text-[11px] text-muted-foreground">{(Number(imp) * 100).toFixed(1)}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recomendaciones */}
                        {(p as any).recomendaciones && (p as any).recomendaciones.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Recomendaciones ({(p as any).recomendaciones.length})
                            </p>
                            <div className="space-y-2">
                              {(p as any).recomendaciones.map((rec: any) => (
                                <div key={rec.recomendacion_id} className="rounded-lg border bg-background px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                      rec.prioridad === 'critica' ? 'bg-red-50 text-red-700' :
                                      rec.prioridad === 'alta' ? 'bg-orange-50 text-orange-700' :
                                      rec.prioridad === 'media' ? 'bg-yellow-50 text-yellow-700' :
                                      'bg-green-50 text-green-700'
                                    }`}>{rec.prioridad}</span>
                                    <p className="text-xs font-medium">{rec.titulo}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }) : (
                <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <BarChart3 className="h-8 w-8 text-muted-foreground/30" />No hay predicciones aún. Crea una nueva.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}