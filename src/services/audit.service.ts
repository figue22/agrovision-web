import { api } from '@/services/api';

export interface LogAuditoriaResponse {
  log_id: string;
  usuario_id?: string;
  accion: string;
  tipo_entidad: string;
  id_entidad?: string;
  valores_anteriores?: Record<string, unknown>;
  valores_nuevos?: Record<string, unknown>;
  direccion_ip?: string;
  metodo_http?: string;
  ruta_endpoint?: string;
  creado_en: string;
  usuario?: { nombre: string; apellido: string; correo: string };
}

export const auditService = {
  getAll: async (limit = 100): Promise<LogAuditoriaResponse[]> => {
    const response = await api.get<LogAuditoriaResponse[]>(`/audit?limit=${limit}`);
    return response.data;
  },
  getByUsuario: async (usuarioId: string, limit = 50): Promise<LogAuditoriaResponse[]> => {
    const response = await api.get<LogAuditoriaResponse[]>(`/audit/usuario/${usuarioId}?limit=${limit}`);
    return response.data;
  },
  getByEntidad: async (tipoEntidad: string, idEntidad: string): Promise<LogAuditoriaResponse[]> => {
    const response = await api.get<LogAuditoriaResponse[]>(`/audit/entidad/${tipoEntidad}/${idEntidad}`);
    return response.data;
  },
  getByDateRange: async (desde: string, hasta: string, limit = 200): Promise<LogAuditoriaResponse[]> => {
    const response = await api.get<LogAuditoriaResponse[]>(`/audit/rango?desde=${desde}&hasta=${hasta}&limit=${limit}`);
    return response.data;
  },
};