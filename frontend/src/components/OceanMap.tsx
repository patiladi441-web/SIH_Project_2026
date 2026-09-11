import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { validateOceanCoordinate } from '../utils/oceanMask';
import { AlertCircle } from 'lucide-react';

// Custom dark crosshair marker with high-contrast tactical design
const crosshairIcon = new L.DivIcon({
  className: 'bg-transparent',
  html: `
    <div class="relative flex items-center justify-center w-10 h-10 -ml-5 -mt-5 cursor-grab active:cursor-grabbing">
      <!-- Dark radar pulse -->
      <div class="absolute w-full h-full border-2 border-slate-950/50 rounded-full animate-ping opacity-35"></div>
      <!-- Dark outer target ring -->
      <div class="absolute w-7 h-7 border-2 border-slate-950 rounded-full bg-slate-950/25 shadow-md"></div>
      <!-- Dark crosshair lines -->
      <div class="absolute w-full h-[2px] bg-slate-950 shadow-[0_1px_2px_rgba(0,0,0,0.6)]"></div>
      <div class="absolute h-full w-[2px] bg-slate-950 shadow-[0_1px_2px_rgba(0,0,0,0.6)]"></div>
      <!-- Center dark core target with crisp white accent border -->
      <div class="absolute w-4 h-4 bg-slate-950 rounded-full border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.85)] flex items-center justify-center z-10">
        <div class="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
      </div>
    </div>
  `,
  iconSize: [40, 40],
});

// Helper component to listen to clicks on the map with Ocean validation
const MapClickHandler: React.FC<{
  onSelect: (lat: number, lon: number, name: string) => void;
  onLandClick: (lat: number, lon: number, landName: string) => void;
}> = ({ onSelect, onLandClick }) => {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;
      const validation = validateOceanCoordinate(lat, lon);

      if (!validation.isOcean) {
        onLandClick(lat, lon, validation.regionName);
        return;
      }

      onSelect(lat, lon, validation.regionName);
    },
  });
  return null;
};

// Region outlines to highlight ocean basins (defined statically outside component)
const ARABIAN_SEA_BOUNDS: [number, number][] = [
  [24.5, 58.0],
  [24.5, 72.5],
  [18.9, 72.8],
  [15.5, 73.8],
  [8.1, 77.5],
  [5.0, 77.5],
  [5.0, 55.0],
  [15.0, 55.0],
  [24.5, 58.0],
];

const BAY_OF_BENGAL_BOUNDS: [number, number][] = [
  [21.5, 87.0],
  [21.5, 92.5],
  [16.0, 94.0],
  [10.0, 98.0],
  [5.0, 98.0],
  [5.0, 80.5],
  [8.1, 77.6],
  [13.1, 80.3],
  [17.7, 83.3],
  [21.5, 87.0],
];

// Helper component to smoothly pan the map ONLY when coordinates actually change
const MapUpdater: React.FC<{ lat: number; lon: number }> = React.memo(({ lat, lon }) => {
  const map = useMap();
  const prevRef = React.useRef<[number, number]>([lat, lon]);

  useEffect(() => {
    // Only pan if coordinate moved noticeably to prevent re-render animation lag
    const dist = Math.hypot(lat - prevRef.current[0], lon - prevRef.current[1]);
    if (dist > 0.02) {
      prevRef.current = [lat, lon];
      map.panTo([lat, lon], { animate: true, duration: 0.4 });
    }
  }, [lat, lon, map]);

  return null;
});

interface OceanMapProps {
  lat: number;
  lon: number;
  onLocationSelect: (lat: number, lon: number, name?: string) => void;
}

type MapTheme = 'natgeo' | 'voyager' | 'ocean' | 'dark';

