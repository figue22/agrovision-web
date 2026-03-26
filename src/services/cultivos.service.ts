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
  parcela?: {
    parcela_id: string;
    nombre: string;
    area_hectareas: number;
  };
  tipoCultivo?: {
    tipo_cultivo_id: string;
    nombre: string;
    nombre_cientifico?: string;
    categoria?: string;
    dias_crecimiento_prom?: number;
  };
}

export interface TipoCultivoResponse {
  tipo_cultivo_id: string;
  nombre: string;
  nombre_cientifico?: string;
  categoria?: string;
  dias_crecimiento_prom?: number;
  temp_optima_min?: number;
  temp_optima_max?: number;
  req_agua?: string;
}

export const cultivosService = {
  getMyCultivos: async (): Promise<CultivoParcelaResponse[]> => {
    const response = await api.get<CultivoParcelaResponse[]>('/crops/my');
    return response.data;
  },

  getCultivosByParcela: async (parcelaId: string): Promise<CultivoParcelaResponse[]> => {
    const response = await api.get<CultivoParcelaResponse[]>(`/crops/parcela/${parcelaId}`);
    return response.data;
  },

  getTiposCultivo: async (): Promise<TipoCultivoResponse[]> => {
    const response = await api.get<TipoCultivoResponse[]>('/crops/tipos');
    return response.data;
  },

  getAll: async (): Promise<CultivoParcelaResponse[]> => {
  const response = await api.get<CultivoParcelaResponse[]>('/crops/all');
  return response.data;
  },
  
};
