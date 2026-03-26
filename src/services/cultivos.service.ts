import { api } from '@/services/api';

export interface CultivoParcelaResponse {
  cultivo_parcela_id: string;
  parcela_id: string;
  tipo_cultivo_id: string;
  fecha_siembra: string;
  fecha_cosecha_esperada?: string;
  fecha_cosecha_real?: string;
  area_sembrada_ha?: number;
  rendimiento_esperado_ton?: number;
  rendimiento_real_ton?: number;
  estado: string;
  temporada?: string;
  notas?: string;
  creado_en: string;
  parcela?: { parcela_id: string; nombre: string; area_hectareas: number };
  tipoCultivo?: { tipo_cultivo_id: string; nombre: string; nombre_cientifico?: string; categoria?: string; dias_crecimiento_prom?: number };
}

export interface TipoCultivoResponse {
  tipo_cultivo_id: string;
  nombre: string;
  nombre_cientifico?: string;
  categoria?: string;
  dias_crecimiento_prom?: number;
  temp_optima_min?: number;
  temp_optima_max?: number;
  altitud_optima_min?: number;
  altitud_optima_max?: number;
  ph_optimo_min?: number;
  ph_optimo_max?: number;
  req_agua?: string;
}

export interface CreateCultivoRequest {
  parcela_id: string;
  tipo_cultivo_id: string;
  fecha_siembra: string;
  fecha_cosecha_esperada?: string;
  area_sembrada_ha?: number;
  rendimiento_esperado_ton?: number;
  estado?: string;
  temporada?: string;
  notas?: string;
}

export interface UpdateCultivoRequest {
  fecha_cosecha_esperada?: string;
  fecha_cosecha_real?: string;
  area_sembrada_ha?: number;
  rendimiento_esperado_ton?: number;
  rendimiento_real_ton?: number;
  estado?: string;
  temporada?: string;
  notas?: string;
}

export interface CreateTipoCultivoRequest {
  nombre: string;
  nombre_cientifico?: string;
  categoria?: string;
  dias_crecimiento_prom?: number;
  temp_optima_min?: number;
  temp_optima_max?: number;
  altitud_optima_min?: number;
  altitud_optima_max?: number;
  ph_optimo_min?: number;
  ph_optimo_max?: number;
  req_agua?: string;
}

export interface UpdateTipoCultivoRequest {
  nombre?: string;
  nombre_cientifico?: string;
  categoria?: string;
  dias_crecimiento_prom?: number;
  temp_optima_min?: number;
  temp_optima_max?: number;
  altitud_optima_min?: number;
  altitud_optima_max?: number;
  ph_optimo_min?: number;
  ph_optimo_max?: number;
  req_agua?: string;
}

export const cultivosService = {
  // Cultivos parcela
  getMyCultivos: async (): Promise<CultivoParcelaResponse[]> => {
    const response = await api.get<CultivoParcelaResponse[]>('/crops/my');
    return response.data;
  },
  getAll: async (): Promise<CultivoParcelaResponse[]> => {
    const response = await api.get<CultivoParcelaResponse[]>('/crops/all');
    return response.data;
  },
  getCultivosByParcela: async (parcelaId: string): Promise<CultivoParcelaResponse[]> => {
    const response = await api.get<CultivoParcelaResponse[]>(`/crops/parcela/${parcelaId}`);
    return response.data;
  },
  getById: async (id: string): Promise<CultivoParcelaResponse> => {
    const response = await api.get<CultivoParcelaResponse>(`/crops/parcela/cultivo/${id}`);
    return response.data;
  },
  create: async (data: CreateCultivoRequest): Promise<CultivoParcelaResponse> => {
    const response = await api.post<CultivoParcelaResponse>('/crops/parcela', data);
    return response.data;
  },
  update: async (id: string, data: UpdateCultivoRequest): Promise<CultivoParcelaResponse> => {
    const response = await api.put<CultivoParcelaResponse>(`/crops/parcela/cultivo/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/crops/parcela/cultivo/${id}`);
  },

  // Tipos de cultivo (catálogo)
  getTiposCultivo: async (): Promise<TipoCultivoResponse[]> => {
    const response = await api.get<TipoCultivoResponse[]>('/crops/tipos');
    return response.data;
  },
  createTipoCultivo: async (data: CreateTipoCultivoRequest): Promise<TipoCultivoResponse> => {
    const response = await api.post<TipoCultivoResponse>('/crops/tipos', data);
    return response.data;
  },
  updateTipoCultivo: async (id: string, data: UpdateTipoCultivoRequest): Promise<TipoCultivoResponse> => {
    const response = await api.put<TipoCultivoResponse>(`/crops/tipos/${id}`, data);
    return response.data;
  },
  deleteTipoCultivo: async (id: string): Promise<void> => {
    await api.delete(`/crops/tipos/${id}`);
  },
};
