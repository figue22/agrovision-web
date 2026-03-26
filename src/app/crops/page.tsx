'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sprout, Plus, Pencil, Trash2, Loader2, X, Calendar, Leaf } from 'lucide-react';
import { cultivosService, CultivoParcelaResponse } from '@/services/cultivos.service';
import { parcelasService } from '@/services/parcelas.service';
import { useAuthStore } from '@/store/auth-store';

const estadoStyle: Record<string, { bg: string; text: string; label: string }> = {
  planificado: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Planificado' },
  activo: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Activo' },
  cosechado: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Cosechado' },
  fallido: { bg: 'bg-red-50', text: 'text-red-700', label: 'Fallido' },
  abandonado: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Abandonado' },
};

const createSchema = z.object({
  parcela_id: z.string().min(1, 'Selecciona una parcela'),
  tipo_cultivo_id: z.string().min(1, 'Selecciona un tipo de cultivo'),
  fecha_siembra: z.string().min(1, 'Fecha de siembra requerida'),
  fecha_cosecha_esperada: z.string().optional(),
  area_sembrada_ha: z.union([z.number().min(0.01), z.nan()]).optional(),
  rendimiento_esperado_ton: z.union([z.number().min(0), z.nan()]).optional(),
  estado: z.string().optional(),
  temporada: z.string().optional(),
  notas: z.string().optional(),
});

const updateSchema = z.object({
  fecha_cosecha_esperada: z.string().optional(),
  fecha_cosecha_real: z.string().optional(),
  area_sembrada_ha: z.union([z.number().min(0.01), z.nan()]).optional(),
  rendimiento_esperado_ton: z.union([z.number().min(0), z.nan()]).optional(),
  rendimiento_real_ton: z.union([z.number().min(0), z.nan()]).optional(),
  estado: z.string().optional(),
  temporada: z.string().optional(),
  notas: z.string().optional(),
});

const inputClass = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200";

