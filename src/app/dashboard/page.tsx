'use client';

import { useQuery } from '@tanstack/react-query';
import {
  MapPin, Sprout, BarChart3, Bell, ChevronRight, Loader2,
  Leaf, TrendingUp, Clock, Cloud, Thermometer, Droplets, Wind,
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { parcelasService } from '@/services/parcelas.service';
import { cultivosService } from '@/services/cultivos.service';
import { alertsService } from '@/services/alerts.service';
import { weatherService } from '@/services/weather.service';

function diasHastaCosecha(fechaCosechaEsperada?: string): number | null {
  if (!fechaCosechaEsperada) return null;
  const diff = Math.ceil((new Date(fechaCosechaEsperada).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function estadoStyle(estado: string): { bg: string; text: string; label: string } {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    planificado: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Planificado' },
    activo: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Activo' },
    cosechado: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Cosechado' },
    fallido: { bg: 'bg-red-50', text: 'text-red-700', label: 'Fallido' },
    abandonado: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Abandonado' },
  };
  return map[estado] || { bg: 'bg-gray-50', text: 'text-gray-700', label: estado };
}

export default function DashboardPage() {
  const { usuario } = useAuthStore();
  const isAgricultor = usuario?.rol === 'agricultor';

  const { data: parcelas, isLoading: loadingParcelas } = useQuery({
    queryKey: ['parcelas', usuario?.usuario_id],
    queryFn: isAgricultor ? parcelasService.getMyParcelas : parcelasService.getAll,
    enabled: !!usuario,
  });

  const { data: cultivos, isLoading: loadingCultivos } = useQuery({
    queryKey: ['cultivos', usuario?.usuario_id],
    queryFn: isAgricultor ? cultivosService.getMyCultivos : cultivosService.getAll,
    enabled: !!usuario,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['alertas-unread-count'],
    queryFn: alertsService.countUnread,
    enabled: !!usuario,
  });

  // Clima de la primera parcela
  const primeraParcelaId = parcelas?.[0]?.parcela_id;
  const { data: climaActual } = useQuery({
    queryKey: ['weather-ultimo-dashboard', primeraParcelaId],
    queryFn: () => weatherService.getUltimo(primeraParcelaId!),
    enabled: !!primeraParcelaId,
  });

  const isLoading = loadingParcelas || loadingCultivos;
  const totalParcelas = parcelas?.length || 0;
  const cultivosActivos = cultivos?.filter((c) => c.estado === 'activo') || [];
  const cultivosPlanificados = cultivos?.filter((c) => c.estado === 'planificado') || [];
  const totalCultivos = cultivosActivos.length + cultivosPlanificados.length;
  const areaTotalHa = parcelas?.reduce((sum, p) => sum + Number(p.area_hectareas), 0) || 0;

  const proximasCosechas = cultivosActivos
    .filter((c) => c.fecha_cosecha_esperada)
    .map((c) => ({ ...c, dias: diasHastaCosecha(c.fecha_cosecha_esperada) }))
    .filter((c) => c.dias !== null && c.dias > 0)
    .sort((a, b) => (a.dias || 0) - (b.dias || 0))
    .slice(0, 5);

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Bienvenido, {usuario?.nombre}. Aquí tienes el resumen de tu finca.</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />Datos en vivo
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Parcelas</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><MapPin className="h-4 w-4" /></div>
          </div>
          <p className="mt-2 text-3xl font-semibold">{totalParcelas}</p>
          <p className="mt-0.5 text-xs text-muted-foreground"><span className="font-medium text-emerald-600">{areaTotalHa.toFixed(1)} ha</span> totales</p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Cultivos</span>
            <div className="rounded-lg bg-green-50 p-2 text-green-600"><Sprout className="h-4 w-4" /></div>
          </div>
          <p className="mt-2 text-3xl font-semibold">{totalCultivos}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="font-medium text-emerald-600">{cultivosActivos.length}</span> activos
            {cultivosPlanificados.length > 0 && <>, <span className="font-medium text-blue-600">{cultivosPlanificados.length}</span> planificados</>}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Predicciones</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600"><BarChart3 className="h-4 w-4" /></div>
          </div>
          <p className="mt-2 text-3xl font-semibold text-muted-foreground/40">—</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Próximamente</p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Alertas</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600"><Bell className="h-4 w-4" /></div>
          </div>
          <p className="mt-2 text-3xl font-semibold">{unreadCount?.count || 0}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">sin leer</p>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Próximas cosechas */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3.5">
            <span className="text-sm font-medium">Próximas cosechas</span>
            <Link href="/crops" className="text-xs text-emerald-600 hover:underline">Ver cultivos</Link>
          </div>
          {proximasCosechas.length > 0 ? (
            <div className="divide-y">
              {proximasCosechas.map((cultivo) => (
                <div key={cultivo.cultivo_parcela_id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-green-50 p-2 text-green-600"><Leaf className="h-4 w-4" /></div>
                    <div>
                      <p className="text-[13px] font-medium">{cultivo.tipoCultivo?.nombre || 'Cultivo'}</p>
                      <p className="text-xs text-muted-foreground">{cultivo.parcela?.nombre || 'Parcela'}{cultivo.area_sembrada_ha && ` · ${cultivo.area_sembrada_ha} ha`}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span className={`text-sm font-semibold ${(cultivo.dias || 0) <= 30 ? 'text-amber-600' : 'text-foreground'}`}>{cultivo.dias} días</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Date(cultivo.fecha_cosecha_esperada!).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              {totalCultivos > 0 ? 'No hay cosechas próximas programadas' : 'Registra un cultivo para ver las cosechas'}
            </div>
          )}
        </div>

        {/* Cultivos por parcela */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3.5">
            <span className="text-sm font-medium">Cultivos por parcela</span>
            <Link href="/parcels" className="text-xs text-emerald-600 hover:underline">Ver parcelas</Link>
          </div>
          {parcelas && parcelas.length > 0 ? (
            <div className="divide-y">
              {parcelas.slice(0, 5).map((parcela) => {
                const cultivosDeParcela = cultivos?.filter((c) => c.parcela_id === parcela.parcela_id && (c.estado === 'activo' || c.estado === 'planificado')) || [];
                return (
                  <div key={parcela.parcela_id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium">{parcela.nombre}</p>
                        <p className="text-xs text-muted-foreground">{parcela.area_hectareas} ha</p>
                      </div>
                      <Link href="/parcels" className="text-muted-foreground hover:text-foreground"><ChevronRight className="h-4 w-4" /></Link>
                    </div>
                    {cultivosDeParcela.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {cultivosDeParcela.map((c) => {
                          const estilo = estadoStyle(c.estado);
                          return (
                            <span key={c.cultivo_parcela_id} className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${estilo.bg} ${estilo.text}`}>
                              {c.tipoCultivo?.nombre || 'Cultivo'} · {estilo.label}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-1.5 text-[11px] text-muted-foreground">Sin cultivos activos</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">No hay parcelas registradas</div>
          )}
        </div>

        {/* Clima actual */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3.5">
            <span className="text-sm font-medium">Clima actual</span>
            <Link href="/weather" className="text-xs text-emerald-600 hover:underline">Ver detalle</Link>
          </div>
          {!primeraParcelaId ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              <Cloud className="mr-2 h-5 w-5 text-muted-foreground/30" />Registra una parcela para ver el clima
            </div>
          ) : !climaActual ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <Cloud className="h-8 w-8 text-muted-foreground/30" />
              <p>Sin datos climáticos</p>
              <Link href="/weather" className="text-xs text-emerald-600 hover:underline">Actualizar desde OpenWeatherMap</Link>
            </div>
          ) : (
            <div className="p-5">
              <p className="mb-3 text-xs text-muted-foreground">
                {parcelas?.[0]?.nombre} ·{' '}
                {new Date(climaActual.fecha).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Thermometer className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Temperatura</p>
                    <p className="text-lg font-bold text-emerald-600">{climaActual.temp_promedio ?? '--'}°C</p>
                    <p className="text-[10px] text-muted-foreground">{climaActual.temp_minima ?? '--'}° / {climaActual.temp_maxima ?? '--'}°</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Droplets className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Humedad</p>
                    <p className="text-lg font-bold text-blue-600">{climaActual.humedad_pct ?? '--'}%</p>
                    <p className="text-[10px] text-muted-foreground">{climaActual.precipitacion_mm ?? '0'} mm lluvia</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Wind className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Viento</p>
                    <p className="text-lg font-bold text-gray-600">{climaActual.velocidad_viento ?? '--'} <span className="text-xs font-normal">km/h</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Cloud className="h-5 w-5 text-cyan-600" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Nubosidad</p>
                    <p className="text-lg font-bold text-cyan-600">{climaActual.cobertura_nubes_pct ?? '--'}<span className="text-xs font-normal">%</span></p>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-right text-[10px] text-muted-foreground">{climaActual.fuente}</p>
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b px-5 py-3.5"><span className="text-sm font-medium">Acciones rápidas</span></div>
          <div className="grid grid-cols-2 gap-3 p-4">
            {[
              { href: '/parcels', icon: MapPin, label: 'Mis parcelas', desc: 'Ver mapa y gestionar', color: 'bg-emerald-50 text-emerald-600' },
              { href: '/crops', icon: Sprout, label: 'Mis cultivos', desc: 'Registrar y seguir', color: 'bg-green-50 text-green-600' },
              { href: '/predictions', icon: BarChart3, label: 'Predicciones', desc: 'Rendimiento con IA', color: 'bg-blue-50 text-blue-600' },
              { href: '/chat', icon: TrendingUp, label: 'Consultar asistente', desc: 'Chat IA con RAG', color: 'bg-violet-50 text-violet-600' },
            ].map(({ href, icon: Icon, label, desc, color }) => (
              <Link key={href} href={href} className="group flex items-center gap-3 rounded-xl border bg-muted/20 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50/30">
                <div className={`rounded-lg p-2 ${color}`}><Icon className="h-4 w-4" /></div>
                <div>
                  <p className="text-[13px] font-medium">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}