'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClipboardList, Plus, Trash2, Loader2, X, DollarSign, Package } from 'lucide-react';
import { activitiesService, ActividadResponse } from '@/services/activities.service';
import { parcelasService } from '@/services/parcelas.service';
import { useAuthStore } from '@/store/auth-store';

const createSchema = z.object({
  parcela_id: z.string().min(1, 'Selecciona una parcela'),
  tipo_actividad_id: z.coerce.number().min(1, 'Selecciona un tipo'),
  descripcion: z.string().optional(),
  cantidad: z.coerce.number().optional(),
  unidad: z.string().optional(),
  costo_cop: z.coerce.number().optional(),
  fecha_realizacion: z.string().min(1, 'Fecha requerida'),
  notas: z.string().optional(),
});

const inputClass = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200";

export default function ActivitiesPage() {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedParcela, setSelectedParcela] = useState('');
  const [error, setError] = useState('');

  const { data: parcelas } = useQuery({
    queryKey: ['parcelas-select'],
    queryFn: usuario?.rol === 'agricultor' ? parcelasService.getMyParcelas : parcelasService.getAll,
  });

  const { data: actividades, isLoading } = useQuery({
    queryKey: ['actividades', selectedParcela],
    queryFn: () => activitiesService.getByParcela(selectedParcela),
    enabled: !!selectedParcela,
  });

  const { data: resumen } = useQuery({
    queryKey: ['actividades-resumen', selectedParcela],
    queryFn: () => activitiesService.getResumen(selectedParcela),
    enabled: !!selectedParcela,
  });

  const form = useForm({ resolver: zodResolver(createSchema) });

  const createMutation = useMutation({
    mutationFn: (data: any) => activitiesService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['actividades'] }); queryClient.invalidateQueries({ queryKey: ['actividades-resumen'] }); setShowCreate(false); form.reset(); setError(''); },
    onError: (err: any) => setError(err.response?.data?.message || 'Error al crear actividad'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => activitiesService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['actividades'] }); queryClient.invalidateQueries({ queryKey: ['actividades-resumen'] }); },
  });

  const onCreate = (data: any) => {
    createMutation.mutate({
      parcela_id: data.parcela_id,
      tipo_actividad_id: data.tipo_actividad_id,
      descripcion: data.descripcion || undefined,
      cantidad: data.cantidad || undefined,
      unidad: data.unidad || undefined,
      costo_cop: data.costo_cop || undefined,
      fecha_realizacion: data.fecha_realizacion,
      notas: data.notas || undefined,
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bitácora de Actividades</h1>
          <p className="mt-1 text-sm text-muted-foreground">Registro de actividades agrícolas e insumos</p>
        </div>
        {selectedParcela && (
          <button onClick={() => { setShowCreate(true); setError(''); form.setValue('parcela_id', selectedParcela); }} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Nueva actividad
          </button>
        )}
      </div>

      {/* Selector de parcela */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <label className="mb-1.5 block text-sm font-medium">Selecciona una parcela</label>
        <select value={selectedParcela} onChange={(e) => setSelectedParcela(e.target.value)} className={inputClass}>
          <option value="">-- Seleccionar parcela --</option>
          {parcelas?.map((p) => <option key={p.parcela_id} value={p.parcela_id}>{p.nombre} ({p.area_hectareas} ha)</option>)}
        </select>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Total actividades</p>
            <p className="text-2xl font-bold text-emerald-600">{resumen.total_actividades}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Costo total</p>
            <p className="text-2xl font-bold text-emerald-600">${resumen.costo_total_cop?.toLocaleString('es-CO')}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Por tipo</p>
            <div className="mt-1 space-y-1">{resumen.por_tipo?.map((t) => <p key={t.tipo} className="text-xs">{t.tipo}: <span className="font-medium">{t.cantidad}</span></p>)}</div>
          </div>
        </div>
      )}

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Formulario crear */}
      {showCreate && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Registrar actividad</h2><button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button></div>
          <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
            <input type="hidden" {...form.register('parcela_id')} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Tipo de actividad (ID catálogo)</label>
                <input {...form.register('tipo_actividad_id')} type="number" className={inputClass} placeholder="1" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Fecha</label>
                <input {...form.register('fecha_realizacion')} type="date" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Descripción</label>
              <input {...form.register('descripcion')} className={inputClass} placeholder="Ej: Fertilización foliar con urea" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="mb-1.5 block text-sm font-medium">Cantidad</label><input {...form.register('cantidad')} type="number" step="0.1" className={inputClass} /></div>
              <div><label className="mb-1.5 block text-sm font-medium">Unidad</label><input {...form.register('unidad')} className={inputClass} placeholder="kg, litros..." /></div>
              <div><label className="mb-1.5 block text-sm font-medium">Costo (COP)</label><input {...form.register('costo_cop')} type="number" className={inputClass} /></div>
            </div>
            <div><label className="mb-1.5 block text-sm font-medium">Notas</label><input {...form.register('notas')} className={inputClass} placeholder="Observaciones..." /></div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="h-10 rounded-lg border px-4 text-sm font-medium hover:bg-accent">Cancelar</button>
              <button type="submit" disabled={createMutation.isPending} className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />} Registrar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {!selectedParcela ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border bg-card text-sm text-muted-foreground shadow-sm"><ClipboardList className="h-8 w-8 text-muted-foreground/30" />Selecciona una parcela para ver sus actividades</div>
      ) : isLoading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="divide-y">
            {actividades && actividades.length > 0 ? actividades.map((a) => (
              <div key={a.actividad_id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600"><ClipboardList className="h-4 w-4" /></div>
                  <div>
                    <p className="text-sm font-medium">{a.tipoActividad?.nombre || `Tipo ${a.tipo_actividad_id}`}</p>
                    <p className="text-xs text-muted-foreground">{a.descripcion || 'Sin descripción'} · {new Date(a.fecha_realizacion).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <div className="mt-1 flex items-center gap-3">
                      {a.costo_cop && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><DollarSign className="h-3 w-3" />${Number(a.costo_cop).toLocaleString('es-CO')}</span>}
                      {a.insumos && a.insumos.length > 0 && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Package className="h-3 w-3" />{a.insumos.length} insumos</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => { if (confirm('¿Eliminar esta actividad?')) deleteMutation.mutate(a.actividad_id); }} className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            )) : (
              <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground"><ClipboardList className="h-8 w-8 text-muted-foreground/30" />No hay actividades registradas</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}