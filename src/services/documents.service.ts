import { api } from '@/services/api';

export interface DocumentoResponse {
  documento_id: string;
  titulo: string;
  categoria: string;
  tipo_archivo: string;
  tamano_kb: number;
  idioma?: string;
  estado_indexacion: string;
  chunks_indexados: number;
  esta_activo: boolean;
  creado_en: string;
  parcela_id?: string;
  subido_por_id?: string;
  subidoPor?: { nombre: string; apellido: string };
  parcela?: { nombre: string };
  indiceRag?: IndiceRagResponse;
}

export interface IndiceRagResponse {
  indice_rag_id: string;
  nombre_coleccion: string;
  cantidad_chunks: number;
  tamano_chunk_tokens: number;
  overlap_tokens: number;
  modelo_embedding: string;
  dimensiones_embedding: number;
  ids_vectores: object;
  fecha_indexacion: string;
  fecha_reindexacion?: string;
  duracion_indexacion_ms: number;
  estado: string;
}

export interface ResumenDocumentosResponse {
  total: number;
  activos: number;
  pendientes_indexacion: number;
  indexados: number;
  fallidos: number;
}

export const documentsService = {
  getAll: async (limit = 50): Promise<DocumentoResponse[]> => {
    const response = await api.get<DocumentoResponse[]>(`/documents?limit=${limit}`);
    return response.data;
  },
  getResumen: async (): Promise<ResumenDocumentosResponse> => {
    const response = await api.get<ResumenDocumentosResponse>('/documents/resumen');
    return response.data;
  },
  getById: async (id: string): Promise<DocumentoResponse> => {
    const response = await api.get<DocumentoResponse>(`/documents/${id}`);
    return response.data;
  },
  getIndiceRag: async (id: string): Promise<IndiceRagResponse> => {
    const response = await api.get<IndiceRagResponse>(`/documents/${id}/indice-rag`);
    return response.data;
  },
  uploadAndIndex: async (formData: FormData): Promise<DocumentoResponse> => {
    const response = await api.post<DocumentoResponse>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  update: async (id: string, data: Partial<DocumentoResponse>): Promise<DocumentoResponse> => {
    const response = await api.put<DocumentoResponse>(`/documents/${id}`, data);
    return response.data;
  },
  reindex: async (id: string): Promise<DocumentoResponse> => {
    const response = await api.post<DocumentoResponse>(`/documents/${id}/reindex`);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },
};