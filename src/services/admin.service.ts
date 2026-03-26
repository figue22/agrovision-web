import { api } from '@/services/api';

export interface UsuarioResponse {
  usuario_id: string;
  correo: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  rol: 'admin' | 'tecnico' | 'agricultor';
  tiene_2fa: boolean;
  esta_activo: boolean;
  ultimo_login?: string;
  creado_en: string;
}

export interface CreateUserRequest {
  correo: string;
  contrasena: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  rol: 'admin' | 'tecnico' | 'agricultor';
}

export interface ChangeRoleRequest {
  usuario_id: string;
  nuevo_rol: 'admin' | 'tecnico' | 'agricultor';
}

export interface ToggleStatusRequest {
  usuario_id: string;
  esta_activo: boolean;
}

export interface UserStats {
  rol: string;
  total: number;
}

export interface AsignacionResponse {
  asignacion_id: string;
  tecnico_id: string;
  agricultor_id: string;
  activa: boolean;
  notas?: string;
  fecha_asignacion: string;
  tecnico?: { nombre: string; apellido: string; correo: string };
  agricultor?: {
    agricultor_id: string;
    cedula: string;
    municipio: string;
    departamento: string;
    usuario?: { nombre: string; apellido: string; correo: string };
  };
}

export interface AsignarRequest {
  tecnico_id: string;
  agricultor_id: string;
  notas?: string;
}

export interface DesasignarRequest {
  tecnico_id: string;
  agricultor_id: string;
}

export const adminService = {
  // Usuarios
  getUsers: async (): Promise<UsuarioResponse[]> => {
    const response = await api.get<UsuarioResponse[]>('/admin/users');
    return response.data;
  },
  getUserById: async (id: string): Promise<UsuarioResponse> => {
    const response = await api.get<UsuarioResponse>(`/admin/users/${id}`);
    return response.data;
  },
  createUser: async (data: CreateUserRequest): Promise<UsuarioResponse> => {
    const response = await api.post<UsuarioResponse>('/admin/users', data);
    return response.data;
  },
  changeRole: async (data: ChangeRoleRequest): Promise<UsuarioResponse> => {
    const response = await api.put<UsuarioResponse>('/admin/users/role', data);
    return response.data;
  },
  toggleStatus: async (data: ToggleStatusRequest): Promise<UsuarioResponse> => {
    const response = await api.put<UsuarioResponse>('/admin/users/status', data);
    return response.data;
  },
  getStats: async (): Promise<UserStats[]> => {
    const response = await api.get<UserStats[]>('/admin/users/stats');
    return response.data;
  },

  // Asignaciones
  getAssignments: async (): Promise<AsignacionResponse[]> => {
    const response = await api.get<AsignacionResponse[]>('/admin/assignments');
    return response.data;
  },
  getAssignmentsByTecnico: async (tecnicoId: string): Promise<AsignacionResponse[]> => {
    const response = await api.get<AsignacionResponse[]>(`/admin/assignments/tecnico/${tecnicoId}`);
    return response.data;
  },
  assign: async (data: AsignarRequest): Promise<AsignacionResponse> => {
    const response = await api.post<AsignacionResponse>('/admin/assignments', data);
    return response.data;
  },
  unassign: async (data: DesasignarRequest): Promise<void> => {
    await api.delete('/admin/assignments', { data });
  },
};
