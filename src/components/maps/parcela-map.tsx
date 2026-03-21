'use client';

import { useEffect, useRef, useState } from 'react';
import type { ParcelaResponse } from '@/services/parcelas.service';

interface ParcelaMapProps {
  parcelas: ParcelaResponse[];
  selectedId?: string | null;
  onSelectParcela?: (parcela: ParcelaResponse) => void;
  height?: string;
}

export default function ParcelaMap({
  parcelas,
  selectedId,
  onSelectParcela,
  height = '500px',
}: ParcelaMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const polygonsRef = useRef<Map<string, any>>(new Map());
  const [ready, setReady] = useState(false);
  const LRef = useRef<any>(null);

  // Cargar Leaflet dinámicamente
  useEffect(() => {
    let cancelled = false;

    async function loadLeaflet() {
      const L = await import('leaflet');

      if (!cancelled) {
        LRef.current = L.default || L;
        setReady(true);
      }
    }

    void loadLeaflet();
    return () => { cancelled = true; };
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!ready || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = LRef.current;
    if (!L) return;

    // Pequeño delay para asegurar que el DOM está listo
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [5.0689, -75.5174], // Manizales default
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Geolocalización del usuario
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            map.setView([pos.coords.latitude, pos.coords.longitude], 13);
          },
          () => {}, // Silenciar error si no da permiso
        );
      }

      mapInstanceRef.current = map;

      // Forzar recalcular tamaño del mapa
      setTimeout(() => map.invalidateSize(), 100);
    }, 50);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [ready]);

  // Actualizar marcadores
  useEffect(() => {
    const L = LRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Limpiar anteriores
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();
    polygonsRef.current.forEach((polygon) => polygon.remove());
    polygonsRef.current.clear();

    if (parcelas.length === 0) return;

    const defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const selectedIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const bounds = L.latLngBounds([]);

    parcelas.forEach((parcela) => {
      if (!parcela.ubicacion) return;

      const lat = parcela.ubicacion.latitud;
      const lng = parcela.ubicacion.longitud;
      const isSelected = parcela.parcela_id === selectedId;

      const marker = L.marker([lat, lng], {
        icon: isSelected ? selectedIcon : defaultIcon,
      }).addTo(map);

      marker.bindPopup(`
        <div style="min-width:180px;">
          <strong style="font-size:14px;">${parcela.nombre}</strong>
          <div style="margin-top:6px;font-size:12px;color:#666;">
            <div>Área: ${parcela.area_hectareas} ha</div>
            ${parcela.tipo_suelo ? `<div>Suelo: ${parcela.tipo_suelo}</div>` : ''}
            ${parcela.ph_suelo ? `<div>pH: ${parcela.ph_suelo}</div>` : ''}
            ${parcela.altitud_msnm ? `<div>Altitud: ${parcela.altitud_msnm} msnm</div>` : ''}
          </div>
        </div>
      `);

      marker.on('click', () => {
        onSelectParcela?.(parcela);
      });

      markersRef.current.set(parcela.parcela_id, marker);
      bounds.extend([lat, lng]);

      if (parcela.limites_geojson?.coordinates) {
        const coords = parcela.limites_geojson.coordinates[0].map(
          (c: number[]) => [c[1], c[0]] as [number, number],
        );
        const polygon = L.polygon(coords, {
          color: isSelected ? '#059669' : '#2563eb',
          weight: 2,
          opacity: 0.8,
          fillOpacity: isSelected ? 0.2 : 0.1,
        }).addTo(map);

        polygonsRef.current.set(parcela.parcela_id, polygon);
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [parcelas, selectedId, onSelectParcela]);

  // Centrar en parcela seleccionada
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedId) return;

    const marker = markersRef.current.get(selectedId);
    if (marker) {
      map.setView(marker.getLatLng(), 16, { animate: true });
      marker.openPopup();
    }
  }, [selectedId]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%' }}
      className="rounded-xl border overflow-hidden"
    />
  );
}