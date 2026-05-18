'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Loader2, Search, User, Calendar } from 'lucide-react';
import { auditService, LogAuditoriaResponse } from '@/services/audit.service';

const inputClass = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200";

const accionStyle: Record<string, { bg: string; text: string }> = {
  CREATE: { bg: 'bg-green-50', text: 'text-green-700' },
  UPDATE: { bg: 'bg-blue-50', text: 'text-blue-700' },
  DELETE: { bg: 'bg-red-50', text: 'text-red-700' },
  LOGIN: { bg: 'bg-purple-50', text: 'text-purple-700' },
  LOGOUT: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

export default function AdminAuditPage() {
  const [tab, setTab] = useState<'all' | 'search'>('all');
  const [usuarioId, setUsuarioId] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditService.getAll(200),
    enabled: tab === 'all',
  });

  const { data: logsByUser, isLoading: loadingUser } = useQuery({
    queryKey: ['audit-usuario', usuarioId],
    queryFn: () => auditService.getByUsuario(usuarioId),
    enabled: tab === 'search' && !!usuarioId && !desde,
  });

  const { data: logsByDate, isLoading: loadingDate } = useQuery({
    queryKey: ['audit-rango', desde, hasta],
    queryFn: () => auditService.getByDateRange(desde, hasta),
    enabled: tab === 'search' && !!desde && !!hasta,
  });

  const displayLogs = tab === 'all' ? logs : (desde ? logsByDate : logsByUser);
  const loading = tab === 'all' ? isLoading : (desde ? loadingDate : loadingUser);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Auditoría</h1>
        <p className="mt-1 text-sm text-muted-foreground">Logs de cambios y accesos al sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('all')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'all' ? 'bg-emerald-600 text-white' : 'border hover:bg-accent'}`}>Todos</button>
        <button onClick={() => setTab('search')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'search' ? 'bg-emerald-600 text-white' : 'border hover:bg-accent'}`}>Buscar</button>
      </div>

      {/* Filtros */}
      {tab === 'search' && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"><User className="h-3.5 w-3.5" /> ID Usuario</label>
              <input value={usuarioId} onChange={(e) => { setUsuarioId(e.target.value); setDesde(''); setHasta(''); }} className={inputClass} placeholder="uuid del usuario" />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"><Calendar className="h-3.5 w-3.5" /> Desde</label>
              <input type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setUsuarioId(''); }} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"><Calendar className="h-3.5 w-3.5" /> Hasta</label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 text-left">Fecha</th>
                  <th className="px-4 py-2.5 text-left">Usuario</th>
                  <th className="px-4 py-2.5 text-left">Acción</th>
                  <th className="px-4 py-2.5 text-left">Entidad</th>
                  <th className="px-4 py-2.5 text-left">Método</th>
                  <th className="px-4 py-2.5 text-left">Ruta</th>
                  <th className="px-4 py-2.5 text-left">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {displayLogs && displayLogs.length > 0 ? displayLogs.map((log) => {
                  const acc = accionStyle[log.accion] || { bg: 'bg-gray-50', text: 'text-gray-700' };
                  return (
                    <tr key={log.log_id} className="hover:bg-muted/20">
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs">{new Date(log.creado_en).toLocaleString('es-CO')}</td>
                      <td className="px-4 py-2.5 text-xs">{log.usuario ? `${log.usuario.nombre} ${log.usuario.apellido}` : log.usuario_id || 'Sistema'}</td>
                      <td className="px-4 py-2.5"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${acc.bg} ${acc.text}`}>{log.accion}</span></td>
                      <td className="px-4 py-2.5 text-xs">{log.tipo_entidad}</td>
                      <td className="px-4 py-2.5 text-xs font-mono">{log.metodo_http || '-'}</td>
                      <td className="max-w-[200px] truncate px-4 py-2.5 text-xs text-muted-foreground">{log.ruta_endpoint || '-'}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{log.direccion_ip || '-'}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No hay logs</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}