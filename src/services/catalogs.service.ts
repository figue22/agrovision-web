import { api } from '@/services/api';

export interface CatalogoItem {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export const catalogsService = {
  findAll: async (tipo: string): Promise<CatalogoItem[]> => {
    const response = await api.get<CatalogoItem[]>(`/catalogs/${tipo}`);
    return response.data;
  },
  findOne: async (tipo: string, id: number): Promise<CatalogoItem> => {
    const response = await api.get<CatalogoItem>(`/catalogs/${tipo}/${id}`);
    return response.data;
  },
  create: async (tipo: string, data: Partial<CatalogoItem>): Promise<CatalogoItem> => {
    const response = await api.post<CatalogoItem>(`/catalogs/${tipo}`, data);
    return response.data;
  },
  update: async (tipo: string, id: number, data: Partial<CatalogoItem>): Promise<CatalogoItem> => {
    const response = await api.put<CatalogoItem>(`/catalogs/${tipo}/${id}`, data);
    return response.data;
  },
  remove: async (tipo: string, id: number): Promise<void> => {
    await api.delete(`/catalogs/${tipo}/${id}`);
  },
};