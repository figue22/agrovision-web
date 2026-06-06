import axios from 'axios';

const RAG_URL = process.env.NEXT_PUBLIC_RAG_URL || 'http://localhost:8002';

const ragApi = axios.create({ baseURL: RAG_URL });

export interface SourceReference {
  documento_id?: string;
  titulo: string;
  pagina?: number;
  institucion?: string;
  chunk_text: string;
  score: number;
}

export interface RagQueryRequest {
  pregunta: string;
  top_k?: number;
  cultivo?: string;
  region?: string;
  nombre_agricultor?: string;
  parcela_nombre?: string;
  filtro_categoria?: string;
}

export interface RagQueryResponse {
  consulta_id: string;
  respuesta: string;
  fuentes: SourceReference[];
  pregunta_original: string;
  modelo_usado: string;
  tokens_usados?: number;
  tiempo_respuesta_ms: number;
  relevancia_pct?: number;
  timestamp: string;
}

export interface MetricasRAG {
  total_consultas: number;
  satisfaccion_promedio: number;
  consultas_con_feedback: number;
  rating_1: number;
  rating_2: number;
  rating_3: number;
  rating_4: number;
  rating_5: number;
  consultas_frecuentes: { pregunta: string; veces: number }[];
  documentos_mas_citados: { documento_id: string; veces_citado: number }[];
  relevancia_promedio_pct: number;
  tiempo_respuesta_promedio_ms: number;
}

export const ragService = {
  query: async (request: RagQueryRequest): Promise<RagQueryResponse> => {
    const response = await ragApi.post<RagQueryResponse>('/query', request);
    return response.data;
  },

  submitFeedback: async (
    consulta_id: string,
    pregunta: string,
    respuesta: string,
    rating: number,
    comentario?: string,
    usuario_id?: string,
    cultivo?: string,
    region?: string,
    documentos_citados?: string[],
    tiempo_respuesta_ms?: number,
    relevancia_pct?: number,
  ): Promise<void> => {
    await ragApi.post('/feedback', {
      consulta_id,
      pregunta,
      respuesta,
      rating,
      comentario,
      usuario_id,
      cultivo,
      region,
      documentos_citados,
      tiempo_respuesta_ms,
      relevancia_pct,
    });
  },

  getMetricas: async (): Promise<MetricasRAG> => {
    const response = await ragApi.get<MetricasRAG>('/feedback/metricas');
    return response.data;
  },
};