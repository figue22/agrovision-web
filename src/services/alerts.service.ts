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
  expira_en?: string;
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
  markAsUnread: async (id: string): Promise<AlertaResponse> => {
    const response = await api.patch<AlertaResponse>(`/alerts/${id}/unread`);
    return response.data;
  },
  markAllAsRead: async (): Promise<{ updated: number }> => {
    const response = await api.patch<{ updated: number }>('/alerts/my/read-all');
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/alerts/${id}`);
  },
  evaluateClimate: async (parcelaId: string): Promise<{ alertas_generadas: number }> => {
    const response = await api.post<{ alertas_generadas: number }>(`/weather/alerts/evaluate/${parcelaId}`);
    return response.data;
  },
  evaluateReminders: async (): Promise<{ recordatorios_generados: number }> => {
    const response = await api.post<{ recordatorios_generados: number }>('/weather/alerts/reminders');
    return response.data;
  },
  createSystemNotification: async (titulo: string, mensaje: string, usuario_ids?: string[]): Promise<{ notificaciones_creadas: number }> => {
    const response = await api.post<{ notificaciones_creadas: number }>('/alerts/system', { titulo, mensaje, usuario_ids });
    return response.data;
  },
};