import { api } from '@/services/api';

export interface ActividadResponse {
  actividad_id: string;
  parcela_id: string;
  tipo_actividad_id: number;
  descripcion?: string;
  cantidad?: number;
  unidad?: string;
  costo_cop?: number;
  fecha_realizacion: string;
  notas?: string;
  tipoActividad?: { id: number; nombre: string };
  insumos?: InsumoResponse[];
  realizadaPor?: { nombre: string; apellido: string };
  parcela?: { parcela_id: string; nombre: string };
}

export interface InsumoResponse {
  insumo_actividad_id: string;
  nombre_insumo: string;
  tipo_insumo_id: number;
  cantidad: number;
  unidad: string;
  costo_unitario_cop?: number;
  marca?: string;
}

export interface CreateActividadRequest {
  parcela_id: string;
  tipo_actividad_id: number;
  descripcion?: string;
  cantidad?: number;
  unidad?: string;
  costo_cop?: number;
  fecha_realizacion: string;
  notas?: string;
  insumos?: {
    nombre_insumo: string;
    tipo_insumo_id: number;
    cantidad: number;
    unidad: string;
    costo_unitario_cop?: number;
    marca?: string;
  }[];
}

export interface ResumenActividadesResponse {
  total_actividades: number;
  costo_total_cop: number;
  por_tipo: { tipo: string; cantidad: number }[];
}

export const activitiesService = {
  getByParcela: async (parcelaId: string): Promise<ActividadResponse[]> => {
    const response = await api.get<ActividadResponse[]>(`/activities/parcela/${parcelaId}`);
    return response.data;
  },
  getByDateRange: async (parcelaId: string, desde: string, hasta: string): Promise<ActividadResponse[]> => {
    const response = await api.get<ActividadResponse[]>(`/activities/parcela/${parcelaId}/rango?desde=${desde}&hasta=${hasta}`);
    return response.data;
  },
  getResumen: async (parcelaId: string): Promise<ResumenActividadesResponse> => {
    const response = await api.get<ResumenActividadesResponse>(`/activities/parcela/${parcelaId}/resumen`);
    return response.data;
  },
  getById: async (id: string): Promise<ActividadResponse> => {
    const response = await api.get<ActividadResponse>(`/activities/${id}`);
    return response.data;
  },
  create: async (data: CreateActividadRequest): Promise<ActividadResponse> => {
    const response = await api.post<ActividadResponse>('/activities', data);
    return response.data;
  },
  update: async (id: string, data: Partial<CreateActividadRequest>): Promise<ActividadResponse> => {
    const response = await api.put<ActividadResponse>(`/activities/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/activities/${id}`);
  },
};