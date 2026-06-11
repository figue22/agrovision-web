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

// Rutas que NO deben intentar refresh ni hacer logout en 401
const authRoutes = [
  '/auth/login',
  '/auth/login-2fa',
  '/auth/register',
  '/auth/refresh',
  '/auth/2fa/verify',
  '/auth/2fa/disable',
];

// Control para evitar múltiples refresh simultáneos
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor: manejar errores con refresh automático de token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const isAuthRoute = authRoutes.some((route) => requestUrl.includes(route));

    // Si no es 401, es ruta de auth, o ya reintentamos: rechazar directo
    if (error.response?.status !== 401 || isAuthRoute || originalRequest._retry) {
      return Promise.reject(error);
    }

    const { refreshToken, setAuth, usuario } = useAuthStore.getState();

    // Sin refresh token o usuario: cerrar sesión
    if (!refreshToken || !usuario) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // Si ya hay un refresh en curso, encolar el request y esperar
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Usar axios directo (sin interceptores) para evitar loop infinito
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token: newRefreshToken } = response.data;

      // Actualizar store con los nuevos tokens
      setAuth(usuario, access_token, newRefreshToken);

      // Reintentar todos los requests encolados con el nuevo token
      processQueue(null, access_token);

      // Reintentar el request original
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh falló (token expirado o inválido): cerrar sesión
      processQueue(refreshError, null);
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);