# 🌱 AgroVision Web

> Dashboard web con Next.js 14 para AgroVision Predictor & RAG-Support

## Descripción

Dashboard web diseñado para técnicos agrícolas y administradores de la plataforma. Permite gestionar usuarios, visualizar parcelas en mapas interactivos, administrar cultivos y rotación agrícola, monitorear predicciones de rendimiento y recomendaciones, supervisar sesiones WhatsApp, administrar documentos RAG y su índice vectorial, gestionar catálogos del sistema y generar reportes.

## Stack

- **Next.js** 14 con App Router
- **TypeScript**
- **Tailwind CSS** + **Shadcn/ui**
- **TanStack Query** 5 (server state)
- **Zustand** (client state)
- **React Hook Form** + **Zod** (formularios)
- **Recharts** (gráficos)
- **Leaflet** + **React Leaflet** (mapas)
- **Vitest** + **React Testing Library** (tests)

## Requisitos

- Node.js >= 20
- Backend corriendo en `http://localhost:4001`

## Instalación

```bash
npm install
cp .env.example .env.local
npm run dev
```

Disponible en `http://localhost:3000`

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Desarrollo con hot reload |
| `npm run build` | Compilar para producción |
| `npm run start` | Correr build de producción |
| `npm run lint` | Ejecutar ESLint |
| `npm run test` | Tests con Vitest |
| `npm run test:coverage` | Tests con cobertura |

## Rutas (19)

| Ruta | Descripción |
|---|---|
| `/dashboard` | Resumen general |
| `/parcels` | Gestión de parcelas con mapa |
| `/crops` | Cultivos por parcela |
| `/activities` | Bitácora de actividades e insumos |
| `/predictions` | Predicciones ML con confianza |
| `/recommendations` | Recomendaciones personalizadas |
| `/weather` | Dashboard meteorológico |
| `/alerts` | Centro de alertas |
| `/chat` | Asistente IA conversacional |
| `/profile` | Perfil del usuario |
| `/settings` | Configuración y preferencias |
| `/auth/login` | Inicio de sesión |
| `/auth/register` | Registro de usuario |
| `/admin/users` | Gestión de usuarios |
| `/admin/documents` | Documentos RAG |
| `/admin/catalogs` | Catálogos del sistema |
| `/admin/audit` | Logs de auditoría |
| `/admin/monitoring` | Monitoreo chatbot y ML |
| `/admin/analytics` | Analíticas del sistema |

## Estructura

```
src/
├── app/                    # Rutas (App Router)
│   ├── auth/               # Login, registro
│   ├── dashboard/          # Dashboard principal
│   ├── parcels/            # Parcelas
│   ├── crops/              # Cultivos
│   ├── activities/         # Bitácora
│   ├── predictions/        # Predicciones ML
│   ├── recommendations/    # Recomendaciones
│   ├── weather/            # Clima
│   ├── alerts/             # Alertas
│   ├── chat/               # Chat IA
│   ├── profile/            # Perfil
│   ├── settings/           # Configuración
│   └── admin/              # Panel administrativo
├── components/
│   ├── layout/             # Sidebar, Header
│   ├── ui/                 # Componentes Shadcn/ui
│   ├── forms/              # Formularios reutilizables
│   ├── maps/               # Componentes de mapa Leaflet
│   └── charts/             # Gráficos Recharts
├── hooks/                  # Custom hooks (useApi, etc.)
├── lib/                    # Utilidades (cn, etc.)
├── providers/              # TanStack Query provider
├── services/               # Cliente API Axios
├── store/                  # Zustand stores
└── types/                  # Tipos TypeScript
```

## Licencia

Proyecto privado — AgroVision © 2026
