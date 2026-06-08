import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4001';

export interface ChatMessage {
  rol: 'usuario' | 'asistente';
  contenido: string;
  timestamp: string;
  fuentes?: { titulo: string; pagina?: number; score: number }[];
  tipo?: string;
}

export interface ChatResponse {
  conversacion_id: string;
  respuesta: string;
  fuentes?: { titulo: string; pagina?: number; score: number }[];
  tipo: string;
  timestamp: string;
}

class ChatSocketService {
  private socket: Socket | null = null;

  connect(token: string): Socket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(`${BACKEND_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });

    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const chatSocketService = new ChatSocketService();