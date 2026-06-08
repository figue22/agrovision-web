'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle, Send, Loader2, Trash2,
  FileText, ChevronDown, ChevronUp, Wifi, WifiOff,
} from 'lucide-react';
import { chatSocketService, ChatMessage, ChatResponse } from '@/services/chat.service';
import { useAuthStore } from '@/store/auth-store';
import { parcelasService } from '@/services/parcelas.service';
import { useQuery } from '@tanstack/react-query';
import { Socket } from 'socket.io-client';

const QUICK_QUESTIONS = [
  '¿Cuál es mi última predicción?',
  '¿Tengo alertas activas?',
  '¿Cómo está el clima hoy?',
  '¿Qué recomendaciones tengo?',
];

const tipoColor: Record<string, string> = {
  saludo: 'bg-emerald-50 text-emerald-700',
  prediccion: 'bg-blue-50 text-blue-700',
  alerta: 'bg-red-50 text-red-700',
  clima: 'bg-cyan-50 text-cyan-700',
  rag: 'bg-purple-50 text-purple-700',
  actividad: 'bg-yellow-50 text-yellow-700',
  recomendacion: 'bg-orange-50 text-orange-700',
};

function FuentesPanel({ fuentes }: { fuentes: NonNullable<ChatMessage['fuentes']> }) {
  const [open, setOpen] = useState(false);
  if (!fuentes.length) return null;

  return (
    <div className="mt-2">
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground">
        <FileText className="h-3.5 w-3.5" />
        {fuentes.length} fuente{fuentes.length > 1 ? 's' : ''}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {fuentes.map((f, i) => (
            <div key={i} className="rounded-lg border bg-background px-3 py-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">{f.titulo}</span>
                <div className="flex gap-2 text-[10px] text-muted-foreground">
                  {f.pagina && <span>p.{f.pagina}</span>}
                  <span>{(f.score * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const { usuario, accessToken } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const [connected, setConnected] = useState(false);
  const [conversacionId, setConversacionId] = useState<string | undefined>();
  const [selectedParcela, setSelectedParcela] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: parcelas } = useQuery({
    queryKey: ['parcelas-chat'],
    queryFn: usuario?.rol === 'agricultor' ? parcelasService.getMyParcelas : parcelasService.getAll,
  });

  const parcela = parcelas?.find((p) => p.parcela_id === selectedParcela);

  // Conectar WebSocket
  useEffect(() => {
    if (!accessToken) return;

    const socket = chatSocketService.connect(accessToken || '');
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('escribiendo', (data: { estado: boolean }) => {
      setEscribiendo(data.estado);
    });

    socket.on('respuesta', (data: ChatResponse) => {
      setConversacionId(data.conversacion_id);
      setMessages((prev) => [...prev, {
        rol: 'asistente',
        contenido: data.respuesta,
        timestamp: data.timestamp,
        fuentes: data.fuentes,
        tipo: data.tipo,
      }]);
      setEscribiendo(false);
    });

    socket.on('error_chat', (data: { mensaje: string }) => {
      setMessages((prev) => [...prev, {
        rol: 'asistente',
        contenido: `Error: ${data.mensaje}`,
        timestamp: new Date().toISOString(),
      }]);
      setEscribiendo(false);
    });

    return () => {
      chatSocketService.disconnect();
    };
  }, [accessToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, escribiendo]);

  const sendMessage = useCallback((texto?: string) => {
    const msg = (texto || input).trim();
    if (!msg || !socketRef.current?.connected) return;

    setInput('');
    setMessages((prev) => [...prev, {
      rol: 'usuario',
      contenido: msg,
      timestamp: new Date().toISOString(),
    }]);

    socketRef.current.emit('mensaje', {
      mensaje: msg,
      conversacion_id: conversacionId,
      usuario_id: usuario?.usuario_id,
      cultivo: (parcela as any)?.cultivos?.[0]?.tipoCultivo?.nombre?.toLowerCase(),
      region: (parcela as any)?.departamento,
      nombre_usuario: usuario ? `${usuario.nombre} ${usuario.apellido}` : undefined,
    });
  }, [input, conversacionId, usuario, parcela]);

  const clearChat = () => {
    if (conversacionId && socketRef.current) {
      socketRef.current.emit('limpiar', { conversacion_id: conversacionId });
    }
    setMessages([]);
    setConversacionId(undefined);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Chat IA</h1>
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Asistente agrícola con IA</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedParcela} onChange={(e) => setSelectedParcela(e.target.value)}
            className="h-9 rounded-lg border bg-background px-2 text-xs outline-none focus:border-emerald-300">
            <option value="">Sin parcela</option>
            {parcelas?.map((p) => (
              <option key={p.parcela_id} value={p.parcela_id}>{p.nombre}</option>
            ))}
          </select>
          {messages.length > 0 && (
            <button onClick={clearChat}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-muted-foreground hover:bg-accent">
              <Trash2 className="h-3.5 w-3.5" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <MessageCircle className="h-12 w-12 text-muted-foreground/20" />
            <p className="text-sm">¿En qué puedo ayudarte hoy?</p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="rounded-full border px-3 py-1.5 text-xs hover:bg-accent">{q}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              msg.rol === 'usuario'
                ? 'bg-emerald-600 text-white rounded-br-md'
                : 'bg-muted rounded-bl-md'
            }`}>
              <p className="whitespace-pre-wrap">{msg.contenido}</p>
              <div className={`mt-1 flex items-center gap-2 text-[10px] ${
                msg.rol === 'usuario' ? 'text-emerald-200' : 'text-muted-foreground'
              }`}>
                {new Date(msg.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                {msg.tipo && msg.rol === 'asistente' && (
                  <span className={`rounded-full px-1.5 py-0.5 ${tipoColor[msg.tipo] || tipoColor.rag}`}>
                    {msg.tipo}
                  </span>
                )}
              </div>
              {msg.rol === 'asistente' && msg.fuentes && msg.fuentes.length > 0 && (
                <FuentesPanel fuentes={msg.fuentes} />
              )}
            </div>
          </div>
        ))}

        {escribiendo && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              AgroVision está escribiendo...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t pt-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={connected ? 'Escribe tu consulta agrícola...' : 'Conectando...'}
            disabled={!connected}
            className="h-11 flex-1 rounded-xl border bg-background px-4 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200 disabled:opacity-50"
          />
          <button onClick={() => sendMessage()} disabled={!connected || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground text-center">
          Selecciona una parcela para respuestas personalizadas
        </p>
      </div>
    </div>
  );
}