'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { User, MapPin, Phone, Mail, Pencil, Check, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { farmersService } from '@/services/farmers.service';

const inputClass = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200";

export default function ProfilePage() {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  const isAgricultor = usuario?.rol === 'agricultor';

  const { data: perfil, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: farmersService.getMyProfile,
    enabled: isAgricultor,
  });

  const editForm = useForm();

  const updateMutation = useMutation({
    mutationFn: (data: any) => farmersService.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setEditing(false);
      setError('');
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Error al actualizar'),
  });

  const openEdit = () => {
    if (!perfil) return;
    setEditing(true);
    editForm.reset({
      direccion: perfil.direccion || '',
      municipio: perfil.municipio,
      departamento: perfil.departamento,
      tamano_finca_ha: perfil.tamano_finca_ha,
    });
  };

  const onUpdate = (data: any) => {
    const clean: any = {};
    if (data.direccion) clean.direccion = data.direccion;
    if (data.municipio) clean.municipio = data.municipio;
    if (data.departamento) clean.departamento = data.departamento;
    if (data.tamano_finca_ha && !isNaN(data.tamano_finca_ha)) clean.tamano_finca_ha = Number(data.tamano_finca_ha);
    updateMutation.mutate(clean);
  };

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Mi Perfil</h1>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* User info */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Información de cuenta</h2>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">
              {usuario?.nombre[0]}{usuario?.apellido[0]}
            </div>
            <div>
              <p className="text-lg font-medium">{usuario?.nombre} {usuario?.apellido}</p>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                usuario?.rol === 'admin' ? 'bg-violet-50 text-violet-700' :
                usuario?.rol === 'tecnico' ? 'bg-blue-50 text-blue-700' :
                'bg-emerald-50 text-emerald-700'
              }`}>
                {usuario?.rol === 'admin' ? 'Administrador' : usuario?.rol === 'tecnico' ? 'Técnico' : 'Agricultor'}
              </span>
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{usuario?.correo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agricultor profile */}
      {isAgricultor && perfil && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="font-semibold">Datos de agricultor</h2>
            {!editing && (
              <button onClick={openEdit} className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                <Pencil className="h-3.5 w-3.5" /> Editar
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={editForm.handleSubmit(onUpdate)} className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Cédula</label>
                <input value={perfil.cedula} disabled className="h-10 w-full rounded-lg border bg-muted px-3 text-sm text-muted-foreground" />
                <p className="mt-1 text-[11px] text-muted-foreground">La cédula no se puede cambiar</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Dirección</label>
                <input {...editForm.register('direccion')} className={inputClass} placeholder="Vereda La Esperanza, Km 5" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Municipio</label>
                  <input {...editForm.register('municipio')} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Departamento</label>
                  <input {...editForm.register('departamento')} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Tamaño de finca (hectáreas)</label>
                <input {...editForm.register('tamano_finca_ha', { valueAsNumber: true })} type="number" step="0.1" className={inputClass} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(false)} className="flex h-10 flex-1 items-center justify-center gap-1 rounded-lg border text-sm font-medium hover:bg-accent"><X className="h-4 w-4" /> Cancelar</button>
                <button type="submit" disabled={updateMutation.isPending} className="flex h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Guardar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 p-6">
              <div className="flex items-center gap-3 text-sm"><User className="h-4 w-4 text-muted-foreground" /><span>Cédula: {perfil.cedula}</span></div>
              {perfil.direccion && <div className="flex items-center gap-3 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{perfil.direccion}</span></div>}
              <div className="flex items-center gap-3 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{perfil.municipio}, {perfil.departamento}</span></div>
              {perfil.tamano_finca_ha && <div className="flex items-center gap-3 text-sm"><span className="text-muted-foreground">🌾</span><span>Finca: {perfil.tamano_finca_ha} hectáreas</span></div>}
              <p className="pt-2 text-[11px] text-muted-foreground">Registrado el {new Date(perfil.creado_en).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          )}
        </div>
      )}

      {!isAgricultor && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Tu cuenta es de tipo <span className="font-medium">{usuario?.rol}</span>. No tienes perfil de agricultor asociado.
          </p>
        </div>
      )}
    </div>
  );
}
