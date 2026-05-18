import { api } from '@/services/api';

export interface ChatResponse {
  conversacion_id: string;
  respuesta: string;
  fuentes?: string[];
  timestamp: string;
}

export interface ChatMessage {
  rol: 'usuario' | 'asistente';
  contenido: string;
  timestamp: string;
}

export const chatbotService = {
  sendMessage: async (mensaje: string, parcelaId?: string, conversacionId?: string): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/chatbot/message', {
      mensaje,
      parcela_id: parcelaId,
      conversacion_id: conversacionId,
    });
    return response.data;
  },
  getHistorial: async (conversacionId: string): Promise<ChatMessage[]> => {
    const response = await api.get<ChatMessage[]>(`/chatbot/historial/${conversacionId}`);
    return response.data;
  },
  clearConversation: async (conversacionId: string): Promise<void> => {
    await api.delete(`/chatbot/conversacion/${conversacionId}`);
  },
};