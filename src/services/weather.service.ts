import { api } from '@/services/api';

export interface DatoClimaticoResponse {
  dato_climatico_id: string;
  parcela_id: string;
  fecha: string;
  temp_maxima?: number;
  temp_minima?: number;
  temp_promedio?: number;
  precipitacion_mm?: number;
  humedad_pct?: number;
  velocidad_viento?: number;
  indice_uv?: number;
  cobertura_nubes_pct?: number;
  fuente: string;
}

export interface PromediosResponse {
  temp_promedio: number;
  precipitacion_total: number;
  humedad_promedio: number;
  dias_registrados: number;
}

export const weatherService = {
  getByParcela: async (parcelaId: string, limit = 30): Promise<DatoClimaticoResponse[]> => {
    const response = await api.get<DatoClimaticoResponse[]>(`/weather/parcela/${parcelaId}?limit=${limit}`);
    return response.data;
  },
  getByDateRange: async (parcelaId: string, desde: string, hasta: string): Promise<DatoClimaticoResponse[]> => {
    const response = await api.get<DatoClimaticoResponse[]>(`/weather/parcela/${parcelaId}/rango?desde=${desde}&hasta=${hasta}`);
    return response.data;
  },
  getUltimo: async (parcelaId: string): Promise<DatoClimaticoResponse | null> => {
    const response = await api.get<DatoClimaticoResponse>(`/weather/parcela/${parcelaId}/ultimo`);
    return response.data;
  },
  getPromedios: async (parcelaId: string, desde: string, hasta: string): Promise<PromediosResponse> => {
    const response = await api.get<PromediosResponse>(`/weather/parcela/${parcelaId}/promedios?desde=${desde}&hasta=${hasta}`);
    return response.data;
  },
  fetchCurrent: async (parcelaId: string): Promise<DatoClimaticoResponse> => {
    const response = await api.get<DatoClimaticoResponse>(`/weather/parcela/${parcelaId}/fetch`);
    return response.data;
  },
  fetchForecast: async (parcelaId: string): Promise<DatoClimaticoResponse[]> => {
    const response = await api.get<DatoClimaticoResponse[]>(`/weather/parcela/${parcelaId}/forecast`);
    return response.data;
  },
};