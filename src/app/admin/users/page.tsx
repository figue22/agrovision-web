'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Plus, Loader2, X, UserCheck, UserX, Search, Link2, Unlink } from 'lucide-react';
import { adminService, UsuarioResponse, CreateUserRequest } from '@/services/admin.service';
import { farmersService } from '@/services/farmers.service';

const rolStyle: Record<string, { bg: string; text: string; label: string }> = {
  admin: { bg: 'bg-violet-50', text: 'text-violet-700', label: 'Admin' },
  tecnico: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Técnico' },
  agricultor: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Agricultor' },
};

const createSchema = z.object({
  correo: z.string().email('Correo inválido'),
  contrasena: z.string().min(8, 'Mínimo 8 caracteres').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/, '1 mayúscula, 1 minúscula, 1 número, 1 especial'),
  nombre: z.string().min(2, 'Requerido'),
  apellido: z.string().min(2, 'Requerido'),
  telefono: z.string().optional(),
  rol: z.enum(['admin', 'tecnico', 'agricultor']),
});

const inputClass = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [selectedTecnico, setSelectedTecnico] = useState('');
  const [selectedAgricultor, setSelectedAgricultor] = useState('');
  const [error, setError] = useState('');

  const { data: users, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: adminService.getUsers });
  const { data: stats } = useQuery({ queryKey: ['admin-users-stats'], queryFn: adminService.getStats });
  const { data: assignments } = useQuery({ queryKey: ['admin-assignments'], queryFn: adminService.getAssignments });
  const { data: agricultores } = useQuery({ queryKey: ['admin-agricultores'], queryFn: farmersService.getAll, enabled: showAssign });

  const createForm = useForm({ resolver: zodResolver(createSchema), defaultValues: { rol: 'tecnico' as const } });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => adminService.createUser(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] }); setShowCreate(false); createForm.reset(); setError(''); },
    onError: (err: any) => setError(err.response?.data?.message || 'Error al crear usuario'),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ usuario_id, nuevo_rol }: { usuario_id: string; nuevo_rol: string }) => adminService.changeRole({ usuario_id, nuevo_rol: nuevo_rol as any }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] }); },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ usuario_id, esta_activo }: { usuario_id: string; esta_activo: boolean }) => adminService.toggleStatus({ usuario_id, esta_activo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const assignMutation = useMutation({
    mutationFn: (data: { tecnico_id: string; agricultor_id: string }) => adminService.assign(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-assignments'] }); setSelectedTecnico(''); setSelectedAgricultor(''); setError(''); },
    onError: (err: any) => setError(err.response?.data?.message || 'Error al asignar'),
  });

  const unassignMutation = useMutation({
    mutationFn: (data: { tecnico_id: string; agricultor_id: string }) => adminService.unassign(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-assignments'] }),
  });

  const tecnicos = users?.filter((u) => u.rol === 'tecnico') || [];
  const filteredUsers = users?.filter((u) => {
    const matchSearch = !searchTerm || `${u.nombre} ${u.apellido} ${u.correo}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRol = !filterRol || u.rol === filterRol;
    return matchSearch && matchRol;
  });

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Gestión de Usuarios</h1><p className="mt-1 text-sm text-muted-foreground">{users?.length || 0} usuarios registrados</p></div>
        <div className="flex gap-2">
          <button onClick={() => { setShowAssign(!showAssign); setError(''); }} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent"><Link2 className="h-4 w-4" /> Asignaciones</button>
          <button onClick={() => { setShowCreate(true); setError(''); }} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> Crear usuario</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {['admin', 'tecnico', 'agricultor'].map((rol) => {
          const stat = stats?.find((s) => s.rol === rol);
          const style = rolStyle[rol];
          return <div key={rol} className="rounded-xl border bg-card p-4"><span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{style.label}s</span><p className="mt-1 text-2xl font-semibold">{stat?.total || 0}</p></div>;
        })}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Assignments panel */}
      {showAssign && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Asignaciones técnico → agricultor</h2><button onClick={() => setShowAssign(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button></div>
          <div className="mb-4 flex gap-3">
            <select value={selectedTecnico} onChange={(e) => setSelectedTecnico(e.target.value)} className={inputClass}><option value="">Seleccionar técnico...</option>{tecnicos.map((t) => <option key={t.usuario_id} value={t.usuario_id}>{t.nombre} {t.apellido}</option>)}</select>
            <select value={selectedAgricultor} onChange={(e) => setSelectedAgricultor(e.target.value)} className={inputClass}><option value="">Seleccionar agricultor...</option>{agricultores?.map((a) => <option key={a.agricultor_id} value={a.agricultor_id}>{a.usuario?.nombre} {a.usuario?.apellido} — {a.municipio}</option>)}</select>
            <button onClick={() => { if (selectedTecnico && selectedAgricultor) assignMutation.mutate({ tecnico_id: selectedTecnico, agricultor_id: selectedAgricultor }); }} disabled={!selectedTecnico || !selectedAgricultor || assignMutation.isPending} className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {assignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Asignar
            </button>
          </div>
          {assignments && assignments.length > 0 ? (
            <div className="divide-y rounded-lg border">
              {assignments.map((a) => (
                <div key={a.asignacion_id} className="flex items-center justify-between px-4 py-3">
                  <div className="text-sm"><span className="font-medium">{a.tecnico?.nombre} {a.tecnico?.apellido}</span><span className="mx-2 text-muted-foreground">→</span><span>{a.agricultor?.usuario?.nombre} {a.agricultor?.usuario?.apellido}</span><span className="ml-2 text-xs text-muted-foreground">({a.agricultor?.municipio})</span></div>
                  <button onClick={() => { if (confirm('¿Desasignar?')) unassignMutation.mutate({ tecnico_id: a.tecnico_id, agricultor_id: a.agricultor_id }); }} className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600" title="Desasignar"><Unlink className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No hay asignaciones activas</p>}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Crear usuario</h2><button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button></div>
          <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d as CreateUserRequest))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="mb-1.5 block text-sm font-medium">Nombre</label><input {...createForm.register('nombre')} className={inputClass} placeholder="Carlos" />{createForm.formState.errors.nombre && <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.nombre.message}</p>}</div>
              <div><label className="mb-1.5 block text-sm font-medium">Apellido</label><input {...createForm.register('apellido')} className={inputClass} placeholder="Ramírez" />{createForm.formState.errors.apellido && <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.apellido.message}</p>}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="mb-1.5 block text-sm font-medium">Correo</label><input {...createForm.register('correo')} type="email" className={inputClass} placeholder="carlos@agrovision.com" />{createForm.formState.errors.correo && <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.correo.message}</p>}</div>
              <div><label className="mb-1.5 block text-sm font-medium">Contraseña</label><input {...createForm.register('contrasena')} type="password" className={inputClass} placeholder="Mínimo 8 caracteres" />{createForm.formState.errors.contrasena && <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.contrasena.message}</p>}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="mb-1.5 block text-sm font-medium">Teléfono <span className="text-xs text-muted-foreground">(opc)</span></label><input {...createForm.register('telefono')} className={inputClass} placeholder="+573009999999" /></div>
              <div><label className="mb-1.5 block text-sm font-medium">Rol</label><select {...createForm.register('rol')} className={inputClass}><option value="tecnico">Técnico</option><option value="admin">Admin</option><option value="agricultor">Agricultor</option></select></div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="h-10 rounded-lg border px-4 text-sm font-medium hover:bg-accent">Cancelar</button>
              <button type="submit" disabled={createMutation.isPending} className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">{createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />} Crear</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200" placeholder="Buscar por nombre o correo..." /></div>
        <select value={filterRol} onChange={(e) => setFilterRol(e.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm outline-none"><option value="">Todos los roles</option><option value="admin">Admin</option><option value="tecnico">Técnico</option><option value="agricultor">Agricultor</option></select>
      </div>

      {/* Users list */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="divide-y">
          {filteredUsers && filteredUsers.length > 0 ? filteredUsers.map((user) => {
            const style = rolStyle[user.rol] || rolStyle.agricultor;
            return (
              <div key={user.usuario_id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">{user.nombre[0]}{user.apellido[0]}</div>
                  <div><p className="text-sm font-medium">{user.nombre} {user.apellido}</p><p className="text-xs text-muted-foreground">{user.correo}{user.telefono && ` · ${user.telefono}`}</p>{user.ultimo_login && <p className="text-[11px] text-muted-foreground">Último login: {new Date(user.ultimo_login).toLocaleDateString('es-CO')}</p>}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${style.bg} ${style.text}`}>{style.label}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${user.esta_activo ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{user.esta_activo ? 'Activo' : 'Inactivo'}</span>
                  <select value={user.rol} onChange={(e) => changeRoleMutation.mutate({ usuario_id: user.usuario_id, nuevo_rol: e.target.value })} className="h-8 rounded-lg border bg-background px-2 text-xs outline-none"><option value="admin">Admin</option><option value="tecnico">Técnico</option><option value="agricultor">Agricultor</option></select>
                  <button onClick={() => toggleStatusMutation.mutate({ usuario_id: user.usuario_id, esta_activo: !user.esta_activo })} className={`rounded-lg p-2 ${user.esta_activo ? 'text-muted-foreground hover:bg-red-50 hover:text-red-600' : 'text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600'}`} title={user.esta_activo ? 'Desactivar' : 'Activar'}>{user.esta_activo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}</button>
                </div>
              </div>
            );
          }) : <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">No se encontraron usuarios</div>}
        </div>
      </div>
    </div>
  );
}
