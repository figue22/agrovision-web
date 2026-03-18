import { api } from '@/services/api';

export interface DatosAgricultorRequest {
  cedula: string;
  direccion?: string;
  municipio: string;
  departamento: string;
  tamano_finca_ha?: number;
}

export interface RegisterRequest {
  correo: string;
  contrasena: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  agricultor?: DatosAgricultorRequest;
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  usuario: {
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
    agricultor?: {
      agricultor_id: string;
      cedula: string;
      direccion?: string;
      municipio: string;
      departamento: string;
      tamano_finca_ha?: number;
    };
  };
}

export const authService = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },
};
