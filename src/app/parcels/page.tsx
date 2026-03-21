'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Plus,
  Layers,
  Mountain,
  Droplets,
  Ruler,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { ParcelaMapDynamic } from '@/components/maps';
import { parcelasService, ParcelaResponse } from '@/services/parcelas.service';
import { useAuthStore } from '@/store/auth-store';

const tipoSueloLabel: Record<string, string> = {
  arcilloso: 'Arcilloso',
  arenoso: 'Arenoso',
  limoso: 'Limoso',
  franco: 'Franco',
  mixto: 'Mixto',
};

export default function ParcelsPage() {
  const { usuario } = useAuthStore();
  const [selectedParcela, setSelectedParcela] = useState<ParcelaResponse | null>(null);

  const isAgricultor = usuario?.rol === 'agricultor';

  const { data: parcelas, isLoading, error } = useQuery({
    queryKey: ['parcelas', usuario?.usuario_id],
    queryFn: isAgricultor ? parcelasService.getMyParcelas : parcelasService.getAll,
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-sm text-muted-foreground">Error al cargar las parcelas</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isAgricultor ? 'Mis Parcelas' : 'Parcelas'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {parcelas?.length || 0} parcelas registradas
            {!isAgricultor && usuario?.rol === 'tecnico' && ' (de tus agricultores asignados)'}
          </p>
        </div>
        {isAgricultor && (
          <a
            href="/parcels/new"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Nueva parcela
          </a>
        )}
      </div>

      {/* Map + List layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map (2/3 width) */}
        <div className="lg:col-span-2">
          <ParcelaMapDynamic
            parcelas={parcelas || []}
            selectedId={selectedParcela?.parcela_id}
            onSelectParcela={setSelectedParcela}
            height="520px"
          />
        </div>

        {/* Sidebar list + detail (1/3 width) */}
        <div className="flex flex-col gap-4">
          {/* Detail panel */}
          {selectedParcela ? (
            <div className="rounded-xl border bg-card shadow-sm">
              <div className="border-b px-5 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{selectedParcela.nombre}</h2>
                  <button
                    onClick={() => setSelectedParcela(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                    <Ruler className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Área</p>
                    <p className="text-sm font-medium">{selectedParcela.area_hectareas} hectáreas</p>
                  </div>
                </div>

                {selectedParcela.tipo_suelo && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo de suelo</p>
                      <p className="text-sm font-medium">
                        {tipoSueloLabel[selectedParcela.tipo_suelo] || selectedParcela.tipo_suelo}
                      </p>
                    </div>
                  </div>
                )}

                {selectedParcela.ph_suelo && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                      <Droplets className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">pH del suelo</p>
                      <p className="text-sm font-medium">{selectedParcela.ph_suelo}</p>
                    </div>
                  </div>
                )}

                {selectedParcela.altitud_msnm && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
                      <Mountain className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Altitud</p>
                      <p className="text-sm font-medium">{selectedParcela.altitud_msnm} msnm</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-50 p-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Coordenadas</p>
                    <p className="text-sm font-medium">
                      {selectedParcela.ubicacion.latitud.toFixed(4)}, {selectedParcela.ubicacion.longitud.toFixed(4)}
                    </p>
                  </div>
                </div>
                {!isAgricultor && selectedParcela.agricultor && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                      {selectedParcela.agricultor.usuario?.nombre?.[0]}{selectedParcela.agricultor.usuario?.apellido?.[0]}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Agricultor</p>
                      <p className="text-sm font-medium">
                        {selectedParcela.agricultor.usuario?.nombre} {selectedParcela.agricultor.usuario?.apellido}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedParcela.agricultor.municipio}, {selectedParcela.agricultor.departamento}
                      </p>
                    </div>
                  </div>
                )}

                {isAgricultor && (
                  <div className="mt-4 flex gap-2">
                    <a
                      href={`/parcels/${selectedParcela.parcela_id}`}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                    >
                      Ver detalle
                      <ChevronRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl border bg-card text-sm text-muted-foreground">
              Selecciona una parcela en el mapa
            </div>
          )}

          {/* List */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b px-5 py-3.5">
              <span className="text-sm font-medium">Lista de parcelas</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto divide-y">
              {parcelas && parcelas.length > 0 ? (
                parcelas.map((parcela) => (
                  <button
                    key={parcela.parcela_id}
                    onClick={() => setSelectedParcela(parcela)}
                    className={`flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-accent/50 ${
                      selectedParcela?.parcela_id === parcela.parcela_id ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <div>
                      <p className="text-[13px] font-medium">{parcela.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {parcela.area_hectareas} ha
                        {parcela.tipo_suelo && ` · ${tipoSueloLabel[parcela.tipo_suelo] || parcela.tipo_suelo}`}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))
              ) : (
                <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                  No hay parcelas registradas
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
