// ============================================
// TIPOS TYPESCRIPT — AgroVision Web
// Alineados con entidades del backend
// ============================================

// ── Enums ──

export type Rol = 'admin' | 'tecnico' | 'agricultor';
export type TipoSuelo = 'arcilloso' | 'arenoso' | 'limoso' | 'franco' | 'mixto';
export type RequerimientoAgua = 'bajo' | 'medio' | 'alto';
export type EstadoCultivo = 'planificado' | 'activo' | 'cosechado' | 'fallido' | 'abandonado';
export type NivelRiesgo = 'bajo' | 'medio' | 'alto' | 'critico';
export type Prioridad = 'baja' | 'media' | 'alta' | 'urgente';
export type EstadoImplementacion = 'pendiente' | 'en_progreso' | 'completada' | 'descartada';
export type Severidad = 'info' | 'baja' | 'media' | 'alta' | 'critica';

// ── Entidades ──

export interface Usuario {
  usuario_id: string;
  correo: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  rol: Rol;
  tiene_2fa: boolean;
  esta_activo: boolean;
  ultimo_login?: string;
  creado_en: string;
}

export interface Agricultor {
  agricultor_id: string;
  usuario_id: string;
  cedula: string;
  direccion?: string;
  municipio: string;
  departamento: string;
  tamano_finca_ha?: number;
  usuario?: Usuario;
}

export interface Parcela {
  parcela_id: string;
  agricultor_id: string;
  nombre: string;
  ubicacion: { type: 'Point'; coordinates: [number, number] };
  area_hectareas: number;
  tipo_suelo?: TipoSuelo;
  ph_suelo?: number;
  altitud_msnm?: number;
  limites_geojson?: { type: 'Polygon'; coordinates: number[][][] };
  creado_en: string;
}

export interface TipoCultivo {
  tipo_cultivo_id: string;
  nombre: string;
  nombre_cientifico?: string;
  categoria?: string;
  dias_crecimiento_prom?: number;
  temp_optima_min?: number;
  temp_optima_max?: number;
  req_agua?: RequerimientoAgua;
}

export interface CultivoParcela {
  cultivo_parcela_id: string;
  parcela_id: string;
  tipo_cultivo_id: string;
  fecha_siembra: string;
  fecha_cosecha_esperada?: string;
  fecha_cosecha_real?: string;
  area_sembrada_ha?: number;
  rendimiento_esperado_ton?: number;
  rendimiento_real_ton?: number;
  estado: EstadoCultivo;
  temporada?: string;
  notas?: string;
  parcela?: Parcela;
  tipoCultivo?: TipoCultivo;
}

export interface DatoClimatico {
  dato_climatico_id: string;
  parcela_id: string;
  fecha: string;
  temp_maxima?: number;
  temp_minima?: number;
  temp_promedio?: number;
  precipitacion_mm?: number;
  humedad_pct?: number;
  velocidad_viento?: number;
  indice_uv?: number;
  fuente: string;
}

export interface Prediccion {
  prediccion_id: string;
  parcela_id: string;
  cultivo_parcela_id?: string;
  tipo_cultivo_id: string;
  version_modelo: string;
  tipo_modelo: string;
  rendimiento_predicho_ton: number;
  puntaje_confianza?: number;
  intervalo_conf_inferior?: number;
  intervalo_conf_superior?: number;
  nivel_riesgo: NivelRiesgo;
  factores_riesgo?: Record<string, unknown>;
  fecha_prediccion: string;
}

export interface Alerta {
  alerta_id: string;
  parcela_id?: string;
  usuario_id: string;
  tipo_alerta_id: number;
  severidad: Severidad;
  titulo: string;
  mensaje: string;
  esta_leida: boolean;
  creado_en: string;
}

export interface Recomendacion {
  recomendacion_id: string;
  prediccion_id: string;
  tipo_recomendacion_id: number;
  prioridad: Prioridad;
  titulo: string;
  descripcion: string;
  estado_implementacion: EstadoImplementacion;
}

export interface Actividad {
  actividad_id: string;
  parcela_id: string;
  tipo_actividad_id: number;
  descripcion?: string;
  cantidad?: number;
  unidad?: string;
  costo_cop?: number;
  fecha_realizacion: string;
  notas?: string;
}

// ── API Response ──

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
