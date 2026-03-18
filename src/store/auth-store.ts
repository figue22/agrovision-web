import { create } from 'zustand';

interface Agricultor {
  agricultor_id: string;
  cedula: string;
  direccion?: string;
  municipio: string;
  departamento: string;
  tamano_finca_ha?: number;
}

interface Usuario {
  usuario_id: string;
  correo: string;
  nombre: string;
  apellido: string;
  rol: 'admin' | 'tecnico' | 'agricultor';
  agricultor?: Agricultor;
}

interface AuthState {
  usuario: Usuario | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (usuario: Usuario, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  setAuth: (usuario, accessToken, refreshToken) =>
    set({ usuario, accessToken, refreshToken, isAuthenticated: true }),
  logout: () =>
    set({ usuario: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
}));
