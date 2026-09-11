import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../app/store';
import { setView } from '../features/explorerSlice';
import {
  Compass,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import gsap from 'gsap';

export const LandingPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        headlineRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.0, delay: 0.1 }
      )
        .fromTo(
          subheadRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8 },
          '-=0.6'
        )
        .fromTo(
          statsRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8 },
          '-=0.4'
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={heroRef} className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden ocean-grid bg-deep">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-brand/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[300px] bg-satellite/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 pt-12 pb-12 w-full flex-1 flex flex-col justify-center relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Earth Image */}
          <div className="flex justify-center items-center w-full">
             <img 
               src="/earth.png" 
               alt="Earth" 
               className="w-full max-w-[650px] lg:max-w-[720px] object-contain rounded-2xl"
             />
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-midnight border border-ocean text-brand-light font-mono text-xs mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              <span>SATELLITE INTELLIGENCE FOR A DEEPER TOMORROW</span>
            </div>

            <h1
              ref={headlineRef}
              className="font-display font-bold text-5xl md:text-7xl tracking-tight text-ice leading-[1.05] uppercase"
            >
              SEE BELOW <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-light via-brand to-satellite">
                THE SURFACE.
              </span>
            </h1>

            <p
              ref={subheadRef}
              className="mt-6 text-muted-ice text-base md:text-lg max-w-2xl font-sans leading-relaxed"
            >
              OceanEmbed leverages multi-source surface satellite observations (SST, SSH, SSS,
              Winds) and deep representation learning to reconstruct 3D subsurface ocean temperature
              profiles down to 1000m depth across the North Indian Ocean.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => dispatch(setView('explorer'))}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-brand hover:bg-brand-glow text-ice font-display font-semibold text-sm tracking-wide shadow-glow transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Explore the Ocean</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => dispatch(setView('about'))}
                className="flex items-center gap-2 px-5 py-3.5 rounded-lg bg-midnight/90 hover:bg-elevated text-ice font-mono text-xs border border-ocean hover:border-brand-light/50 transition-all cursor-pointer"
              >
                <span>Methodology & Architecture</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-ice" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={statsRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 pt-10 border-t border-ocean"
        >
          <div className="p-5 rounded-2xl bg-midnight/80 border border-ocean backdrop-blur-md shadow-lg transition-transform hover:-translate-y-1">
            <div className="flex items-center gap-2 text-muted-ice text-xs font-mono mb-2">
              <Layers className="w-4 h-4 text-satellite" />
              <span>INPUT DATASETS</span>
            </div>
            <div className="text-2xl font-display font-bold text-ice"> 7 Sources</div>
            <div className="text-[11px] font-mono text-muted-ice/70 mt-1">SST • SSH • SSS • WIND • CURRENTS </div>
          </div>

          <div className="p-5 rounded-2xl bg-midnight/80 border border-ocean backdrop-blur-md shadow-lg transition-transform hover:-translate-y-1">
            <div className="flex items-center gap-2 text-muted-ice text-xs font-mono mb-2">
              <Compass className="w-4 h-4 text-brand" />
              <span>VERTICAL REACH</span>
            </div>
            <div className="text-2xl font-display font-bold text-brand-light">0 - 1000 m</div>
            <div className="text-[11px] font-mono text-muted-ice/70 mt-1">12 standard levels</div>
          </div>

          <div className="p-5 rounded-2xl bg-midnight/80 border border-ocean backdrop-blur-md shadow-lg transition-transform hover:-translate-y-1">
            <div className="flex items-center gap-2 text-muted-ice text-xs font-mono mb-2">
              <Database className="w-4 h-4 text-argo" />
              <span>RESOLUTION</span>
            </div>
            <div className="text-2xl font-display font-bold text-ice">0.25° Daily</div>
            <div className="text-[11px] font-mono text-muted-ice/70 mt-1">GLORYS12V1 aligned</div>
          </div>

          <div className="p-5 rounded-2xl bg-midnight/80 border border-ocean backdrop-blur-md shadow-lg transition-transform hover:-translate-y-1">
            <div className="flex items-center gap-2 text-muted-ice text-xs font-mono mb-2">
              <Sparkles className="w-4 h-4 text-ai" />
              <span>VALIDATION</span>
            </div>
            <div className="text-2xl font-display font-bold text-brand">Real ARGO</div>
            <div className="text-[11px] font-mono text-muted-ice/70 mt-1">LAS in-situ float matchups</div>
          </div>
        </div>
      </div>

      <div className="border-t border-ocean bg-midnight/50 px-6 py-4 flex flex-wrap items-center justify-between text-xs font-mono text-muted-ice z-20 relative">
        <div>Problem Statement ID: 26066 • Ministry of Earth Sciences (MoES) / INCOIS</div>
        <div className="flex gap-6">
          <span>Lat: 5°N - 30°N</span>
          <span>Lon: 45°E - 105°E</span>
        </div>
      </div>
    </div>
  );
};