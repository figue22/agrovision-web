'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MessageCircle, Send, Loader2, Trash2, Star,
  FileText, ChevronDown, ChevronUp, BookOpen,
} from 'lucide-react';
import { ragService, RagQueryResponse, SourceReference } from '@/services/rag.service';
import { useAuthStore } from '@/store/auth-store';
import { parcelasService } from '@/services/parcelas.service';
import { useQuery } from '@tanstack/react-query';

interface Message {
  rol: 'usuario' | 'asistente';
  contenido: string;
  timestamp: string;
  ragResponse?: RagQueryResponse;
  rating?: number;
}

function StarRating({ onRate, rating }: { onRate: (r: number) => void; rating?: number }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1 mt-2">
      <span className="text-[11px] text-muted-foreground mr-1">¿Fue útil?</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRate(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-colors"
        >
          <Star
            className={`h-4 w-4 ${
              star <= (hover || rating || 0)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        </button>
      ))}
      {rating && <span className="text-[11px] text-muted-foreground ml-1">¡Gracias!</span>}
    </div>
  );
}

function FuentesPanel({ fuentes }: { fuentes: SourceReference[] }) {
  const [open, setOpen] = useState(false);
  if (!fuentes || fuentes.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
      >
        <BookOpen className="h-3.5 w-3.5" />
        {fuentes.length} fuente{fuentes.length > 1 ? 's' : ''} consultada{fuentes.length > 1 ? 's' : ''}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {fuentes.map((f, i) => (
            <div key={i} className="rounded-lg border bg-background p-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-medium">{f.titulo}</span>
                  {f.institucion && <span className="text-muted-foreground">— {f.institucion}</span>}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {f.pagina && <span>p. {f.pagina}</span>}
                  <span>{(f.score * 100).toFixed(0)}% relevancia</span>
                </div>
              </div>
              <p className="mt-1.5 text-muted-foreground line-clamp-2">{f.chunk_text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RagPage() {
  const { usuario } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedParcela, setSelectedParcela] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const { data: parcelas } = useQuery({
    queryKey: ['parcelas-rag'],
    queryFn: usuario?.rol === 'agricultor' ? parcelasService.getMyParcelas : parcelasService.getAll,
  });

  const parcela = parcelas?.find((p) => p.parcela_id === selectedParcela);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput('');
    setSending(true);

    setMessages((prev) => [...prev, {
      rol: 'usuario',
      contenido: userMsg,
      timestamp: new Date().toISOString(),
    }]);

    try {
      const response = await ragService.query({
        pregunta: userMsg,
        top_k: 5,
        cultivo: (parcela as any)?.cultivos?.[0]?.tipoCultivo?.nombre?.toLowerCase() || undefined,
        region: (parcela as any)?.departamento || undefined,
        nombre_agricultor: usuario ? `${usuario.nombre} ${usuario.apellido}` : undefined,
        parcela_nombre: parcela?.nombre || undefined,
      });

      setMessages((prev) => [...prev, {
        rol: 'asistente',
        contenido: response.respuesta,
        timestamp: response.timestamp,
        ragResponse: response,
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        rol: 'asistente',
        contenido: 'Error al conectar con el asistente. Verifica que el servicio RAG esté activo.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleRate = async (msgIndex: number, rating: number) => {
    const msg = messages[msgIndex];
    if (!msg.ragResponse) return;

    setMessages((prev) => prev.map((m, i) => i === msgIndex ? { ...m, rating } : m));

    try {
      const userMsg = messages[msgIndex - 1]?.contenido || '';
      await ragService.submitFeedback(
        msg.ragResponse.consulta_id,
        userMsg,
        msg.contenido,
        rating,
        undefined,
        usuario?.usuario_id,
        undefined,
        undefined,
        msg.ragResponse.fuentes.map((f) => f.documento_id || '').filter(Boolean),
        msg.ragResponse.tiempo_respuesta_ms,
        msg.ragResponse.relevancia_pct || undefined,
      );
    } catch {
      // silencioso
    }
  };

  const clearChat = () => { setMessages([]); };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Consulta de Documentos Técnicos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultas basadas en documentos agrícolas indexados (ICA, AGROSAVIA, CENICAFÉ)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedParcela}
            onChange={(e) => setSelectedParcela(e.target.value)}
            className="h-9 rounded-lg border bg-background px-2 text-xs outline-none focus:border-emerald-300"
          >
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
            <BookOpen className="h-12 w-12 text-muted-foreground/20" />
            <p className="text-sm">Consulta los documentos técnicos agrícolas</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                '¿Cómo fertilizar el café?',
                '¿Cómo controlar la roya?',
                '¿Cuándo cosechar el cacao?',
              ].map((q) => (
                <button key={q} onClick={() => setInput(q)}
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
              <p className={`mt-1 text-[10px] ${msg.rol === 'usuario' ? 'text-emerald-200' : 'text-muted-foreground'}`}>
                {new Date(msg.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                {msg.ragResponse && (
                  <span className="ml-2">
                    {msg.ragResponse.relevancia_pct?.toFixed(0)}% relevancia ·{' '}
                    {(msg.ragResponse.tiempo_respuesta_ms / 1000).toFixed(1)}s
                  </span>
                )}
              </p>
              {msg.rol === 'asistente' && msg.ragResponse && (
                <>
                  <FuentesPanel fuentes={msg.ragResponse.fuentes} />
                  <StarRating onRate={(r) => handleRate(i, r)} rating={msg.rating} />
                </>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Consultando documentos...
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
            placeholder="Escribe tu pregunta sobre agricultura..."
            className="h-11 flex-1 rounded-xl border bg-background px-4 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
            disabled={sending}
          />
          <button onClick={sendMessage} disabled={sending || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground text-center">
          Las respuestas se basan en documentos técnicos indexados. Selecciona una parcela para respuestas personalizadas.
        </p>
      </div>
    </div>
  );
}