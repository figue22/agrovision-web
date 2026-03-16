import { create } from 'zustand';

interface Usuario {
  usuario_id: string;
  correo: string;
  nombre: string;
  apellido: string;
  rol: 'admin' | 'tecnico' | 'agricultor';
}

interface AuthState {
  usuario: Usuario | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (usuario: Usuario, accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (usuario, accessToken) =>
    set({ usuario, accessToken, isAuthenticated: true }),
  logout: () =>
    set({ usuario: null, accessToken: null, isAuthenticated: false }),
}));
