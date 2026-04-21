'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MapPin, Plus, Layers, Mountain, Droplets, Ruler, ChevronRight, Loader2,
  Pencil, Trash2, X, Check, Search, Filter, BarChart3, Users,
} from 'lucide-react';
import { ParcelaMapDynamic } from '@/components/maps';
import { parcelasService, ParcelaResponse } from '@/services/parcelas.service';
import { cultivosService, CultivoParcelaResponse } from '@/services/cultivos.service';
import { useAuthStore } from '@/store/auth-store';

const tipoSueloLabel: Record<string, string> = { arcilloso: 'Arcilloso', arenoso: 'Arenoso', limoso: 'Limoso', franco: 'Franco', mixto: 'Mixto' };
const estadoLabel: Record<string, string> = { planificado: 'Planificado', activo: 'Activo', cosechado: 'Cosechado', fallido: 'Fallido', abandonado: 'Abandonado' };
const estadoColor: Record<string, string> = { planificado: 'bg-blue-50 text-blue-700', activo: 'bg-emerald-50 text-emerald-700', cosechado: 'bg-amber-50 text-amber-700', fallido: 'bg-red-50 text-red-700', abandonado: 'bg-gray-100 text-gray-700' };

const editSchema = z.object({
  nombre: z.string().min(2).optional(),
  area_hectareas: z.union([z.number().min(0.01), z.nan()]).optional(),
  tipo_suelo: z.string().optional(),
  ph_suelo: z.union([z.number().min(0).max(14), z.nan()]).optional(),
  altitud_msnm: z.union([z.number().min(0), z.nan()]).optional(),
});

const inputClass = "h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200";

