import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { ApiResponse, PaginatedResponse } from '@/types';

// ── GET genérico ──
export function useApiQuery<T>(key: string[], url: string, enabled = true) {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<T>>(url);
      return data.data;
    },
    enabled,
  });
}

// ── GET paginado ──
export function useApiPaginatedQuery<T>(
  key: string[],
  url: string,
  page: number,
  limit: number,
) {
  return useQuery<PaginatedResponse<T>>({
    queryKey: [...key, page, limit],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResponse<T>>>(url, {
        params: { page, limit },
      });
      return data.data;
    },
  });
}

// ── POST genérico ──
export function useApiMutation<TData, TVariables>(
  url: string,
  invalidateKeys?: string[][],
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      const { data } = await api.post<ApiResponse<TData>>(url, variables);
      return data.data;
    },
    onSuccess: () => {
      invalidateKeys?.forEach((key) => {
        void queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

// ── PUT genérico ──
export function useApiUpdate<TData, TVariables>(
  url: string,
  invalidateKeys?: string[][],
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      const { data } = await api.put<ApiResponse<TData>>(url, variables);
      return data.data;
    },
    onSuccess: () => {
      invalidateKeys?.forEach((key) => {
        void queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

// ── DELETE genérico ──
export function useApiDelete<TData>(url: string, invalidateKeys?: string[][]) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, void>({
    mutationFn: async () => {
      const { data } = await api.delete<ApiResponse<TData>>(url);
      return data.data;
    },
    onSuccess: () => {
      invalidateKeys?.forEach((key) => {
        void queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}
