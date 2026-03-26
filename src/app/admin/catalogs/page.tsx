'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, Loader2, X, Leaf } from 'lucide-react';
import { cultivosService, TipoCultivoResponse } from '@/services/cultivos.service';

const inputClass = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200";

export default function AdminCatalogsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<TipoCultivoResponse | null>(null);
  const [error, setError] = useState('');

  const { data: tipos, isLoading } = useQuery({ queryKey: ['tipos-cultivo'], queryFn: cultivosService.getTiposCultivo });

  const createForm = useForm();
  const editForm = useForm();

  const createMutation = useMutation({
    mutationFn: (data: any) => cultivosService.createTipoCultivo(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tipos-cultivo'] }); setShowCreate(false); createForm.reset(); setError(''); },
    onError: (err: any) => setError(err.response?.data?.message || 'Error al crear'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => cultivosService.updateTipoCultivo(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tipos-cultivo'] }); setEditing(null); editForm.reset(); setError(''); },
    onError: (err: any) => setError(err.response?.data?.message || 'Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cultivosService.deleteTipoCultivo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tipos-cultivo'] }),
  });

  const cleanNumber = (val: any) => val && !isNaN(val) ? Number(val) : undefined;

  const onCreate = (data: any) => {
    createMutation.mutate({
      nombre: data.nombre,
      nombre_cientifico: data.nombre_cientifico || undefined,
      categoria: data.categoria || undefined,
      dias_crecimiento_prom: cleanNumber(data.dias_crecimiento_prom),
      temp_optima_min: cleanNumber(data.temp_optima_min),
      temp_optima_max: cleanNumber(data.temp_optima_max),
      altitud_optima_min: cleanNumber(data.altitud_optima_min),
      altitud_optima_max: cleanNumber(data.altitud_optima_max),
      ph_optimo_min: cleanNumber(data.ph_optimo_min),
      ph_optimo_max: cleanNumber(data.ph_optimo_max),
      req_agua: data.req_agua || undefined,
    });
  };

  const onUpdate = (data: any) => {
    if (!editing) return;
    updateMutation.mutate({
      id: editing.tipo_cultivo_id,
      data: {
        nombre: data.nombre || undefined,
        nombre_cientifico: data.nombre_cientifico || undefined,
        categoria: data.categoria || undefined,
        dias_crecimiento_prom: cleanNumber(data.dias_crecimiento_prom),
        temp_optima_min: cleanNumber(data.temp_optima_min),
        temp_optima_max: cleanNumber(data.temp_optima_max),
        altitud_optima_min: cleanNumber(data.altitud_optima_min),
        altitud_optima_max: cleanNumber(data.altitud_optima_max),
        ph_optimo_min: cleanNumber(data.ph_optimo_min),
        ph_optimo_max: cleanNumber(data.ph_optimo_max),
        req_agua: data.req_agua || undefined,
      },
    });
  };

  const openEdit = (t: TipoCultivoResponse) => {
    setEditing(t);
    editForm.reset({
      nombre: t.nombre, nombre_cientifico: t.nombre_cientifico || '', categoria: t.categoria || '',
      dias_crecimiento_prom: t.dias_crecimiento_prom, temp_optima_min: t.temp_optima_min, temp_optima_max: t.temp_optima_max,
      altitud_optima_min: t.altitud_optima_min, altitud_optima_max: t.altitud_optima_max,
      ph_optimo_min: t.ph_optimo_min, ph_optimo_max: t.ph_optimo_max, req_agua: t.req_agua || '',
    });
    setError('');
  };

  const CultivoForm = ({ form, onSubmit, submitLabel, isPending, onCancel }: any) => (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div><label className="mb-1.5 block text-sm font-medium">Nombre</label><input {...form.register('nombre')} className={inputClass} placeholder="Café arábica" /></div>
        <div><label className="mb-1.5 block text-sm font-medium">Nombre científico <span className="text-xs text-muted-foreground">(opc)</span></label><input {...form.register('nombre_cientifico')} className={inputClass} placeholder="Coffea arabica" /></div>
        <div><label className="mb-1.5 block text-sm font-medium">Categoría <span className="text-xs text-muted-foreground">(opc)</span></label><select {...form.register('categoria')} className={inputClass}><option value="">Seleccionar...</option><option value="cereal">Cereal</option><option value="legumbre">Legumbre</option><option value="hortaliza">Hortaliza</option><option value="fruta">Fruta</option><option value="tuberculo">Tubérculo</option></select></div>
      </div>
      <div className="grid grid-cols-5 gap-3">
        <div><label className="mb-1.5 block text-xs font-medium">Días crecim.</label><input {...form.register('dias_crecimiento_prom', { valueAsNumber: true })} type="number" className={inputClass} placeholder="365" /></div>
        <div><label className="mb-1.5 block text-xs font-medium">Temp mín °C</label><input {...form.register('temp_optima_min', { valueAsNumber: true })} type="number" step="0.1" className={inputClass} placeholder="18" /></div>
        <div><label className="mb-1.5 block text-xs font-medium">Temp máx °C</label><input {...form.register('temp_optima_max', { valueAsNumber: true })} type="number" step="0.1" className={inputClass} placeholder="24" /></div>
        <div><label className="mb-1.5 block text-xs font-medium">Altitud mín</label><input {...form.register('altitud_optima_min', { valueAsNumber: true })} type="number" className={inputClass} placeholder="0" /></div>
        <div><label className="mb-1.5 block text-xs font-medium">Altitud máx</label><input {...form.register('altitud_optima_max', { valueAsNumber: true })} type="number" className={inputClass} placeholder="1800" /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="mb-1.5 block text-xs font-medium">pH mín</label><input {...form.register('ph_optimo_min', { valueAsNumber: true })} type="number" step="0.1" min="0" max="14" className={inputClass} placeholder="5.5" /></div>
        <div><label className="mb-1.5 block text-xs font-medium">pH máx</label><input {...form.register('ph_optimo_max', { valueAsNumber: true })} type="number" step="0.1" min="0" max="14" className={inputClass} placeholder="7.0" /></div>
        <div><label className="mb-1.5 block text-xs font-medium">Req. agua</label><select {...form.register('req_agua')} className={inputClass}><option value="">—</option><option value="bajo">Bajo</option><option value="medio">Medio</option><option value="alto">Alto</option></select></div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="h-10 rounded-lg border px-4 text-sm font-medium hover:bg-accent">Cancelar</button>
        <button type="submit" disabled={isPending} className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Leaf className="h-4 w-4" />} {submitLabel}</button>
      </div>
    </form>
  );

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Catálogo — Tipos de Cultivo</h1><p className="mt-1 text-sm text-muted-foreground">{tipos?.length || 0} tipos registrados</p></div>
        <button onClick={() => { setShowCreate(true); setError(''); createForm.reset(); }} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> Nuevo tipo</button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {showCreate && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Nuevo tipo de cultivo</h2><button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button></div>
          <CultivoForm form={createForm} onSubmit={onCreate} submitLabel="Crear" isPending={createMutation.isPending} onCancel={() => setShowCreate(false)} />
        </div>
      )}

      {editing && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Editar: {editing.nombre}</h2><button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button></div>
          <CultivoForm form={editForm} onSubmit={onUpdate} submitLabel="Guardar" isPending={updateMutation.isPending} onCancel={() => setEditing(null)} />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="divide-y">
          {tipos && tipos.length > 0 ? tipos.map((t) => (
            <div key={t.tipo_cultivo_id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-green-50 p-2 text-green-600"><Leaf className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-medium">{t.nombre}{t.nombre_cientifico && <span className="ml-1.5 text-xs italic text-muted-foreground">({t.nombre_cientifico})</span>}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.categoria && `${t.categoria} · `}
                    {t.dias_crecimiento_prom && `${t.dias_crecimiento_prom} días · `}
                    {t.temp_optima_min !== undefined && t.temp_optima_max !== undefined && `${t.temp_optima_min}–${t.temp_optima_max}°C · `}
                    {t.altitud_optima_min !== undefined && t.altitud_optima_max !== undefined && `${t.altitud_optima_min}–${t.altitud_optima_max} msnm · `}
                    {t.ph_optimo_min !== undefined && t.ph_optimo_max !== undefined && `pH ${t.ph_optimo_min}–${t.ph_optimo_max} · `}
                    {t.req_agua && `Agua: ${t.req_agua}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(t)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground" title="Editar"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => { if (confirm(`¿Eliminar "${t.nombre}"?`)) deleteMutation.mutate(t.tipo_cultivo_id); }} className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          )) : <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">No hay tipos de cultivo registrados</div>}
        </div>
      </div>
    </div>
  );
}