export default function CropsPage() {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();
  const isAgricultor = usuario?.rol === 'agricultor';
  const canEdit = isAgricultor || usuario?.rol === 'admin';
  const [showCreate, setShowCreate] = useState(false);
  const [editingCultivo, setEditingCultivo] = useState<CultivoParcelaResponse | null>(null);
  const [error, setError] = useState('');

  const { data: cultivos, isLoading } = useQuery({
    queryKey: ['cultivos', usuario?.usuario_id],
    queryFn: isAgricultor ? cultivosService.getMyCultivos : cultivosService.getAll,
  });

  const { data: parcelas } = useQuery({
    queryKey: ['parcelas-select', usuario?.usuario_id],
    queryFn: isAgricultor ? parcelasService.getMyParcelas : parcelasService.getAll,
    enabled: showCreate,
  });

  const { data: tipos } = useQuery({
    queryKey: ['tipos-cultivo'],
    queryFn: cultivosService.getTiposCultivo,
    enabled: showCreate,
  });

  const createForm = useForm({ resolver: zodResolver(createSchema) });
  const updateForm = useForm({ resolver: zodResolver(updateSchema) });

  const createMutation = useMutation({
    mutationFn: (data: any) => cultivosService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cultivos'] }); setShowCreate(false); createForm.reset(); setError(''); },
    onError: (err: any) => setError(err.response?.data?.message || 'Error al crear cultivo'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => cultivosService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cultivos'] }); setEditingCultivo(null); updateForm.reset(); setError(''); },
    onError: (err: any) => setError(err.response?.data?.message || 'Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cultivosService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cultivos'] }),
  });

  const onCreate = (data: any) => {
    createMutation.mutate({
      parcela_id: data.parcela_id,
      tipo_cultivo_id: data.tipo_cultivo_id,
      fecha_siembra: data.fecha_siembra,
      fecha_cosecha_esperada: data.fecha_cosecha_esperada || undefined,
      area_sembrada_ha: data.area_sembrada_ha && !isNaN(data.area_sembrada_ha) ? data.area_sembrada_ha : undefined,
      rendimiento_esperado_ton: data.rendimiento_esperado_ton && !isNaN(data.rendimiento_esperado_ton) ? data.rendimiento_esperado_ton : undefined,
      estado: data.estado || undefined,
      temporada: data.temporada || undefined,
      notas: data.notas || undefined,
    });
  };

  const onUpdate = (data: any) => {
    if (!editingCultivo) return;
    const clean: any = {};
    if (data.estado) clean.estado = data.estado;
    if (data.fecha_cosecha_esperada) clean.fecha_cosecha_esperada = data.fecha_cosecha_esperada;
    if (data.fecha_cosecha_real) clean.fecha_cosecha_real = data.fecha_cosecha_real;
    if (data.area_sembrada_ha && !isNaN(data.area_sembrada_ha)) clean.area_sembrada_ha = data.area_sembrada_ha;
    if (data.rendimiento_esperado_ton && !isNaN(data.rendimiento_esperado_ton)) clean.rendimiento_esperado_ton = data.rendimiento_esperado_ton;
    if (data.rendimiento_real_ton && !isNaN(data.rendimiento_real_ton)) clean.rendimiento_real_ton = data.rendimiento_real_ton;
    if (data.temporada) clean.temporada = data.temporada;
    if (data.notas !== undefined) clean.notas = data.notas;
    updateMutation.mutate({ id: editingCultivo.cultivo_parcela_id, data: clean });
  };

  const openEdit = (c: CultivoParcelaResponse) => {
    setEditingCultivo(c);
    updateForm.reset({
      estado: c.estado, fecha_cosecha_esperada: c.fecha_cosecha_esperada || '', fecha_cosecha_real: c.fecha_cosecha_real || '',
      area_sembrada_ha: c.area_sembrada_ha, rendimiento_esperado_ton: c.rendimiento_esperado_ton, rendimiento_real_ton: c.rendimiento_real_ton,
      temporada: c.temporada || '', notas: c.notas || '',
    });
    setError('');
  };

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{isAgricultor ? 'Mis Cultivos' : 'Cultivos'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{cultivos?.length || 0} cultivos registrados</p>
        </div>
        {canEdit && <button onClick={() => { setShowCreate(true); setError(''); }} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> Nuevo cultivo</button>}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Create */}
      {showCreate && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Registrar cultivo</h2><button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button></div>
          <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Parcela</label>
                <select {...createForm.register('parcela_id')} className={inputClass}><option value="">Seleccionar parcela...</option>{parcelas?.map((p) => <option key={p.parcela_id} value={p.parcela_id}>{p.nombre} ({p.area_hectareas} ha)</option>)}</select>
                {createForm.formState.errors.parcela_id && <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.parcela_id.message as string}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Tipo de cultivo</label>
                <select {...createForm.register('tipo_cultivo_id')} className={inputClass}><option value="">Seleccionar cultivo...</option>{tipos?.map((t) => <option key={t.tipo_cultivo_id} value={t.tipo_cultivo_id}>{t.nombre}{t.nombre_cientifico && ` (${t.nombre_cientifico})`}</option>)}</select>
                {createForm.formState.errors.tipo_cultivo_id && <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.tipo_cultivo_id.message as string}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Fecha de siembra</label>
                <input {...createForm.register('fecha_siembra')} type="date" className={inputClass} />
                {createForm.formState.errors.fecha_siembra && <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.fecha_siembra.message as string}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Cosecha esperada <span className="text-xs text-muted-foreground">(opc, se auto-calcula)</span></label>
                <input {...createForm.register('fecha_cosecha_esperada')} type="date" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Área (ha) <span className="text-xs text-muted-foreground">(opc)</span></label>
                <input {...createForm.register('area_sembrada_ha', { valueAsNumber: true })} type="number" step="0.01" className={inputClass} placeholder="2.5" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Rend. esp. (ton) <span className="text-xs text-muted-foreground">(opc)</span></label>
                <input {...createForm.register('rendimiento_esperado_ton', { valueAsNumber: true })} type="number" step="0.1" className={inputClass} placeholder="4.0" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Estado</label>
                <select {...createForm.register('estado')} className={inputClass}><option value="planificado">Planificado</option><option value="activo">Activo</option></select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Temporada <span className="text-xs text-muted-foreground">(opc)</span></label>
                <input {...createForm.register('temporada')} className={inputClass} placeholder="2026-A" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Notas <span className="text-xs text-muted-foreground">(opcional)</span></label>
              <input {...createForm.register('notas')} className={inputClass} placeholder="Semilla certificada, observaciones..." />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="h-10 rounded-lg border px-4 text-sm font-medium hover:bg-accent">Cancelar</button>
              <button type="submit" disabled={createMutation.isPending} className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sprout className="h-4 w-4" />} Registrar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit */}
      {editingCultivo && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Editar: {editingCultivo.tipoCultivo?.nombre} en {editingCultivo.parcela?.nombre}</h2><button onClick={() => setEditingCultivo(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button></div>
          <form onSubmit={updateForm.handleSubmit(onUpdate)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><label className="mb-1.5 block text-sm font-medium">Estado</label><select {...updateForm.register('estado')} className={inputClass}><option value="planificado">Planificado</option><option value="activo">Activo</option><option value="cosechado">Cosechado</option><option value="fallido">Fallido</option><option value="abandonado">Abandonado</option></select></div>
              <div><label className="mb-1.5 block text-sm font-medium">Cosecha esperada</label><input {...updateForm.register('fecha_cosecha_esperada')} type="date" className={inputClass} /></div>
              <div><label className="mb-1.5 block text-sm font-medium">Cosecha real</label><input {...updateForm.register('fecha_cosecha_real')} type="date" className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="mb-1.5 block text-sm font-medium">Área (ha)</label><input {...updateForm.register('area_sembrada_ha', { valueAsNumber: true })} type="number" step="0.01" className={inputClass} /></div>
              <div><label className="mb-1.5 block text-sm font-medium">Rend. esperado (ton)</label><input {...updateForm.register('rendimiento_esperado_ton', { valueAsNumber: true })} type="number" step="0.1" className={inputClass} /></div>
              <div><label className="mb-1.5 block text-sm font-medium">Rend. real (ton)</label><input {...updateForm.register('rendimiento_real_ton', { valueAsNumber: true })} type="number" step="0.1" className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="mb-1.5 block text-sm font-medium">Temporada</label><input {...updateForm.register('temporada')} className={inputClass} /></div>
              <div><label className="mb-1.5 block text-sm font-medium">Notas</label><input {...updateForm.register('notas')} className={inputClass} /></div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setEditingCultivo(null)} className="h-10 rounded-lg border px-4 text-sm font-medium hover:bg-accent">Cancelar</button>
              <button type="submit" disabled={updateMutation.isPending} className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">{updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />} Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="divide-y">
          {cultivos && cultivos.length > 0 ? cultivos.map((c) => {
            const est = estadoStyle[c.estado] || estadoStyle.planificado;
            const dias = c.fecha_cosecha_esperada ? Math.ceil((new Date(c.fecha_cosecha_esperada).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
            return (
              <div key={c.cultivo_parcela_id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-green-50 p-2 text-green-600"><Leaf className="h-4 w-4" /></div>
                  <div>
                    <p className="text-sm font-medium">{c.tipoCultivo?.nombre || 'Cultivo'}{c.tipoCultivo?.nombre_cientifico && <span className="ml-1.5 text-xs italic text-muted-foreground">({c.tipoCultivo.nombre_cientifico})</span>}</p>
                    <p className="text-xs text-muted-foreground">{c.parcela?.nombre || 'Parcela'}{c.area_sembrada_ha && ` · ${c.area_sembrada_ha} ha`} · Siembra: {new Date(c.fecha_siembra).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${est.bg} ${est.text}`}>{est.label}</span>
                      {dias !== null && dias > 0 && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Calendar className="h-3 w-3" /> {dias} días para cosecha</span>}
                      {c.rendimiento_real_ton && <span className="text-[11px] font-medium text-emerald-600">Rend: {c.rendimiento_real_ton} ton</span>}
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground" title="Editar"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => { if (confirm('¿Eliminar este cultivo?')) deleteMutation.mutate(c.cultivo_parcela_id); }} className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground"><Sprout className="h-8 w-8 text-muted-foreground/30" />No hay cultivos registrados</div>
          )}
        </div>
      </div>
    </div>
  );
}