export default function ParcelsPage() {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedParcela, setSelectedParcela] = useState<ParcelaResponse | null>(null);
  const [editingParcela, setEditingParcela] = useState<ParcelaResponse | null>(null);
  const [error, setError] = useState('');
  const isAgricultor = usuario?.rol === 'agricultor';
  const isRegional = !isAgricultor; // técnico o admin

  // Filtros regionales
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgricultor, setFilterAgricultor] = useState('');
  const [filterCultivo, setFilterCultivo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const { data: parcelas, isLoading } = useQuery({
    queryKey: ['parcelas', usuario?.usuario_id],
    queryFn: isAgricultor ? parcelasService.getMyParcelas : parcelasService.getAll,
  });

  // Cargar cultivos para filtros (solo técnico/admin)
  const { data: cultivos } = useQuery({
    queryKey: ['cultivos-regional', usuario?.usuario_id],
    queryFn: cultivosService.getAll,
    enabled: isRegional,
  });

  const editForm = useForm({ resolver: zodResolver(editSchema) });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => parcelasService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['parcelas'] }); setEditingParcela(null); setSelectedParcela(null); setError(''); },
    onError: (err: any) => setError(err.response?.data?.message || 'Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => parcelasService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['parcelas'] }); setSelectedParcela(null); },
  });

  const openEdit = (parcela: ParcelaResponse) => {
    setEditingParcela(parcela);
    editForm.reset({ nombre: parcela.nombre, area_hectareas: parcela.area_hectareas, tipo_suelo: parcela.tipo_suelo || '', ph_suelo: parcela.ph_suelo, altitud_msnm: parcela.altitud_msnm });
    setError('');
  };

  const onEdit = (data: any) => {
    if (!editingParcela) return;
    const clean: any = {};
    if (data.nombre) clean.nombre = data.nombre;
    if (data.area_hectareas && !isNaN(data.area_hectareas)) clean.area_hectareas = data.area_hectareas;
    if (data.tipo_suelo) clean.tipo_suelo = data.tipo_suelo;
    if (data.ph_suelo && !isNaN(data.ph_suelo)) clean.ph_suelo = data.ph_suelo;
    if (data.altitud_msnm && !isNaN(data.altitud_msnm)) clean.altitud_msnm = data.altitud_msnm;
    updateMutation.mutate({ id: editingParcela.parcela_id, data: clean });
  };

  // Datos para filtros
  const agricultoresUnicos = useMemo(() => {
    if (!parcelas) return [];
    const map = new Map<string, string>();
    parcelas.forEach((p) => {
      if (p.agricultor?.usuario) {
        map.set(p.agricultor_id, `${p.agricultor.usuario.nombre} ${p.agricultor.usuario.apellido}`);
      }
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [parcelas]);

  const cultivosUnicos = useMemo(() => {
    if (!cultivos) return [];
    const map = new Map<string, string>();
    cultivos.forEach((c) => {
      if (c.tipoCultivo) map.set(c.tipoCultivo.tipo_cultivo_id, c.tipoCultivo.nombre);
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [cultivos]);

  // Parcelas IDs que tienen el cultivo/estado seleccionado
  const parcelaIdsConCultivo = useMemo(() => {
    if (!cultivos || (!filterCultivo && !filterEstado)) return null;
    return new Set(
      cultivos
        .filter((c) => {
          const matchCultivo = !filterCultivo || c.tipo_cultivo_id === filterCultivo;
          const matchEstado = !filterEstado || c.estado === filterEstado;
          return matchCultivo && matchEstado;
        })
        .map((c) => c.parcela_id),
    );
  }, [cultivos, filterCultivo, filterEstado]);

  // Filtrar parcelas
  const filteredParcelas = useMemo(() => {
    if (!parcelas) return [];
    return parcelas.filter((p) => {
      const matchSearch = !searchTerm || p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchAgricultor = !filterAgricultor || p.agricultor_id === filterAgricultor;
      const matchCultivo = !parcelaIdsConCultivo || parcelaIdsConCultivo.has(p.parcela_id);
      return matchSearch && matchAgricultor && matchCultivo;
    });
  }, [parcelas, searchTerm, filterAgricultor, parcelaIdsConCultivo]);

  // Métricas
  const totalHectareas = filteredParcelas.reduce((sum, p) => sum + Number(p.area_hectareas), 0);
  const cultivosPorTipo = useMemo(() => {
    if (!cultivos) return [];
    const map = new Map<string, number>();
    const parcelaIds = new Set(filteredParcelas.map((p) => p.parcela_id));
    cultivos
      .filter((c) => parcelaIds.has(c.parcela_id) && (c.estado === 'activo' || c.estado === 'planificado'))
      .forEach((c) => {
        const nombre = c.tipoCultivo?.nombre || 'Otro';
        map.set(nombre, (map.get(nombre) || 0) + 1);
      });
    return Array.from(map.entries()).map(([nombre, count]) => ({ nombre, count })).sort((a, b) => b.count - a.count);
  }, [cultivos, filteredParcelas]);

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{isAgricultor ? 'Mis Parcelas' : 'Vista Regional — Parcelas'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredParcelas.length}{filteredParcelas.length !== (parcelas?.length || 0) ? ` de ${parcelas?.length}` : ''} parcelas
            {isRegional && usuario?.rol === 'tecnico' && ' (de tus agricultores asignados)'}
          </p>
        </div>
        {isAgricultor && (
          <a href="/parcels/new" className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Nueva parcela
          </a>
        )}
      </div>

      {/* Métricas regionales (solo técnico/admin) */}
      {isRegional && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-4">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Parcelas</span>
            <p className="mt-1 text-2xl font-semibold">{filteredParcelas.length}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Hectáreas totales</span>
            <p className="mt-1 text-2xl font-semibold">{totalHectareas.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">ha</span></p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Agricultores</span>
            <p className="mt-1 text-2xl font-semibold">{agricultoresUnicos.length}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Distribución cultivos</span>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {cultivosPorTipo.length > 0 ? cultivosPorTipo.slice(0, 4).map((c) => (
                <span key={c.nombre} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  {c.nombre}: {c.count}
                </span>
              )) : <span className="text-xs text-muted-foreground">Sin cultivos</span>}
            </div>
          </div>
        </div>
      )}

      {/* Filtros regionales (solo técnico/admin) */}
      {isRegional && (
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200" placeholder="Buscar parcela..." />
          </div>
          <select value={filterAgricultor} onChange={(e) => setFilterAgricultor(e.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm outline-none">
            <option value="">Todos los agricultores</option>
            {agricultoresUnicos.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          <select value={filterCultivo} onChange={(e) => setFilterCultivo(e.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm outline-none">
            <option value="">Todos los cultivos</option>
            {cultivosUnicos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm outline-none">
            <option value="">Todos los estados</option>
            <option value="planificado">Planificado</option>
            <option value="activo">Activo</option>
            <option value="cosechado">Cosechado</option>
            <option value="fallido">Fallido</option>
          </select>
          {(searchTerm || filterAgricultor || filterCultivo || filterEstado) && (
            <button onClick={() => { setSearchTerm(''); setFilterAgricultor(''); setFilterCultivo(''); setFilterEstado(''); }} className="h-10 rounded-lg border px-3 text-sm text-muted-foreground hover:bg-accent">
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Map + Panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ParcelaMapDynamic parcelas={filteredParcelas} selectedId={selectedParcela?.parcela_id} onSelectParcela={setSelectedParcela} height="520px" />
        </div>

        <div className="flex flex-col gap-4">
          {/* Edit form */}
          {editingParcela ? (
            <div className="rounded-xl border bg-card shadow-sm">
              <div className="border-b px-5 py-4">
                <div className="flex items-center justify-between"><h2 className="font-semibold">Editar parcela</h2><button onClick={() => setEditingParcela(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button></div>
              </div>
              <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-3 p-5">
                <div><label className="mb-1 block text-xs font-medium">Nombre</label><input {...editForm.register('nombre')} className={inputClass} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="mb-1 block text-xs font-medium">Área (ha)</label><input {...editForm.register('area_hectareas', { valueAsNumber: true })} type="number" step="0.01" className={inputClass} /></div>
                  <div><label className="mb-1 block text-xs font-medium">Tipo suelo</label><select {...editForm.register('tipo_suelo')} className={inputClass}><option value="">—</option><option value="arcilloso">Arcilloso</option><option value="arenoso">Arenoso</option><option value="limoso">Limoso</option><option value="franco">Franco</option><option value="mixto">Mixto</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="mb-1 block text-xs font-medium">pH</label><input {...editForm.register('ph_suelo', { valueAsNumber: true })} type="number" step="0.1" className={inputClass} /></div>
                  <div><label className="mb-1 block text-xs font-medium">Altitud msnm</label><input {...editForm.register('altitud_msnm', { valueAsNumber: true })} type="number" className={inputClass} /></div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setEditingParcela(null)} className="flex h-9 flex-1 items-center justify-center rounded-lg border text-sm font-medium hover:bg-accent">Cancelar</button>
                  <button type="submit" disabled={updateMutation.isPending} className="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">{updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Guardar</button>
                </div>
              </form>
            </div>
          ) : selectedParcela ? (
            <div className="rounded-xl border bg-card shadow-sm">
              <div className="border-b px-5 py-4">
                <div className="flex items-center justify-between"><h2 className="font-semibold">{selectedParcela.nombre}</h2><button onClick={() => setSelectedParcela(null)} className="text-xs text-muted-foreground hover:text-foreground">Cerrar</button></div>
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-3"><div className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><Ruler className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Área</p><p className="text-sm font-medium">{selectedParcela.area_hectareas} hectáreas</p></div></div>
                {selectedParcela.tipo_suelo && <div className="flex items-center gap-3"><div className="rounded-lg bg-amber-50 p-2 text-amber-600"><Layers className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Tipo de suelo</p><p className="text-sm font-medium">{tipoSueloLabel[selectedParcela.tipo_suelo] || selectedParcela.tipo_suelo}</p></div></div>}
                {selectedParcela.ph_suelo && <div className="flex items-center gap-3"><div className="rounded-lg bg-blue-50 p-2 text-blue-600"><Droplets className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">pH del suelo</p><p className="text-sm font-medium">{selectedParcela.ph_suelo}</p></div></div>}
                {selectedParcela.altitud_msnm && <div className="flex items-center gap-3"><div className="rounded-lg bg-violet-50 p-2 text-violet-600"><Mountain className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Altitud</p><p className="text-sm font-medium">{selectedParcela.altitud_msnm} msnm</p></div></div>}
                <div className="flex items-center gap-3"><div className="rounded-lg bg-gray-50 p-2 text-gray-600"><MapPin className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Coordenadas</p><p className="text-sm font-medium">{selectedParcela.ubicacion.latitud.toFixed(4)}, {selectedParcela.ubicacion.longitud.toFixed(4)}</p></div></div>

                {/* Cultivos de esta parcela */}
                {isRegional && cultivos && (() => {
                  const cultivosDeParcela = cultivos.filter((c) => c.parcela_id === selectedParcela.parcela_id && (c.estado === 'activo' || c.estado === 'planificado'));
                  return cultivosDeParcela.length > 0 ? (
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">Cultivos activos</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cultivosDeParcela.map((c) => (
                          <span key={c.cultivo_parcela_id} className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${estadoColor[c.estado] || ''}`}>
                            {c.tipoCultivo?.nombre} · {estadoLabel[c.estado]}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Agricultor info */}
                {isRegional && selectedParcela.agricultor && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">{selectedParcela.agricultor.usuario?.nombre?.[0]}{selectedParcela.agricultor.usuario?.apellido?.[0]}</div>
                    <div>
                      <p className="text-xs text-muted-foreground">Agricultor</p>
                      <p className="text-sm font-medium">{selectedParcela.agricultor.usuario?.nombre} {selectedParcela.agricultor.usuario?.apellido}</p>
                      <p className="text-[11px] text-muted-foreground">{selectedParcela.agricultor.municipio}, {selectedParcela.agricultor.departamento}</p>
                    </div>
                  </div>
                )}

                {(isAgricultor || usuario?.rol === 'admin') && (
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => openEdit(selectedParcela)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"><Pencil className="h-3.5 w-3.5" /> Editar</button>
                    <button onClick={() => { if (confirm('¿Eliminar esta parcela? Se eliminarán también sus cultivos.')) deleteMutation.mutate(selectedParcela.parcela_id); }} className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-background px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Eliminar</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl border bg-card text-sm text-muted-foreground">Selecciona una parcela en el mapa</div>
          )}

          {/* List */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b px-5 py-3.5"><span className="text-sm font-medium">Lista de parcelas</span></div>
            <div className="max-h-[300px] overflow-y-auto divide-y">
              {filteredParcelas.length > 0 ? filteredParcelas.map((p) => (
                <button key={p.parcela_id} onClick={() => { setSelectedParcela(p); setEditingParcela(null); }}
                  className={`flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-accent/50 ${selectedParcela?.parcela_id === p.parcela_id ? 'bg-emerald-50' : ''}`}>
                  <div>
                    <p className="text-[13px] font-medium">{p.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.area_hectareas} ha{p.tipo_suelo && ` · ${tipoSueloLabel[p.tipo_suelo] || p.tipo_suelo}`}
                      {isRegional && p.agricultor?.usuario && ` · ${p.agricultor.usuario.nombre} ${p.agricultor.usuario.apellido}`}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              )) : (
                <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                  {parcelas && parcelas.length > 0 ? 'No hay parcelas que coincidan con los filtros' : 'No hay parcelas registradas'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
