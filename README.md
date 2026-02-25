# 🖥️ AgroVision Web - Dashboard para Técnicos y Administradores

> Frontend web con Next.js 14, TypeScript y Shadcn/ui para la gestión técnica y administrativa de AgroVision.

## Descripción

Dashboard web diseñado para técnicos agrícolas y administradores de la plataforma. Permite gestionar usuarios, visualizar parcelas en mapas interactivos, administrar cultivos y rotación agrícola, monitorear predicciones de rendimiento y recomendaciones, supervisar sesiones WhatsApp, administrar documentos RAG y su índice vectorial, gestionar catálogos del sistema y generar reportes.

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| Next.js | 14.1.0 | Framework React con SSR/SSG |
| React | 18.2.0 | Biblioteca UI |
| TypeScript | 5.3.3 | Lenguaje tipado |
| Shadcn/ui | latest | Componentes UI accesibles |
| Tailwind CSS | 3.4.1 | Framework CSS utility-first |
| TanStack Query | 5.17.0 | Server state management |
| Zustand | 4.5.0 | Client state management |
| React Hook Form | 7.49.3 | Gestión de formularios |
| Zod | 3.22.4 | Validación de schemas |
| Recharts | 2.10.4 | Gráficos y visualizaciones |
| Leaflet | 1.9.4 | Mapas interactivos |

## Estructura del Proyecto

```
src/
├── app/                        # App Router de Next.js 14
│   ├── dashboard/              # Dashboard principal con métricas
│   ├── auth/
│   │   ├── login/              # Inicio de sesión
│   │   └── register/           # Registro de usuarios
│   ├── parcels/                # Gestión y mapa de parcelas
│   ├── crops/                  # Gestión de cultivos por parcela, rotación, policultivo
│   ├── activities/             # Bitácora de actividades e insumos
│   ├── predictions/            # Visualización de predicciones ML
│   ├── recommendations/        # Recomendaciones por predicción, feedback
│   ├── weather/                # Dashboard meteorológico en tiempo real
│   ├── chat/                   # Monitoreo de sesiones WhatsApp
│   ├── alerts/                 # Centro de alertas climáticas
│   ├── api/                    # Route Handlers de Next.js
│   └── admin/
│       ├── users/              # Gestión de usuarios y roles
│       ├── documents/          # Administración de documentos RAG + índice vectorial
│       ├── catalogs/           # Gestión de tablas catálogo (tipos actividad/insumo/recomendación/alerta)
│       ├── monitoring/         # Monitoreo de sesiones WhatsApp y performance ML
│       ├── audit/              # Visualización de logs de auditoría
│       └── analytics/          # Reportes y análisis
├── components/
│   ├── ui/                     # Componentes Shadcn/ui base
│   ├── layout/                 # Header, Sidebar, Footer
│   ├── maps/                   # Componentes de Leaflet/mapas
│   ├── charts/                 # Gráficos con Recharts
│   └── forms/                  # Formularios reutilizables
├── hooks/                      # Custom hooks
├── lib/                        # Utilidades y configuración
├── services/                   # Clientes API (fetch wrappers)
├── store/                      # Zustand stores
├── providers/                  # React context providers (auth, query)
├── middleware/                  # Next.js middleware (auth, redirects)
├── types/                      # Tipos TypeScript compartidos
└── styles/                     # Estilos globales
```

## Páginas Principales

| Ruta | Rol | Descripción |
|---|---|---|
| `/dashboard` | Técnico, Admin | Métricas generales, resumen de actividad, alertas activas |
| `/parcels` | Técnico, Admin | Mapa interactivo de parcelas con PostGIS, detalle por parcela |
| `/crops` | Técnico, Admin | Cultivos activos por parcela, historial de rotación, rendimiento esperado vs real |
| `/activities` | Técnico, Admin | Bitácora de actividades agrícolas con insumos y costos |
| `/predictions` | Técnico, Admin | Predicciones de rendimiento ML, intervalos de confianza, factores de riesgo |
| `/recommendations` | Técnico, Admin | Recomendaciones por predicción, estado de implementación, feedback |
| `/weather` | Técnico, Admin | Dashboard meteorológico con series temporales por parcela |
| `/chat` | Técnico, Admin | Monitoreo de sesiones WhatsApp activas |
| `/alerts` | Técnico, Admin | Centro de alertas climáticas activas, historial |
| `/admin/users` | Admin | Gestión de usuarios (agricultores, técnicos) y asignación de roles |
| `/admin/documents` | Admin | Carga/edición de documentos RAG, estado de indexación en ChromaDB |
| `/admin/catalogs` | Admin | Gestión de catálogos: tipos de actividad, insumo, recomendación, alerta |
| `/admin/monitoring` | Admin | Monitoreo de sesiones WhatsApp y performance modelos ML |
| `/admin/audit` | Admin | Visualización de logs de auditoría del sistema |
| `/admin/analytics` | Admin | Reportes exportables (PDF, Excel, CSV) |

## Variables de Entorno

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=ws://localhost:4000

# Mapas
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

# General
NEXT_PUBLIC_APP_NAME=AgroVision
NODE_ENV=development
```

## Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Desarrollo
npm run dev

# Build de producción
npm run build
npm run start

# Tests
npm run test
npm run test:coverage

# Linting
npm run lint
```

## Acceso por Roles

| Rol | Acceso |
|---|---|
| **Administrador** | Acceso completo a todas las funcionalidades incluyendo catálogos, auditoría y analytics |
| **Técnico Agrícola** | Dashboard, parcelas, cultivos, actividades, predicciones, recomendaciones, chat, alertas |

> Los agricultores interactúan principalmente vía app móvil y WhatsApp.

## Contribución

1. Crear branch desde `develop`: `git checkout -b feature/nombre-feature`
2. Commits con convención: `feat:`, `fix:`, `docs:`, `refactor:`
3. Pull Request hacia `develop`

## Licencia

Proyecto privado - AgroVision © 2026
