import { api } from '@/services/api';

export interface Ubicacion {
  latitud: number;
  longitud: number;
}

export interface ParcelaResponse {
  parcela_id: string;
  agricultor_id: string;
  nombre: string;
  ubicacion: Ubicacion;
  area_hectareas: number;
  tipo_suelo?: string;
  ph_suelo?: number;
  altitud_msnm?: number;
  limites_geojson?: { type: 'Polygon'; coordinates: number[][][] };
  creado_en: string;
  actualizado_en: string;
  agricultor?: {
    agricultor_id: string;
    cedula: string;
    municipio: string;
    departamento: string;
    usuario?: {
      nombre: string;
      apellido: string;
      correo: string;
    };
  };
}

export interface CreateParcelaRequest {
  nombre: string;
  ubicacion: Ubicacion;
  area_hectareas: number;
  tipo_suelo?: string;
  ph_suelo?: number;
  altitud_msnm?: number;
  limites_geojson?: { type: 'Polygon'; coordinates: number[][][] };
}

export interface UpdateParcelaRequest {
  nombre?: string;
  ubicacion?: Ubicacion;
  area_hectareas?: number;
  tipo_suelo?: string;
  ph_suelo?: number;
  altitud_msnm?: number;
  limites_geojson?: { type: 'Polygon'; coordinates: number[][][] };
}

export const parcelasService = {
  // Mis parcelas (agricultor)
  getMyParcelas: async (): Promise<ParcelaResponse[]> => {
    const response = await api.get<ParcelaResponse[]>('/parcels/my');
    return response.data;
  },

  // Todas las parcelas (admin/tecnico)
  getAll: async (): Promise<ParcelaResponse[]> => {
    const response = await api.get<ParcelaResponse[]>('/parcels');
    return response.data;
  },

  // Una parcela por ID
  getById: async (id: string): Promise<ParcelaResponse> => {
    const response = await api.get<ParcelaResponse>(`/parcels/${id}`);
    return response.data;
  },

  // Crear parcela
  create: async (data: CreateParcelaRequest): Promise<ParcelaResponse> => {
    const response = await api.post<ParcelaResponse>('/parcels', data);
    return response.data;
  },

  // Actualizar parcela
  update: async (id: string, data: UpdateParcelaRequest): Promise<ParcelaResponse> => {
    const response = await api.put<ParcelaResponse>(`/parcels/${id}`, data);
    return response.data;
  },

  // Eliminar parcela
  delete: async (id: string): Promise<void> => {
    await api.delete(`/parcels/${id}`);
  },

  // Buscar cercanas
  getNearby: async (lat: number, lng: number, radioKm = 10): Promise<ParcelaResponse[]> => {
    const response = await api.get<ParcelaResponse[]>('/parcels/nearby', {
      params: { lat, lng, radio_km: radioKm },
    });
    return response.data;
  },
};
