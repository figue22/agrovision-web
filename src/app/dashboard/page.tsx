'use client';

import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Sprout,
  BarChart3,
  Bell,
  Plus,
  ChevronRight,
  Loader2,
  Calendar,
  Leaf,
  TrendingUp,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { parcelasService, ParcelaResponse } from '@/services/parcelas.service';
import { cultivosService, CultivoParcelaResponse } from '@/services/cultivos.service';

// Calcular días hasta la cosecha
function diasHastaCosecha(fechaCosechaEsperada?: string): number | null {
  if (!fechaCosechaEsperada) return null;
  const hoy = new Date();
  const cosecha = new Date(fechaCosechaEsperada);
  const diff = Math.ceil((cosecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

// Color del estado del cultivo
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

  const isLoading = loadingParcelas || loadingCultivos;

  // Cálculos del dashboard
  const totalParcelas = parcelas?.length || 0;
  const cultivosActivos = cultivos?.filter((c) => c.estado === 'activo') || [];
  const cultivosPlanificados = cultivos?.filter((c) => c.estado === 'planificado') || [];
  const totalCultivos = cultivosActivos.length + cultivosPlanificados.length;

  // Próximas cosechas (cultivos activos con fecha cosecha esperada, ordenados por fecha)
  const proximasCosechas = cultivosActivos
    .filter((c) => c.fecha_cosecha_esperada)
    .map((c) => ({
      ...c,
      dias: diasHastaCosecha(c.fecha_cosecha_esperada),
    }))
    .filter((c) => c.dias !== null && c.dias > 0)
    .sort((a, b) => (a.dias || 0) - (b.dias || 0))
    .slice(0, 5);

  // Área total
  const areaTotalHa = parcelas?.reduce((sum, p) => sum + Number(p.area_hectareas), 0) || 0;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bienvenido, {usuario?.nombre}. Aquí tienes el resumen de tu finca.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Datos en vivo
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 transition-colors hover:border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Parcelas</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-semibold">{totalParcelas}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="font-medium text-emerald-600">{areaTotalHa.toFixed(1)} ha</span> totales
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 transition-colors hover:border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Cultivos</span>
            <div className="rounded-lg bg-green-50 p-2 text-green-600">
              <Sprout className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-semibold">{totalCultivos}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="font-medium text-emerald-600">{cultivosActivos.length}</span> activos
            {cultivosPlanificados.length > 0 && (
              <>, <span className="font-medium text-blue-600">{cultivosPlanificados.length}</span> planificados</>
            )}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 transition-colors hover:border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Predicciones</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-semibold text-muted-foreground/40">—</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Próximamente</p>
        </div>

        <div className="rounded-xl border bg-card p-5 transition-colors hover:border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Alertas</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Bell className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-semibold text-muted-foreground/40">—</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Próximamente</p>
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
                    <div className="mt-0.5 rounded-lg bg-green-50 p-2 text-green-600">
                      <Leaf className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium">
                        {cultivo.tipoCultivo?.nombre || 'Cultivo'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cultivo.parcela?.nombre || 'Parcela'}
                        {cultivo.area_sembrada_ha && ` · ${cultivo.area_sembrada_ha} ha`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span className={`text-sm font-semibold ${
                        (cultivo.dias || 0) <= 30 ? 'text-amber-600' : 'text-foreground'
                      }`}>
                        {cultivo.dias} días
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Date(cultivo.fecha_cosecha_esperada!).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              {totalCultivos > 0
                ? 'No hay cosechas próximas programadas'
                : 'Registra un cultivo para ver las cosechas'}
            </div>
          )}
        </div>

        {/* Cultivos activos por parcela */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3.5">
            <span className="text-sm font-medium">Cultivos por parcela</span>
            <Link href="/parcels" className="text-xs text-emerald-600 hover:underline">Ver parcelas</Link>
          </div>
          {parcelas && parcelas.length > 0 ? (
            <div className="divide-y">
              {parcelas.slice(0, 5).map((parcela) => {
                const cultivosDeParcela = cultivos?.filter(
                  (c) => c.parcela_id === parcela.parcela_id && (c.estado === 'activo' || c.estado === 'planificado'),
                ) || [];

                return (
                  <div key={parcela.parcela_id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium">{parcela.nombre}</p>
                        <p className="text-xs text-muted-foreground">{parcela.area_hectareas} ha</p>
                      </div>
                      <Link href="/parcels" className="text-muted-foreground hover:text-foreground">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                    {cultivosDeParcela.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {cultivosDeParcela.map((c) => {
                          const estilo = estadoStyle(c.estado);
                          return (
                            <span
                              key={c.cultivo_parcela_id}
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${estilo.bg} ${estilo.text}`}
                            >
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
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No hay parcelas registradas
            </div>
          )}
        </div>

        {/* Cultivos activos por parcela */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3.5">
            <span className="text-sm font-medium">Clima actual</span>
            <Link href="/weather" className="text-xs text-emerald-600 hover:underline">Ver detalle</Link>
          </div>
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Próximamente — Se conectará con datos meteorológicos en la HU-029
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Acciones rápidas
        </p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Link
            href="/parcels"
            className="group flex flex-col items-center gap-2.5 rounded-xl border bg-card p-5 text-center transition-all hover:border-emerald-300 hover:bg-emerald-50/50"
          >
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600 transition-colors group-hover:bg-emerald-100">
              <MapPin className="h-[18px] w-[18px]" />
            </div>
            <div>
              <p className="text-[13px] font-medium">Mis parcelas</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Ver mapa y gestionar</p>
            </div>
          </Link>
          <Link
            href="/crops"
            className="group flex flex-col items-center gap-2.5 rounded-xl border bg-card p-5 text-center transition-all hover:border-green-300 hover:bg-green-50/50"
          >
            <div className="rounded-lg bg-green-50 p-2.5 text-green-600 transition-colors group-hover:bg-green-100">
              <Sprout className="h-[18px] w-[18px]" />
            </div>
            <div>
              <p className="text-[13px] font-medium">Mis cultivos</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Registrar y seguir</p>
            </div>
          </Link>
          <Link
            href="/predictions"
            className="group flex flex-col items-center gap-2.5 rounded-xl border bg-card p-5 text-center transition-all hover:border-blue-300 hover:bg-blue-50/50"
          >
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 transition-colors group-hover:bg-blue-100">
              <BarChart3 className="h-[18px] w-[18px]" />
            </div>
            <div>
              <p className="text-[13px] font-medium">Predicciones</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Rendimiento con IA</p>
            </div>
          </Link>
          <Link
            href="/chat"
            className="group flex flex-col items-center gap-2.5 rounded-xl border bg-card p-5 text-center transition-all hover:border-violet-300 hover:bg-violet-50/50"
          >
            <div className="rounded-lg bg-violet-50 p-2.5 text-violet-600 transition-colors group-hover:bg-violet-100">
              <TrendingUp className="h-[18px] w-[18px]" />
            </div>
            <div>
              <p className="text-[13px] font-medium">Consultar asistente</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Chat IA con RAG</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
