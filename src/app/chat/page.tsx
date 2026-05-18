'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2, Trash2 } from 'lucide-react';
import { chatbotService, ChatMessage } from '@/services/chatbot.service';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [conversacionId, setConversacionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput('');
    setSending(true);

    setMessages((prev) => [...prev, { rol: 'usuario', contenido: userMsg, timestamp: new Date().toISOString() }]);

    try {
      const response = await chatbotService.sendMessage(userMsg, undefined, conversacionId || undefined);
      setConversacionId(response.conversacion_id);
      setMessages((prev) => [...prev, { rol: 'asistente', contenido: response.respuesta, timestamp: response.timestamp }]);
    } catch {
      setMessages((prev) => [...prev, { rol: 'asistente', contenido: 'Error al conectar con el chatbot. Intenta de nuevo.', timestamp: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  };

  const clearChat = async () => {
    if (conversacionId) {
      try { await chatbotService.clearConversation(conversacionId); } catch { /* ignore */ }
    }
    setMessages([]);
    setConversacionId(null);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chat IA Agrícola</h1>
          <p className="mt-1 text-sm text-muted-foreground">Consulta sobre tus cultivos, clima y recomendaciones</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
            <Trash2 className="h-3.5 w-3.5" /> Limpiar
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <MessageCircle className="h-12 w-12 text-muted-foreground/20" />
            <p className="text-sm">Haz una pregunta sobre agricultura</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['¿Cuándo debo regar mi café?', '¿Qué fertilizante usar para maíz?', '¿Cómo prevenir la roya?'].map((q) => (
                <button key={q} onClick={() => { setInput(q); }} className="rounded-full border px-3 py-1.5 text-xs hover:bg-accent">{q}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.rol === 'usuario' ? 'bg-emerald-600 text-white rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
              <p className="whitespace-pre-wrap">{msg.contenido}</p>
              <p className={`mt-1 text-[10px] ${msg.rol === 'usuario' ? 'text-emerald-200' : 'text-muted-foreground'}`}>
                {new Date(msg.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Pensando...
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
            placeholder="Escribe tu pregunta..."
            className="h-11 flex-1 rounded-xl border bg-background px-4 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
            disabled={sending}
          />
          <button onClick={sendMessage} disabled={sending || !input.trim()} className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}