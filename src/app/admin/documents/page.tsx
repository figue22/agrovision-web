'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Loader2, CheckCircle2, Clock, XCircle, BarChart3 } from 'lucide-react';

// Servicio inline ya que no tenemos documents.service.ts en el front
import { api } from '@/services/api';

interface DocumentoResponse {
  documento_id: string;
  parcela_id?: string;
  titulo: string;
  categoria: string;
  ruta_archivo: string;
  tipo_archivo: string;
  tamano_kb?: number;
  idioma?: string;
  estado_indexacion: string;
  esta_activo: boolean;
  creado_en: string;
  subidoPor?: { nombre: string; apellido: string };
  parcela?: { nombre: string };
}

interface ResumenDocs {
  total: number;
  activos: number;
  pendientes_indexacion: number;
  indexados: number;
  fallidos: number;
}

const estadoIcon: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pendiente: { icon: Clock, label: 'Pendiente', color: 'text-yellow-600' },
  indexado: { icon: CheckCircle2, label: 'Indexado', color: 'text-green-600' },
  fallido: { icon: XCircle, label: 'Fallido', color: 'text-red-600' },
};

export default function AdminDocumentsPage() {
  const { data: docs, isLoading } = useQuery({
    queryKey: ['admin-documents'],
    queryFn: async (): Promise<DocumentoResponse[]> => {
      const res = await api.get<DocumentoResponse[]>('/documents?limit=100');
      return res.data;
    },
  });

  const { data: resumen } = useQuery({
    queryKey: ['admin-documents-resumen'],
    queryFn: async (): Promise<ResumenDocs> => {
      const res = await api.get<ResumenDocs>('/documents/resumen');
      return res.data;
    },
  });

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documentos RAG</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gestión de documentos indexados para el sistema RAG</p>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-5 gap-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{resumen.total}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Activos</p>
            <p className="text-2xl font-bold text-emerald-600">{resumen.activos}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{resumen.pendientes_indexacion}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Indexados</p>
            <p className="text-2xl font-bold text-green-600">{resumen.indexados}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Fallidos</p>
            <p className="text-2xl font-bold text-red-600">{resumen.fallidos}</p>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="divide-y">
          {docs && docs.length > 0 ? docs.map((doc) => {
            const est = estadoIcon[doc.estado_indexacion] || estadoIcon.pendiente;
            const EstIcon = est.icon;
            return (
              <div key={doc.documento_id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-indigo-50 p-2 text-indigo-600"><FileText className="h-4 w-4" /></div>
                  <div>
                    <p className="text-sm font-medium">{doc.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.categoria} · {doc.tipo_archivo.toUpperCase()}{doc.tamano_kb ? ` · ${doc.tamano_kb} KB` : ''} · {new Date(doc.creado_en).toLocaleDateString('es-CO')}
                    </p>
                    <div className="mt-1 flex items-center gap-3">
                      <span className={`flex items-center gap-1 text-[11px] ${est.color}`}><EstIcon className="h-3 w-3" />{est.label}</span>
                      {doc.parcela?.nombre && <span className="text-[11px] text-muted-foreground">Parcela: {doc.parcela.nombre}</span>}
                      {doc.subidoPor && <span className="text-[11px] text-muted-foreground">Por: {doc.subidoPor.nombre} {doc.subidoPor.apellido}</span>}
                      {!doc.esta_activo && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">Inactivo</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground"><FileText className="h-8 w-8 text-muted-foreground/30" />No hay documentos</div>
          )}
        </div>
      </div>
    </div>
  );
}