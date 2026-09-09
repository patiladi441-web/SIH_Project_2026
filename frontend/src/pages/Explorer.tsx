import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../app/store';
import { runReconstruction, setLocation, setDate } from '../features/explorerSlice';
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

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col w-full bg-deep">
      {/* Top Utility Bar */}
      <div className="h-10 border-b border-ocean bg-midnight/50 flex items-center justify-between px-6 text-xs font-mono text-muted-ice shrink-0">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5 text-brand"><div className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" /> INFERENCE ENGINE: ONLINE</span>
          <span className="opacity-50">|</span>
          <span>GPU: A100-PCIE-40GB</span>
        </div>
        <div>
          LAT: {selectedLocation.lat.toFixed(4)}°N • LON: {selectedLocation.lon.toFixed(4)}°E
        </div>
      </div>

      {/* Main Workbench Body */}
      <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 bg-deep/50 items-stretch overflow-y-auto">
        {/* Left Vertical Nav */}
        <nav className="hidden lg:flex w-16 rounded-xl border border-ocean bg-midnight/80 flex-col items-center py-5 gap-5 z-20 shadow-lg shrink-0 animate-fade-in">
          <button className="p-3 rounded-xl bg-brand/10 text-brand border border-brand/20 shadow-glow">
            <Compass className="w-5 h-5" />
          </button>
          <button className="p-3 rounded-xl text-muted-ice hover:text-ice hover:bg-elevated transition-colors">
            <Layers className="w-5 h-5" />
          </button>
          <button className="p-3 rounded-xl text-muted-ice hover:text-ice hover:bg-elevated transition-colors">
            <Database className="w-5 h-5" />
          </button>
        </nav>

        {/* Central Content Area */}
        <div className="flex-1 flex flex-col gap-6 rounded-xl min-w-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          
          {/* Map Viewport Area */}
          <div className="relative bg-[#04121A] rounded-xl overflow-hidden border border-ocean shadow-xl min-h-[350px] lg:flex-1 shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(#0FAF9A_1px,transparent_1px)] [background-size:28px_28px] opacity-15 pointer-events-none z-10" />
            
            {/* Overlay UI */}
            <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
              <div className="px-4 py-2 bg-midnight/90 backdrop-blur-md rounded-lg border border-ocean shadow-md font-mono text-xs flex flex-col gap-1 text-muted-ice">
                <span className="text-ice font-display text-sm tracking-wider uppercase mb-1">
                  {selectedLocation.name || 'Custom Coordinate'}
                </span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-satellite rounded-full animate-pulse" /> SATELLITE: Online</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-argo rounded-full" /> ARGO MATCHUP: Active</span>
              </div>
            </div>

            <div className="absolute inset-0 z-0">
              <OceanMap lat={selectedLocation.lat} lon={selectedLocation.lon} onLocationSelect={(lat, lon) => dispatch(setLocation({ lat, lon }))} />
            </div>
            
            {/* Inference Loader Overlay */}
            {isInferring && (
              <div className="fixed inset-0 z-[100] bg-deep/80 backdrop-blur-md flex items-center justify-center">
                <div className="max-w-md w-full bg-midnight border border-brand/40 p-8 rounded-2xl shadow-[0_0_50px_rgba(15,175,154,0.15)] text-center transform scale-105 transition-transform">
                  <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto mb-6" />
                  <h3 className="font-display font-semibold text-ice text-lg mb-4">INFERRING SUBSURFACE PROFILE</h3>
                  <div className="space-y-4 text-left font-mono text-xs">
                    {STEPS.map((step, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-3 transition-opacity duration-300 ${
                          inferenceStep > idx ? 'text-seafoam' : inferenceStep === idx ? 'text-ice animate-pulse' : 'text-muted-ice/40'
                        }`}
                      >
                        <div className="mt-0.5">
                          {inferenceStep > idx ? <CheckCircle2 className="w-4 h-4 text-brand" /> : <div className="w-4 h-4 border border-current rounded-full" />}
                        </div>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Results Panel */}
          <div className="h-auto min-h-[300px] bg-midnight/90 backdrop-blur-md border border-ocean rounded-xl flex flex-col lg:flex-row shadow-xl overflow-hidden shrink-0">
            <div className="flex-1 p-5 flex flex-col min-w-0">
              {results ? (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-display font-bold text-lg text-ice uppercase tracking-wider">
                        {viewMode === 'point' ? 'Vertical Thermal Profile' : '3D Volume Analysis'}
                      </h3>
                      <p className="text-xs text-brand font-mono mt-0.5">OCEANEMBED GENERATED PREDICTION</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-h-[250px] mt-2 flex flex-col">
                     {viewMode === 'point' ? (
                       <>
                         <div className="flex justify-between items-end border-b border-ocean pb-3 mb-3 bg-elevated/30 rounded-lg p-3">
                          <div className="space-y-1 text-center">
                            <span className="text-ice font-bold text-lg">{results.temperature_c[0]}°C</span>
                            <div className="text-muted-ice text-xs uppercase tracking-wider">Surface</div>
                          </div>
                          <div className="space-y-1 text-center">
                            <span className="text-seafoam font-bold text-lg">{results.temperature_c[7]}°C</span>
                            <div className="text-muted-ice text-xs uppercase tracking-wider">Thermocline</div>
                          </div>
                          <div className="space-y-1 text-center">
                            <span className="text-warning font-bold text-lg">{results.temperature_c[12]}°C</span>
                            <div className="text-muted-ice text-xs uppercase tracking-wider">Mesopelagic</div>
                          </div>
                        </div>
                        <div className="flex-1 bg-deep/50 rounded-lg p-2 border border-ocean/50">
                          <SubsurfaceProfileChart data={results} />
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 -mt-2">
                        <TransectChart lat={selectedLocation.lat} lon={selectedLocation.lon} />
                      </div>
                    )}
                 </div>
               </div>
             ) : (
               <div className="flex-1 my-2 border-2 border-dashed border-ocean rounded-xl flex items-center justify-center flex-col text-muted-ice text-sm font-mono bg-elevated/10 min-h-[250px]">
                 <Crosshair className="w-8 h-8 mb-3 opacity-40 text-brand" />
                 Select geographic coordinates and click "RUN RECONSTRUCTION"
               </div>
             )}
           </div>

           {/* Float Comparison Card */}
           {results && viewMode === 'point' && (
             <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-ocean bg-elevated/20 p-5 flex flex-col justify-between shrink-0">
               <div>
                 <span className="inline-block px-2 py-1 rounded bg-argo/10 text-[10px] font-mono uppercase text-argo font-bold tracking-wider mb-3">
                   In-Situ Verification
                 </span>
                 <h4 className="text-sm font-display font-bold text-ice mt-1">
                   {results.nearest_argo.float_id}
                 </h4>
                 <p className="text-xs text-muted-ice mt-1 flex justify-between border-b border-ocean pb-2">
                   Match distance: <strong className="text-ice">{results.nearest_argo.distance_km} km</strong>
                 </p>
               </div>

               <div className="space-y-2 font-mono text-xs my-4">
                 <div className="p-2.5 rounded-lg bg-deep/80 border border-ocean/60 flex justify-between items-center shadow-inner">
                   <span className="text-muted-ice">Mean Bias</span>
                   <span className="text-warning font-bold">+{results.metrics.mean_bias}°C</span>
                 </div>
                 <div className="p-2.5 rounded-lg bg-deep/80 border border-ocean/60 flex justify-between items-center shadow-inner">
                   <span className="text-muted-ice">RMSE</span>
                   <span className="text-seafoam font-bold">{results.metrics.rmse}</span>
                 </div>
                 <div className="p-2.5 rounded-lg bg-brand/10 border border-brand/30 flex justify-between items-center shadow-glow">
                   <span className="text-brand">Confidence</span>
                   <span className="text-brand font-bold text-sm">94.2%</span>
                 </div>
               </div>

               <button className="w-full py-2.5 bg-midnight hover:bg-elevated text-xs font-mono text-seafoam border border-brand/40 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm">
                 Export LAS Matchup <ArrowUpRight className="w-4 h-4" />
               </button>
             </div>
           )}
         </div>
       </div>

       {/* Right Query Panel */}
       <div className="w-full lg:w-80 border border-ocean bg-midnight/90 rounded-xl p-6 flex flex-col justify-between z-20 shadow-xl shrink-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
         <div className="space-y-6">
           <div>
             <span className="text-xs font-mono text-brand uppercase tracking-wider font-semibold">Analysis Mode</span>
             <div className="flex bg-deep rounded-xl p-1.5 mt-3 border border-ocean shadow-inner">
               <button 
                 onClick={() => setViewMode('point')}
                 className={`flex-1 py-2 text-xs font-mono rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${viewMode === 'point' ? 'bg-elevated text-ice shadow border border-brand/30' : 'text-muted-ice hover:text-ice'}`}
               >
                 <Crosshair className="w-4 h-4" /> 1D Profile
               </button>
               <button 
                 onClick={() => setViewMode('transect')}
                 className={`flex-1 py-2 text-xs font-mono rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${viewMode === 'transect' ? 'bg-elevated text-ice shadow border border-brand/30' : 'text-muted-ice hover:text-ice'}`}
               >
                 <Activity className="w-4 h-4" /> 3D Volume
               </button>
             </div>
           </div>

           <div className="bg-elevated/20 p-4 rounded-xl border border-ocean/50">
             <h3 className="font-display font-medium text-ice text-sm mb-4">Query Parameters</h3>
             <div className="space-y-4 font-mono text-xs">
               <div>
                 <label className="text-muted-ice block mb-1.5">LATITUDE (°N)</label>
                 <input
                   type="number"
                   value={selectedLocation.lat.toFixed(4)}
                   onChange={(e) =>
                     dispatch(setLocation({ ...selectedLocation, lat: parseFloat(e.target.value) || 0 }))
                   }
                   className="w-full bg-deep border border-ocean rounded-lg px-3 py-2 text-ice focus:border-brand outline-none transition-colors"
                 />
               </div>

               <div>
                 <label className="text-muted-ice block mb-1.5">LONGITUDE (°E)</label>
                 <input
                   type="number"
                   value={selectedLocation.lon.toFixed(4)}
                   onChange={(e) =>
                     dispatch(setLocation({ ...selectedLocation, lon: parseFloat(e.target.value) || 0 }))
                   }
                   className="w-full bg-deep border border-ocean rounded-lg px-3 py-2 text-ice focus:border-brand outline-none transition-colors"
                 />
               </div>

               <div>
                 <label className="text-muted-ice block mb-1.5 flex items-center gap-1.5">
                   <Calendar className="w-3.5 h-3.5" /> TARGET DATE
                 </label>
                 <input
                   type="date"
                   value={selectedDate}
                   onChange={(e) => dispatch(setDate(e.target.value))}
                   className="w-full bg-deep border border-ocean rounded-lg px-3 py-2 text-ice focus:border-brand outline-none transition-colors"
                 />
               </div>
             </div>
           </div>

           <div>
             <span className="text-[11px] font-mono text-muted-ice block mb-2.5">
               SURFACE SATELLITE INPUTS
             </span>
             <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
               {['SST (NOAA)', 'SSH (Jason-3)', 'SSS (SMAP)', 'Winds (ASCAT)'].map((layer) => (
                 <div key={layer} className="flex items-center gap-1.5 p-1.5 rounded bg-brand/5 text-ice border border-brand/20">
                   <Check className="w-3.5 h-3.5 text-brand" /> {layer}
                 </div>
               ))}
             </div>
           </div>
         </div>

         <button
           onClick={() => dispatch(runReconstruction())}
           disabled={isInferring}
           className="w-full mt-6 py-3.5 bg-brand hover:bg-brand/90 text-deep font-display font-bold text-sm tracking-wide rounded-xl shadow-glow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:shadow-none"
         >
           {isInferring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
           {isInferring ? 'INFERRING...' : 'RUN RECONSTRUCTION'}
         </button>
       </div>
     </div>
    </div>
  );
};