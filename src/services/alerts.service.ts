import { api } from '@/services/api';

export interface AlertaResponse {
  alerta_id: string;
  parcela_id?: string;
  usuario_id: string;
  tipo_alerta_id: number;
  severidad: string;
  titulo: string;
  mensaje: string;
  accion_requerida?: string;
  esta_leida: boolean;
  fecha_lectura?: string;
  creado_en: string;
  tipoAlerta?: { id: number; nombre: string };
  parcela?: { parcela_id: string; nombre: string };
}

export const alertsService = {
  getMy: async (): Promise<AlertaResponse[]> => {
    const response = await api.get<AlertaResponse[]>('/alerts/my');
    return response.data;
  },
  getUnread: async (): Promise<AlertaResponse[]> => {
    const response = await api.get<AlertaResponse[]>('/alerts/my/unread');
    return response.data;
  },
  countUnread: async (): Promise<{ count: number }> => {
    const response = await api.get<{ count: number }>('/alerts/my/unread/count');
    return response.data;
  },
  getAll: async (): Promise<AlertaResponse[]> => {
    const response = await api.get<AlertaResponse[]>('/alerts/all');
    return response.data;
  },
  getById: async (id: string): Promise<AlertaResponse> => {
    const response = await api.get<AlertaResponse>(`/alerts/${id}`);
    return response.data;
  },
  markAsRead: async (id: string): Promise<AlertaResponse> => {
    const response = await api.patch<AlertaResponse>(`/alerts/${id}/read`);
    return response.data;
  },
  markAllAsRead: async (): Promise<{ updated: number }> => {
    const response = await api.patch<{ updated: number }>('/alerts/my/read-all');
    return response.data;
  },
};