import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: agregar token JWT a cada request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Rutas de auth que NO deben hacer logout en 401
const authRoutes = ['/auth/login', '/auth/login-2fa', '/auth/register', '/auth/2fa/verify', '/auth/2fa/disable'];

// Interceptor: manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthRoute = authRoutes.some((route) => requestUrl.includes(route));

    if (error.response?.status === 401 && !isAuthRoute) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  },
);