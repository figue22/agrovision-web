import { api } from '@/services/api';

export interface RecomendacionResponse {
  recomendacion_id: string;
  prediccion_id: string;
  tipo_recomendacion_id: number;
  prioridad: string;
  titulo: string;
  descripcion: string;
  estado_implementacion: string;
  feedback_agricultor?: string;
  calificacion_eficacia?: number;
  fecha_implementacion?: string;
  tipoRecomendacion?: { id: number; nombre: string };
  prediccion?: { parcela_id: string; fecha_prediccion: string };
}

export interface UpdateRecomendacionRequest {
  estado_implementacion?: string;
  fecha_implementacion?: string;
  feedback_agricultor?: string;
  calificacion_eficacia?: number;
}

export const recommendationsService = {
  getPendientes: async (): Promise<RecomendacionResponse[]> => {
    const response = await api.get<RecomendacionResponse[]>('/recommendations/pendientes');
    return response.data;
  },
  getByParcela: async (parcelaId: string): Promise<RecomendacionResponse[]> => {
    const response = await api.get<RecomendacionResponse[]>(`/recommendations/parcela/${parcelaId}`);
    return response.data;
  },
  getByPrediccion: async (prediccionId: string): Promise<RecomendacionResponse[]> => {
    const response = await api.get<RecomendacionResponse[]>(`/recommendations/prediccion/${prediccionId}`);
    return response.data;
  },
  getById: async (id: string): Promise<RecomendacionResponse> => {
    const response = await api.get<RecomendacionResponse>(`/recommendations/${id}`);
    return response.data;
  },
  update: async (id: string, data: UpdateRecomendacionRequest): Promise<RecomendacionResponse> => {
    const response = await api.put<RecomendacionResponse>(`/recommendations/${id}`, data);
    return response.data;
  },
  getAll: async (limit = 50): Promise<RecomendacionResponse[]> => {
    const response = await api.get<RecomendacionResponse[]>(`/recommendations/all?limit=${limit}`);
    return response.data;
  },
  generar: async (prediccionId: string): Promise<RecomendacionResponse[]> => {
    const response = await api.post<RecomendacionResponse[]>(`/recommendations/generar/${prediccionId}`);
    return response.data;
  },
};