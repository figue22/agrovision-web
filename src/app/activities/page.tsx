'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ClipboardList, Plus, Trash2, Loader2, X, DollarSign,
  Package, Edit2, ChevronDown, ChevronUp, Calendar,
} from 'lucide-react';
import { activitiesService, ActividadResponse, CreateActividadRequest } from '@/services/activities.service';
import { parcelasService } from '@/services/parcelas.service';
import { catalogsService } from '@/services/catalogs.service';
import { cultivosService } from '@/services/cultivos.service';
import { useAuthStore } from '@/store/auth-store';

const insumoSchema = z.object({
  nombre_insumo: z.string().min(1, 'Nombre requerido'),
  tipo_insumo_id: z.coerce.number().min(1),
  cantidad: z.coerce.number().min(0.01),
  unidad: z.string().min(1),
  costo_unitario_cop: z.coerce.number().optional(),
  marca: z.string().optional(),
});

const createSchema = z.object({
  parcela_id: z.string().min(1),
  cultivo_parcela_id: z.string().optional(),
  tipo_actividad_id: z.coerce.number().min(1, 'Selecciona un tipo'),
  descripcion: z.string().optional(),
  cantidad: z.coerce.number().optional(),
  unidad: z.string().optional(),
  costo_cop: z.coerce.number().optional(),
  fecha_realizacion: z.string().min(1, 'Fecha requerida'),
  notas: z.string().optional(),
  insumos: z.array(insumoSchema).optional(),
});

type FormData = z.infer<typeof createSchema>;

const inputClass = 'h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200';
const ITEMS_PER_PAGE = 10;

const tipoIcono: Record<string, string> = {
  siembra: '🌱', fertilizacion: '🧪', riego: '💧',
  fumigacion: '🪣', cosecha: '🌾', poda: '✂️', otro: '📋',
};

