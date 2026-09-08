import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../app/store';
import { runReconstruction, setLocation } from '../features/explorerSlice';
import { OceanMap } from '../components/OceanMap';
import { SubsurfaceProfileChart } from '../components/SubsurfaceProfileChart';
import { TransectChart } from '../components/TransectChart';
import {
  Compass,
  Layers,
  Database,
  Calendar,
  Crosshair,
  ArrowUpRight,
  Check,
  Loader2,
  CheckCircle2,
  Activity,
} from 'lucide-react';

const STEPS = [
  'Querying multi-spectral surface fields (SST, SSS, SSH, Wind)',
  'Generating compact 0.25° latent satellite embedding',
  'Decoding non-linear 3D vertical temperature stratifications',
  'Executing spatial match against nearest in-situ ARGO profiles',
];

export const Explorer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [viewMode, setViewMode] = useState<'point' | 'transect'>('point');
  
  const { selectedLocation, selectedDate, isInferring, inferenceStep, results } =
    useSelector((state: RootState) => state.explorer);

  const predefinedZones = [
    { name: 'Arabian Sea (Central)', lat: 18.4521, lon: 72.8314 },
    { name: 'Bay of Bengal (Depression)', lat: 15.2144, lon: 88.3412 },
    { name: 'Equatorial Ocean', lat: 5.5122, lon: 78.4123 },
  ];

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full bg-deep text-ice flex flex-col overflow-hidden font-sans">
      {/* Inference Progress Modal */}
      {isInferring && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep/80 backdrop-blur-sm">
          <div className="w-[460px] bg-midnight border border-ocean rounded-xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-ocean">
              <Compass className="w-5 h-5 text-brand animate-pulse" />
              <span className="font-display font-semibold text-ice tracking-wider">
                OCEANEMBED INFERENCE PIPELINE
              </span>
            </div>
            <div className="space-y-4">
              {STEPS.map((label, idx) => {
                const stepNum = idx + 1;
                const isDone = inferenceStep > stepNum;
                const isCurrent = inferenceStep === stepNum;
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-brand" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-satellite animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-muted-ice/30" />
                      )}
                    </div>
                    <div>
                      <div
                        className={`text-xs font-mono ${
                          isCurrent
                            ? 'text-ice font-semibold'
                            : isDone
                            ? 'text-brand'
                            : 'text-muted-ice/50'
                        }`}
                      >
                        STEP 0{stepNum}
                      </div>
                      <div className={`text-xs ${isCurrent ? 'text-ice' : 'text-muted-ice'}`}>
                        {label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Workbench Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Vertical Nav */}
        <nav className="w-14 border-r border-ocean bg-midnight flex flex-col items-center py-5 gap-5 z-20">
          <button className="p-2 rounded-lg bg-brand/10 text-brand border border-brand/20">
            <Compass className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-muted-ice hover:text-ice hover:bg-elevated transition-colors">
            <Layers className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-muted-ice hover:text-ice hover:bg-elevated transition-colors">
            <Database className="w-4 h-4" />
          </button>
        </nav>

        {/* Center Canvas + Bottom Results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Map Viewport Area */}
          <div className="flex-1 relative bg-[#04121A] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#0FAF9A_1px,transparent_1px)] [background-size:28px_28px] opacity-15 pointer-events-none z-10" />

            {/* Quick Presets */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
              {predefinedZones.map((zone) => (
                <button
                  key={zone.name}
                  onClick={() => dispatch(setLocation({ lat: zone.lat, lon: zone.lon, name: zone.name }))}
                  className="text-xs font-mono px-3 py-1.5 rounded-md bg-midnight/90 border border-ocean text-muted-ice hover:text-ice hover:border-brand/40 transition-all backdrop-blur cursor-pointer shadow-md"
                >
                  {zone.name}
                </button>
              ))}
            </div>

            {/* LEAFLET MAP INTEGRATION */}
            <OceanMap 
              lat={selectedLocation.lat} 
              lon={selectedLocation.lon}
              onLocationSelect={(lat, lon) => dispatch(setLocation({ lat, lon, name: 'Custom Selection' }))}
            />

            <div className="absolute bottom-3 left-4 z-20 text-[11px] font-mono text-muted-ice/80 bg-deep/60 px-2 py-1 rounded backdrop-blur border border-ocean">
              {viewMode === 'point' 
                ? 'Drag crosshair or select presets to update coordinates (5°N–30°N)' 
                : 'Transect Mode Active: Analyzing 100km horizontal cross-section from origin point'}
            </div>
          </div>

          {/* Bottom Results Drawer */}
          <div className="h-72 border-t border-ocean bg-midnight p-4 flex gap-6 z-20">
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-medium text-sm text-ice uppercase tracking-wider">
                    {viewMode === 'point' ? 'Vertical Subsurface Thermal Profile' : 'Horizontal Cross-Section Analysis'}
                  </h3>
                  <p className="text-xs text-muted-ice font-mono">
                    {viewMode === 'point' ? 'Reconstruction vs In-Situ Real ARGO Verification' : 'Simulated Deep Learning Spatial Transect'}
                  </p>
                </div>
                {results && viewMode === 'point' && (
                  <div className="flex gap-3 font-mono text-xs">
                    <div className="bg-elevated px-3 py-1 rounded border border-ocean">
                      <span className="text-muted-ice">RMSE: </span>
                      <span className="text-brand font-bold">{results.metrics.rmse}°C</span>
                    </div>
                    <div className="bg-elevated px-3 py-1 rounded border border-ocean">
                      <span className="text-muted-ice">CORRELATION: </span>
                      <span className="text-brand font-bold">{results.metrics.correlation}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Chart Visualizer with 500m Metric & View Toggle */}
              {results ? (
                <div className="flex-1 min-h-0 mt-2 flex flex-col">
                   {viewMode === 'point' ? (
                     <>
                       <div className="mb-2 bg-elevated/40 rounded-lg border border-ocean p-2 flex items-center justify-around font-mono text-[11px]">
                         <div className="space-y-0.5">
                           <span className="text-brand font-bold">Surface: {results.temperature_c[0]}°C</span>
                           <div className="text-muted-ice">Depth 0m</div>
                         </div>
                         <div className="space-y-0.5">
                           <span className="text-seafoam font-bold">Thermocline: {results.temperature_c[7]}°C</span>
                           <div className="text-muted-ice">Depth 100m</div>
                         </div>
                         <div className="space-y-0.5">
                           <span className="text-warning font-bold">Mesopelagic: {results.temperature_c[12]}°C</span>
                           <div className="text-muted-ice">Depth 500m</div>
                         </div>
                       </div>
                       <div className="flex-1">
                         <SubsurfaceProfileChart data={results} />
                       </div>
                     </>
                   ) : (
                     <div className="flex-1 mt-1">
                       <TransectChart />
                     </div>
                   )}
                </div>
              ) : (
                <div className="flex-1 my-2 border border-dashed border-ocean rounded-lg flex items-center justify-center flex-col text-muted-ice text-xs font-mono">
                  <Crosshair className="w-5 h-5 mb-1.5 opacity-40 text-brand" />
                  Select geographic coordinates and click "RUN RECONSTRUCTION" to infer field.
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] font-mono text-muted-ice border-t border-ocean pt-1.5">
                <span>MODEL: OceanEmbed-ViT-v1.0</span>
                <span className="text-brand">{viewMode === 'point' ? 'Depths: 0m to 1000m' : 'Length: 100km'}</span>
              </div>
            </div>

            {/* Float Comparison Card */}
            {results && viewMode === 'point' && (
              <div className="w-72 border-l border-ocean pl-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-argo font-semibold">
                    In-Situ Verification
                  </span>
                  <h4 className="text-xs font-display font-medium text-ice mt-0.5 truncate">
                    {results.nearest_argo.float_id}
                  </h4>
                  <p className="text-[11px] text-muted-ice mt-0.5">
                    Match distance: <strong className="text-ice">{results.nearest_argo.distance_km} km</strong>
                  </p>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="p-1.5 rounded bg-elevated border border-ocean flex justify-between">
                    <span className="text-muted-ice">Mean Bias</span>
                    <span className="text-ice">+{results.metrics.mean_bias}°C</span>
                  </div>
                  <div className="p-1.5 rounded bg-elevated border border-ocean flex justify-between">
                    <span className="text-muted-ice">Confidence</span>
                    <span className="text-brand">94.2%</span>
                  </div>
                </div>

                <button className="w-full py-1.5 bg-elevated hover:bg-ocean/20 text-xs font-mono text-seafoam border border-ocean rounded flex items-center justify-center gap-1 cursor-pointer">
                  Export LAS Matchup <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Query Panel */}
        <div className="w-72 border-l border-ocean bg-midnight p-4 flex flex-col justify-between z-20">
          <div className="space-y-5">
            <div>
              <span className="text-xs font-mono text-brand uppercase tracking-wider">Analysis Mode</span>
              <div className="flex bg-elevated rounded-lg p-1 mt-2 border border-ocean">
                <button 
                  onClick={() => setViewMode('point')}
                  className={`flex-1 py-1.5 text-xs font-mono rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${viewMode === 'point' ? 'bg-midnight text-ice shadow-sm border border-ocean' : 'text-muted-ice hover:text-ice'}`}
                >
                  <Crosshair className="w-3.5 h-3.5" /> Point
                </button>
                <button 
                  onClick={() => setViewMode('transect')}
                  className={`flex-1 py-1.5 text-xs font-mono rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${viewMode === 'transect' ? 'bg-midnight text-ice shadow-sm border border-ocean' : 'text-muted-ice hover:text-ice'}`}
                >
                  <Activity className="w-3.5 h-3.5" /> Transect
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-display font-medium text-ice text-sm">Query Station</h3>
              <div className="space-y-3 font-mono text-xs mt-3">
                <div>
                  <label className="text-muted-ice block mb-1">LATITUDE (°N)</label>
                  <input
                    type="number"
                    value={selectedLocation.lat}
                    onChange={(e) =>
                      dispatch(setLocation({ ...selectedLocation, lat: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full bg-elevated border border-ocean rounded px-2.5 py-1.5 text-ice focus:border-brand outline-none"
                  />
                </div>

                <div>
                  <label className="text-muted-ice block mb-1">LONGITUDE (°E)</label>
                  <input
                    type="number"
                    value={selectedLocation.lon}
                    onChange={(e) =>
                      dispatch(setLocation({ ...selectedLocation, lon: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full bg-elevated border border-ocean rounded px-2.5 py-1.5 text-ice focus:border-brand outline-none"
                  />
                </div>

                <div>
                  <label className="text-muted-ice block mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> TEMPORAL SLICE
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    className="w-full bg-elevated border border-ocean rounded px-2.5 py-1.5 text-ice focus:border-brand outline-none"
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono text-muted-ice block mb-2">
                SURFACE OBSERVATIONS
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                {['SST', 'SSH', 'SSS', 'WINDS'].map((layer) => (
                  <div key={layer} className="flex items-center gap-1 p-1 rounded bg-elevated/60 text-muted-ice border border-ocean/40">
                    <Check className="w-3 h-3 text-brand" /> {layer}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => dispatch(runReconstruction())}
            disabled={isInferring}
            className="w-full py-2.5 bg-brand hover:bg-brand/90 text-deep font-display font-semibold text-xs tracking-wide rounded-lg shadow-glow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Compass className="w-3.5 h-3.5" />
            {isInferring ? 'INFERRING PROFILE...' : 'RUN RECONSTRUCTION'}
          </button>
        </div>
      </div>
    </div>
  );
};