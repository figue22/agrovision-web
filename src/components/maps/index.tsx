'use client';

import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';

export const ParcelaMapDynamic = dynamic(
  () => import('@/components/maps/parcela-map'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center rounded-xl border bg-muted/30">
        <div className="text-sm text-muted-foreground">Cargando mapa...</div>
      </div>
    ),
  },
);