export const OceanMap: React.FC<OceanMapProps> = React.memo(({ lat, lon, onLocationSelect }) => {
  const [landWarning, setLandWarning] = useState<string | null>(null);
  const [mapTheme, setMapTheme] = useState<MapTheme>('natgeo');

  // Auto-dismiss warning toast after 3.5s
  useEffect(() => {
    if (landWarning) {
      const timer = setTimeout(() => setLandWarning(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [landWarning]);

  const handleLandClick = React.useCallback((clickedLat: number, clickedLon: number, landName: string) => {
    setLandWarning(
      `Land coordinate clicked (${clickedLat.toFixed(2)}°N, ${clickedLon.toFixed(2)}°E — ${landName}). OceanEmbed reconstructs oceanic profiles only. Please click an ocean coordinate.`
    );
  }, []);

  return (
    <div className="w-full h-full relative z-0 bg-[#04121A]">
      {/* Floating Land Click Warning Toast */}
      {landWarning && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[500] max-w-lg w-[90%] bg-red-950/95 border border-red-500/80 rounded-xl px-4 py-3 shadow-[0_0_35px_rgba(239,68,68,0.4)] backdrop-blur-md flex items-start gap-3 text-xs font-mono text-red-200 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-red-300 block mb-0.5 uppercase tracking-wide">
              Invalid Coordinate (Landmass)
            </span>
            <span>{landWarning}</span>
          </div>
          <button
            onClick={() => setLandWarning(null)}
            className="text-red-400 hover:text-red-200 text-sm font-bold ml-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Map Theme Toggle Bar (Top-Right) */}
      <div className="absolute top-4 right-4 z-[400] flex bg-midnight/90 backdrop-blur-md p-1.5 rounded-xl border border-ocean shadow-xl text-xs font-mono gap-1">
        <button
          onClick={() => setMapTheme('natgeo')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            mapTheme === 'natgeo'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-glow font-bold'
              : 'text-muted-ice hover:text-ice'
          }`}
        >
          <span>🌍</span> NatGeo
        </button>
        <button
          onClick={() => setMapTheme('voyager')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            mapTheme === 'voyager'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-glow font-bold'
              : 'text-muted-ice hover:text-ice'
          }`}
        >
          <span>🗺️</span> Voyager
        </button>
        <button
          onClick={() => setMapTheme('ocean')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            mapTheme === 'ocean'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-glow font-bold'
              : 'text-muted-ice hover:text-ice'
          }`}
        >
          <span>🌊</span> Ocean
        </button>
        <button
          onClick={() => setMapTheme('dark')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            mapTheme === 'dark'
              ? 'bg-brand/20 text-brand border border-brand/40 shadow-glow font-bold'
              : 'text-muted-ice hover:text-ice'
          }`}
        >
          <span>🌌</span> Dark
        </button>
      </div>

      {/* Map Legend (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-[400] bg-midnight/85 backdrop-blur-md px-3.5 py-2 rounded-lg border border-ocean text-[11px] font-mono text-muted-ice flex items-center gap-4 shadow-lg pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          <strong className="text-ice">Ocean</strong> (Clickable)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600/80 border border-amber-500/40" />
          <span className="text-muted-ice">Land</span> (Non-marine)
        </span>
      </div>

      <MapContainer
        center={[lat, lon]}
        zoom={5}
        minZoom={3}
        maxZoom={10}
        zoomControl={false}
        className="w-full h-full outline-none cursor-crosshair"
        style={{ background: '#081e2b' }}
      >
        {/* ESRI National Geographic — HD physical terrain, matches screenshot */}
        {mapTheme === 'natgeo' && (
          <TileLayer
            key="esri-natgeo"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; National Geographic, Esri, NOAA"
            maxZoom={12}
          />
        )}
        {/* CartoDB Voyager — fast, clean, professional */}
        {mapTheme === 'voyager' && (
          <TileLayer
            key="carto-voyager"
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors'
            maxZoom={19}
          />
        )}
        {/* ESRI Ocean Basemap — lightweight raster, good for oceanography context */}
        {mapTheme === 'ocean' && (
          <TileLayer
            key="esri-ocean"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri, GEBCO, NOAA"
            maxZoom={13}
          />
        )}
        {mapTheme === 'dark' && (
          <TileLayer
            key="carto-dark"
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            maxZoom={19}
          />
        )}

        {/* Subtle Highlight for Arabian Sea Basin */}
        <Polygon
          positions={ARABIAN_SEA_BOUNDS}
          pathOptions={{
            color: '#0284c7',
            weight: 1.5,
            dashArray: '5, 8',
            fillColor: '#0284c7',
            fillOpacity: 0.03,
          }}
        />

        {/* Subtle Highlight for Bay of Bengal Basin */}
        <Polygon
          positions={BAY_OF_BENGAL_BOUNDS}
          pathOptions={{
            color: '#0d9488',
            weight: 1.5,
            dashArray: '5, 8',
            fillColor: '#0d9488',
            fillOpacity: 0.03,
          }}
        />

        <Marker
          position={[lat, lon]}
          icon={crosshairIcon}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();
              const validation = validateOceanCoordinate(position.lat, position.lng);
              if (!validation.isOcean) {
                handleLandClick(position.lat, position.lng, validation.regionName);
                marker.setLatLng([lat, lon]); // Revert back to ocean position
                return;
              }
              onLocationSelect(position.lat, position.lng, validation.regionName);
            },
          }}
        />
        <MapClickHandler
          onSelect={(selectedLat, selectedLon, regionName) =>
            onLocationSelect(selectedLat, selectedLon, regionName)
          }
          onLandClick={handleLandClick}
        />
        <MapUpdater lat={lat} lon={lon} />
      </MapContainer>
    </div>
  );
});