function ActividadCard({ actividad, onDelete, onEdit }: {
  actividad: ActividadResponse;
  onDelete: (id: string) => void;
  onEdit: (a: ActividadResponse) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const icono = tipoIcono[actividad.tipoActividad?.nombre?.toLowerCase() || ''] || '📋';
  const [year, month, day] = actividad.fecha_realizacion.split('T')[0].split('-').map(Number);
  const fecha = new Date(year, month - 1, day);

  return (
    <div className="border-b last:border-0">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/20"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-lg">{icono}</div>
          <div>
            <p className="text-sm font-medium">{actividad.tipoActividad?.nombre || `Tipo ${actividad.tipo_actividad_id}`}</p>
            <p className="text-xs text-muted-foreground">
              {actividad.descripcion || 'Sin descripción'} ·{' '}
              <span className="inline-flex items-center gap-0.5">
                <Calendar className="h-3 w-3" />
                {fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              {actividad.parcela?.nombre && (
                <span className="text-[11px] text-muted-foreground">
                  📍 {actividad.parcela.nombre}
                </span>
              )}
              {actividad.cultivoParcela?.tipoCultivo?.nombre && (
                <span className="text-[11px] text-emerald-600 font-medium">
                  🌱 {actividad.cultivoParcela.tipoCultivo.nombre}
                  {actividad.cultivoParcela.fecha_siembra && (() => {
                    const [y, m, d] = actividad.cultivoParcela!.fecha_siembra.split('T')[0].split('-').map(Number);
                    return ` (sembrado ${new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })})`;
                  })()}
                </span>
              )}
              {actividad.costo_cop && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <DollarSign className="h-3 w-3" />${Number(actividad.costo_cop).toLocaleString('es-CO')}
                </span>
              )}
              {actividad.cantidad && actividad.unidad && (
                <span className="text-[11px] text-muted-foreground">{actividad.cantidad} {actividad.unidad}</span>
              )}
              {actividad.insumos && actividad.insumos.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Package className="h-3 w-3" />{actividad.insumos.length} insumos
                </span>
              )}
              
              {actividad.realizadaPor && (
                <span className="text-[11px] text-muted-foreground">
                  Por: {actividad.realizadaPor.nombre} {actividad.realizadaPor.apellido}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onEdit(actividad)} className="rounded-lg p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600">
            <Edit2 className="h-4 w-4" />
          </button>
          <button onClick={() => { if (confirm('¿Eliminar esta actividad?')) onDelete(actividad.actividad_id); }}
            className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-muted/10 px-5 py-4 space-y-3">
          {actividad.notas && (
            <div><p className="text-xs font-medium text-muted-foreground">Notas</p><p className="text-sm">{actividad.notas}</p></div>
          )}
          {actividad.insumos && actividad.insumos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Insumos utilizados</p>
              <div className="space-y-1">
                {actividad.insumos.map((ins) => (
                  <div key={ins.insumo_actividad_id} className="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-xs">
                    <span className="font-medium">{ins.nombre_insumo}</span>
                    <div className="flex gap-3 text-muted-foreground">
                      <span>{ins.cantidad} {ins.unidad}</span>
                      {ins.marca && <span>{ins.marca}</span>}
                      {ins.costo_unitario_cop && <span>${Number(ins.costo_unitario_cop).toLocaleString('es-CO')}/u</span>}
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
}

export default function ActivitiesPage() {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedParcela, setSelectedParcela] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const { data: parcelas } = useQuery({
    queryKey: ['parcelas-select'],
    queryFn: usuario?.rol === 'agricultor' ? parcelasService.getMyParcelas : parcelasService.getAll,
  });

  const { data: tiposActividad } = useQuery({
    queryKey: ['cat-tipos-actividad'],
    queryFn: () => catalogsService.findAll('tipos-actividad'),
  });

  const { data: tiposInsumo } = useQuery({
    queryKey: ['cat-tipos-insumo'],
    queryFn: () => catalogsService.findAll('tipos-insumo'),
  });

  const { data: cultivosParcela } = useQuery({
    queryKey: ['cultivos-parcela-activos', selectedParcela],
    queryFn: () => cultivosService.getCultivosByParcela(selectedParcela),
    enabled: !!selectedParcela,
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

  const form = useForm<FormData>({
    resolver: zodResolver(createSchema) as any,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'insumos' });

  const createMutation = useMutation({
    mutationFn: (data: CreateActividadRequest) => activitiesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actividades'] });
      queryClient.invalidateQueries({ queryKey: ['actividades-resumen'] });
      setShowForm(false); setEditingId(null); form.reset(); setError('');
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Error al crear actividad'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateActividadRequest> }) =>
      activitiesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actividades'] });
      queryClient.invalidateQueries({ queryKey: ['actividades-resumen'] });
      setShowForm(false); setEditingId(null); form.reset(); setError('');
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => activitiesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actividades'] });
      queryClient.invalidateQueries({ queryKey: ['actividades-resumen'] });
    },
  });

  const onSubmit = (data: FormData) => {
    const payload: CreateActividadRequest = {
      parcela_id: selectedParcela,
      cultivo_parcela_id: data.cultivo_parcela_id || undefined,
      tipo_actividad_id: Number(data.tipo_actividad_id),
      descripcion: data.descripcion || undefined,
      cantidad: data.cantidad ? Number(data.cantidad) : undefined,
      unidad: data.unidad || undefined,
      costo_cop: data.costo_cop ? Number(data.costo_cop) : undefined,
      fecha_realizacion: data.fecha_realizacion,
      notas: data.notas || undefined,
      insumos: data.insumos?.map((ins) => ({
        nombre_insumo: ins.nombre_insumo,
        tipo_insumo_id: Number(ins.tipo_insumo_id),
        cantidad: Number(ins.cantidad),
        unidad: ins.unidad,
        costo_unitario_cop: ins.costo_unitario_cop ? Number(ins.costo_unitario_cop) : undefined,
        marca: ins.marca || undefined,
      })),
    };

    if (editingId) {
      const { parcela_id: _, ...updatePayload } = payload;
      updateMutation.mutate({ id: editingId, data: updatePayload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (actividad: ActividadResponse) => {
    setEditingId(actividad.actividad_id);
    setShowForm(true);
    setError('');
    form.reset({
      parcela_id: actividad.parcela_id,
      cultivo_parcela_id: actividad.cultivo_parcela_id || '',
      tipo_actividad_id: actividad.tipo_actividad_id,
      descripcion: actividad.descripcion || '',
      cantidad: actividad.cantidad ? Number(actividad.cantidad) : undefined,
      unidad: actividad.unidad || '',
      costo_cop: actividad.costo_cop ? Number(actividad.costo_cop) : undefined,
      fecha_realizacion: actividad.fecha_realizacion.split('T')[0],
      notas: actividad.notas || '',
      insumos: actividad.insumos?.map((ins) => ({
        nombre_insumo: ins.nombre_insumo,
        tipo_insumo_id: ins.tipo_insumo_id,
        cantidad: Number(ins.cantidad),
        unidad: ins.unidad,
        costo_unitario_cop: ins.costo_unitario_cop ? Number(ins.costo_unitario_cop) : undefined,
        marca: ins.marca || '',
      })) || [],
    });
  };

  const totalPages = Math.ceil((actividades?.length || 0) / ITEMS_PER_PAGE);
  const actividadesPaginadas = actividades?.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bitácora de Actividades</h1>
          <p className="mt-1 text-sm text-muted-foreground">Registro de actividades agrícolas e insumos</p>
        </div>
        {selectedParcela && !showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setError(''); form.reset({ parcela_id: selectedParcela }); }}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Nueva actividad
          </button>
        )}
      </div>

      {/* Selector de parcela */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <label className="mb-1.5 block text-sm font-medium">Selecciona una parcela</label>
        <select value={selectedParcela} onChange={(e) => { setSelectedParcela(e.target.value); setPage(1); setShowForm(false); form.reset(); }} className={inputClass}>
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
            <div className="mt-1 space-y-0.5">
              {resumen.por_tipo?.map((t) => (
                <p key={t.tipo} className="text-xs">{tipoIcono[t.tipo.toLowerCase()] || '📋'} {t.tipo}: <span className="font-medium">{t.cantidad}</span></p>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Formulario */}
      {showForm && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editingId ? 'Editar actividad' : 'Registrar actividad'}</h2>
            <button onClick={() => { setShowForm(false); setEditingId(null); form.reset(); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Tipo de actividad</label>
                <select {...form.register('tipo_actividad_id')} className={inputClass}>
                  <option value="">-- Seleccionar --</option>
                  {tiposActividad?.map((t: any) => (
                    <option key={t.id} value={t.id}>{tipoIcono[t.codigo] || '📋'} {t.nombre}</option>
                  ))}
                </select>
                {form.formState.errors.tipo_actividad_id && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.tipo_actividad_id.message as string}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Fecha de realización</label>
                <input {...form.register('fecha_realizacion')} type="date" className={inputClass} />
                {form.formState.errors.fecha_realizacion && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.fecha_realizacion.message as string}</p>
                )}
              </div>
            </div>

            {/* Cultivo */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Cultivo (opcional)</label>
              <select {...form.register('cultivo_parcela_id')} className={inputClass}>
                <option value="">-- Sin cultivo específico --</option>
                {cultivosParcela?.map((c) => (
                  <option key={c.cultivo_parcela_id} value={c.cultivo_parcela_id}>
                    {c.tipoCultivo?.nombre || 'Cultivo'} — sembrado {(() => {
                      const [y, m, d] = c.fecha_siembra.split('T')[0].split('-').map(Number);
                      return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
                    })()} ({c.estado})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Descripción</label>
              <input {...form.register('descripcion')} className={inputClass} placeholder="Ej: Fertilización foliar con urea al 2%" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Cantidad</label>
                <input {...form.register('cantidad')} type="number" step="0.01" className={inputClass} placeholder="0" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Unidad</label>
                <input {...form.register('unidad')} className={inputClass} placeholder="kg, L, m²..." />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Costo (COP)</label>
                <input {...form.register('costo_cop')} type="number" className={inputClass} placeholder="0" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Notas</label>
              <textarea {...form.register('notas')} rows={2} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200 resize-none" placeholder="Observaciones adicionales..." />
            </div>

            {/* Insumos */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">Insumos utilizados</label>
                <button type="button"
                  onClick={() => append({ nombre_insumo: '', tipo_insumo_id: 1, cantidad: 1, unidad: 'kg', costo_unitario_cop: undefined, marca: '' })}
                  className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                  <Plus className="h-3 w-3" /> Agregar insumo
                </button>
              </div>
              {fields.length > 0 && (
                <div className="space-y-2">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="rounded-lg border bg-muted/20 p-3 space-y-2">
                      <div className="grid grid-cols-6 gap-2">
                        <input {...form.register(`insumos.${idx}.nombre_insumo`)} placeholder="Nombre insumo" className={`${inputClass} col-span-2`} />
                        <select {...form.register(`insumos.${idx}.tipo_insumo_id`)} className={inputClass}>
                          {tiposInsumo?.map((t: any) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                        </select>
                        <input {...form.register(`insumos.${idx}.cantidad`)} type="number" step="0.01" placeholder="Cant." className={inputClass} />
                        <input {...form.register(`insumos.${idx}.unidad`)} placeholder="Unidad" className={inputClass} />
                        <button type="button" onClick={() => remove(idx)} className="flex items-center justify-center rounded-lg border hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input {...form.register(`insumos.${idx}.marca`)} placeholder="Marca (opcional)" className={inputClass} />
                        <input {...form.register(`insumos.${idx}.costo_unitario_cop`)} type="number" placeholder="Costo unitario COP" className={inputClass} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); form.reset(); }}
                className="h-10 rounded-lg border px-4 text-sm font-medium hover:bg-accent">Cancelar</button>
              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
                {editingId ? 'Actualizar' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {!selectedParcela ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border bg-card text-sm text-muted-foreground shadow-sm">
          <ClipboardList className="h-8 w-8 text-muted-foreground/30" />Selecciona una parcela para ver sus actividades
        </div>
      ) : isLoading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="divide-y">
            {actividadesPaginadas && actividadesPaginadas.length > 0 ? actividadesPaginadas.map((a) => (
              <ActividadCard
                key={a.actividad_id}
                actividad={a}
                onDelete={(id) => deleteMutation.mutate(id)}
                onEdit={handleEdit}
              />
            )) : (
              <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <ClipboardList className="h-8 w-8 text-muted-foreground/30" />No hay actividades registradas
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-5 py-3">
              <p className="text-xs text-muted-foreground">Página {page} de {totalPages} · {actividades?.length} actividades</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1} className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-40">«</button>
                <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-40">‹</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 5) p = i + 1;
                  else if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs ${page === p ? 'bg-emerald-600 text-white border-emerald-600' : 'hover:bg-accent'}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-40">›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-40">»</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

//TODO : MOSTRAR EL CULTIVO AL QUE SE LE REALIZO LA ACTIVIDAD Y HACER EL COMMIT