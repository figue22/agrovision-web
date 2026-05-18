import { api } from '@/services/api';

export interface PrediccionResponse {
  prediccion_id: string;
  parcela_id: string;
  tipo_cultivo_id: string;
  version_modelo: string;
  tipo_modelo: string;
  rendimiento_predicho_ton: number;
  puntaje_confianza?: number;
  intervalo_conf_inferior?: number;
  intervalo_conf_superior?: number;
  nivel_riesgo: string;
  factores_riesgo?: Record<string, unknown>;
  fecha_prediccion: string;
  tipoCultivo?: { nombre: string };
  parcela?: { nombre: string };
  recomendaciones?: { recomendacion_id: string; titulo: string; prioridad: string }[];
}

export const predictionsService = {
  getByParcela: async (parcelaId: string): Promise<PrediccionResponse[]> => {
    const response = await api.get<PrediccionResponse[]>(`/predictions/parcela/${parcelaId}`);
    return response.data;
  },
  getLatest: async (parcelaId: string): Promise<PrediccionResponse | null> => {
    const response = await api.get<PrediccionResponse>(`/predictions/parcela/${parcelaId}/latest`);
    return response.data;
  },
  getById: async (id: string): Promise<PrediccionResponse> => {
    const response = await api.get<PrediccionResponse>(`/predictions/${id}`);
    return response.data;
  },
  getAll: async (limit = 50): Promise<PrediccionResponse[]> => {
    const response = await api.get<PrediccionResponse[]>(`/predictions/all?limit=${limit}`);
    return response.data;
  },
};