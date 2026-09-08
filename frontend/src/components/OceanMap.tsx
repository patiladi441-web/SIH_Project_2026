import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom glowing crosshair marker
const crosshairIcon = new L.DivIcon({
  className: 'bg-transparent',
  html: `
    <div class="relative flex items-center justify-center w-8 h-8 -ml-4 -mt-4">
      <div class="absolute w-full h-full border border-brand/50 rounded-full animate-ping opacity-50"></div>
      <div class="absolute w-2 h-2 bg-brand rounded-full shadow-[0_0_15px_#0FAF9A]"></div>
      <div class="absolute w-full h-[1px] bg-brand/40"></div>
      <div class="absolute h-full w-[1px] bg-brand/40"></div>
    </div>
  `,
  iconSize: [32, 32],
});

// Helper component to smoothly pan the map when coordinates change
const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 5, { duration: 1.5 });
  }, [center, map]);
  return null;
};

interface OceanMapProps {
  lat: number;
  lon: number;
  onLocationSelect: (lat: number, lon: number) => void;
}

export const OceanMap: React.FC<OceanMapProps> = ({ lat, lon, onLocationSelect }) => {
  return (
    <div className="w-full h-full relative z-0 bg-[#04121A]">
      <MapContainer
        center={[lat, lon]}
        zoom={5}
        minZoom={3}
        maxZoom={10}
        zoomControl={false}
        className="w-full h-full outline-none"
        style={{ background: 'transparent' }}
      >
        {/* We use CartoDB dark matter or standard OSM with our CSS dark filter */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />
        
        <Marker 
          position={[lat, lon]} 
          icon={crosshairIcon}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();
              onLocationSelect(position.lat, position.lng);
            },
          }}
        />
        <MapUpdater center={[lat, lon]} />
      </MapContainer>
    </div>
  );
};