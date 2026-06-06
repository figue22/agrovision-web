'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Upload, Trash2, RefreshCw, Loader2, Plus,
  X, ChevronDown, ChevronUp, Database, CheckCircle,
  AlertCircle, Clock, Edit2,
} from 'lucide-react';
import { documentsService, DocumentoResponse } from '@/services/documents.service';
import { useAuthStore } from '@/store/auth-store';

const inputClass = 'h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200';

const estadoStyle: Record<string, { bg: string; text: string; icon: JSX.Element; label: string }> = {
  pendiente:   { bg: 'bg-gray-50',   text: 'text-gray-600',   icon: <Clock className="h-3.5 w-3.5" />,        label: 'Pendiente' },
  procesando:  { bg: 'bg-blue-50',   text: 'text-blue-600',   icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, label: 'Procesando' },
  indexado:    { bg: 'bg-green-50',  text: 'text-green-700',  icon: <CheckCircle className="h-3.5 w-3.5" />,  label: 'Indexado' },
  fallido:     { bg: 'bg-red-50',    text: 'text-red-700',    icon: <AlertCircle className="h-3.5 w-3.5" />,  label: 'Fallido' },
};

export default function DocumentsAdminPage() {
  //const { usuario } = useAuthStore();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentoResponse | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [reindexingId, setReindexingId] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({
    titulo: '', categoria: 'general', institucion: '', idioma: 'es',
  });
  const [editForm, setEditForm] = useState({ titulo: '', categoria: '', idioma: '' });

  const { data: documentos, isLoading } = useQuery({
    queryKey: ['documentos-admin'],
    queryFn: () => documentsService.getAll(),
  });

  const { data: resumen } = useQuery({
    queryKey: ['documentos-resumen'],
    queryFn: documentsService.getResumen,
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => documentsService.uploadAndIndex(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-admin'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-resumen'] });
      setShowUpload(false);
      setFile(null);
      setUploadForm({ titulo: '', categoria: 'general', institucion: '', idioma: 'es' });
    },
  });

  const reindexMutation = useMutation({
    mutationFn: (id: string) => documentsService.reindex(id),
    onMutate: (id) => setReindexingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-admin'] });
      setReindexingId(null);
    },
    onError: () => setReindexingId(null),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => documentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-admin'] });
      setEditingDoc(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-admin'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-resumen'] });
    },
  });

  const handleUpload = () => {
    if (!file || !uploadForm.titulo) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('titulo', uploadForm.titulo);
    formData.append('categoria', uploadForm.categoria);
    if (uploadForm.institucion) formData.append('institucion', uploadForm.institucion);
    formData.append('idioma', uploadForm.idioma);
    uploadMutation.mutate(formData);
  };

  const handleEdit = (doc: DocumentoResponse) => {
    setEditingDoc(doc);
    setEditForm({ titulo: doc.titulo, categoria: doc.categoria, idioma: doc.idioma || 'es' });
  };

  const IndiceRagDetail = ({ docId }: { docId: string }) => {
    const { data: indice } = useQuery({
      queryKey: ['indice-rag', docId],
      queryFn: () => documentsService.getIndiceRag(docId),
      enabled: expandedId === docId,
    });

    if (!indice) return <p className="text-xs text-muted-foreground">Sin datos de indexación</p>;

    return (
      <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
        <div><p className="text-muted-foreground">Colección</p><p className="font-medium">{indice.nombre_coleccion}</p></div>
        <div><p className="text-muted-foreground">Chunks</p><p className="font-medium">{indice.cantidad_chunks}</p></div>
        <div><p className="text-muted-foreground">Tokens/chunk</p><p className="font-medium">{indice.tamano_chunk_tokens}</p></div>
        <div><p className="text-muted-foreground">Overlap</p><p className="font-medium">{indice.overlap_tokens} tokens</p></div>
        <div><p className="text-muted-foreground">Modelo embedding</p><p className="font-medium truncate">{indice.modelo_embedding}</p></div>
        <div><p className="text-muted-foreground">Dimensiones</p><p className="font-medium">{indice.dimensiones_embedding}</p></div>
        <div><p className="text-muted-foreground">Duración indexación</p><p className="font-medium">{indice.duracion_indexacion_ms}ms</p></div>
        <div><p className="text-muted-foreground">Estado índice</p><p className="font-medium">{indice.estado}</p></div>
        <div><p className="text-muted-foreground">Fecha indexación</p><p className="font-medium">{new Date(indice.fecha_indexacion).toLocaleDateString('es-CO')}</p></div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestión de Documentos RAG</h1>
          <p className="mt-1 text-sm text-muted-foreground">Panel de administración de documentos indexados</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Subir documento
        </button>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Total', value: resumen.total, color: 'text-gray-700' },
            { label: 'Indexados', value: resumen.indexados, color: 'text-green-700' },
            { label: 'Pendientes', value: resumen.pendientes_indexacion, color: 'text-yellow-700' },
            { label: 'Fallidos', value: resumen.fallidos, color: 'text-red-700' },
            { label: 'Activos', value: resumen.activos, color: 'text-blue-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border bg-card p-4 shadow-sm text-center">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Formulario upload */}
      {showUpload && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Subir documento</h2>
            <button onClick={() => { setShowUpload(false); setFile(null); }}><X className="h-5 w-5 text-muted-foreground" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Archivo (PDF o DOCX)</label>
              <input type="file" accept=".pdf,.docx,.doc"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none" />
              {file && <p className="mt-1 text-xs text-emerald-600">✅ {file.name} ({Math.round(file.size / 1024)} KB)</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Título</label>
                <input value={uploadForm.titulo} onChange={(e) => setUploadForm({ ...uploadForm, titulo: e.target.value })} className={inputClass} placeholder="Nombre del documento" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Categoría</label>
                <select value={uploadForm.categoria} onChange={(e) => setUploadForm({ ...uploadForm, categoria: e.target.value })} className={inputClass}>
                  <option value="general">General</option>
                  <option value="cafe">Café</option>
                  <option value="cacao">Cacao</option>
                  <option value="plagas">Plagas y enfermedades</option>
                  <option value="suelos">Suelos y fertilización</option>
                  <option value="clima">Clima</option>
                  <option value="normativa">Normativa ICA</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Institución</label>
                <input value={uploadForm.institucion} onChange={(e) => setUploadForm({ ...uploadForm, institucion: e.target.value })} className={inputClass} placeholder="ICA, AGROSAVIA, CENICAFÉ..." />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Idioma</label>
                <select value={uploadForm.idioma} onChange={(e) => setUploadForm({ ...uploadForm, idioma: e.target.value })} className={inputClass}>
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowUpload(false); setFile(null); }} className="h-10 rounded-lg border px-4 text-sm hover:bg-accent">Cancelar</button>
              <button onClick={handleUpload} disabled={!file || !uploadForm.titulo || uploadMutation.isPending}
                className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {uploadMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Indexando...</> : <><Upload className="h-4 w-4" /> Subir e indexar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar metadata */}
      {editingDoc && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Editar metadata</h2>
            <button onClick={() => setEditingDoc(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Título</label>
              <input value={editForm.titulo} onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Categoría</label>
              <select value={editForm.categoria} onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })} className={inputClass}>
                <option value="general">General</option>
                <option value="cafe">Café</option>
                <option value="cacao">Cacao</option>
                <option value="plagas">Plagas y enfermedades</option>
                <option value="suelos">Suelos y fertilización</option>
                <option value="clima">Clima</option>
                <option value="normativa">Normativa ICA</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setEditingDoc(null)} className="h-10 rounded-lg border px-4 text-sm hover:bg-accent">Cancelar</button>
            <button onClick={() => updateMutation.mutate({ id: editingDoc.documento_id, data: editForm })}
              disabled={updateMutation.isPending}
              className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit2 className="h-4 w-4" />}
              Guardar cambios
            </button>
          </div>
        </div>
      )}

      {/* Lista de documentos */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold">Documentos indexados ({documentos?.length || 0})</h2>
        </div>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
        ) : documentos && documentos.length > 0 ? (
          <div className="divide-y">
            {documentos.map((doc) => {
              const estado = estadoStyle[doc.estado_indexacion] || estadoStyle.pendiente;
              const isExpanded = expandedId === doc.documento_id;
              return (
                <div key={doc.documento_id}>
                  <div className="flex items-center justify-between px-5 py-4 hover:bg-muted/20">
                    <div className="flex items-start gap-3 cursor-pointer flex-1" onClick={() => setExpandedId(isExpanded ? null : doc.documento_id)}>
                      <div className="mt-0.5 rounded-lg bg-blue-50 p-2"><FileText className="h-4 w-4 text-blue-600" /></div>
                      <div>
                        <p className="text-sm font-medium">{doc.titulo}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${estado.bg} ${estado.text}`}>
                            {estado.icon}{estado.label}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{doc.categoria}</span>
                          <span className="text-[11px] text-muted-foreground">{doc.tipo_archivo?.toUpperCase()}</span>
                          <span className="text-[11px] text-muted-foreground">{doc.tamano_kb} KB</span>
                          {doc.chunks_indexados > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Database className="h-3 w-3" />{doc.chunks_indexados} chunks
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {new Date(doc.creado_en).toLocaleDateString('es-CO')}
                          {doc.subidoPor && ` · ${doc.subidoPor.nombre} ${doc.subidoPor.apellido}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button onClick={() => handleEdit(doc)} className="rounded-lg p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600" title="Editar metadata">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => reindexMutation.mutate(doc.documento_id)}
                        disabled={reindexingId === doc.documento_id}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-yellow-50 hover:text-yellow-600"
                        title="Re-indexar"
                      >
                        <RefreshCw className={`h-4 w-4 ${reindexingId === doc.documento_id ? 'animate-spin' : ''}`} />
                      </button>
                      <button onClick={() => { if (confirm('¿Eliminar este documento?')) deleteMutation.mutate(doc.documento_id); }}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-muted/10 px-5 py-4 space-y-3">
                      <p className="text-xs font-medium text-muted-foreground">Detalle índice RAG</p>
                      <IndiceRagDetail docId={doc.documento_id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-8 w-8 text-muted-foreground/30" />
            No hay documentos indexados. Sube el primero.
          </div>
        )}
      </div>
    </div>
  );
}