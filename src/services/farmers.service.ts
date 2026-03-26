import { api } from '@/services/api';

export interface AgricultorProfileResponse {
  agricultor_id: string;
  usuario_id: string;
  cedula: string;
  direccion?: string;
  municipio: string;
  departamento: string;
  tamano_finca_ha?: number;
  creado_en: string;
  actualizado_en: string;
  usuario?: {
    nombre: string;
    apellido: string;
    correo: string;
    telefono?: string;
  };
}

export interface UpdateAgricultorRequest {
  direccion?: string;
  municipio?: string;
  departamento?: string;
  tamano_finca_ha?: number;
}

export const farmersService = {
  getMyProfile: async (): Promise<AgricultorProfileResponse> => {
    const response = await api.get<AgricultorProfileResponse>('/farmers/profile');
    return response.data;
  },
  updateMyProfile: async (data: UpdateAgricultorRequest): Promise<AgricultorProfileResponse> => {
    const response = await api.put<AgricultorProfileResponse>('/farmers/profile', data);
    return response.data;
  },
  getAll: async (): Promise<AgricultorProfileResponse[]> => {
    const response = await api.get<AgricultorProfileResponse[]>('/farmers');
    return response.data;
  },
};
