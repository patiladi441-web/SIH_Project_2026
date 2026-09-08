import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../app/store';
import { setView, type ActiveView } from '../features/explorerSlice';
import { Waves, Compass, Database, Info, ArrowUpRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentView = useSelector((state: RootState) => state.explorer.currentView);

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode }[] = [
    { id: 'landing', label: 'Home', icon: <Waves className="w-3.5 h-3.5" /> },
    { id: 'explorer', label: 'Explorer', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'data', label: 'Data Hub', icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'about', label: 'Methodology', icon: <Info className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="h-14 w-full border-b border-ocean bg-deep/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch(setView('landing'))}
          className="flex items-center gap-2 text-left group cursor-pointer"
        >
          <div className="w-7 h-7 rounded-md bg-brand/10 border border-brand/30 flex items-center justify-center text-brand group-hover:border-seafoam transition-colors">
            <Waves className="w-4 h-4 text-brand" />
          </div>
          <div>
            <div className="font-display font-bold text-sm tracking-widest text-ice flex items-center gap-1.5">
              OCEANEMBED
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            </div>
            <div className="text-[10px] font-mono text-muted-ice tracking-tighter">
              MoES · INCOIS AI WORKBENCH
            </div>
          </div>
        </button>

        <div className="h-5 w-[1px] bg-ocean hidden sm:block" />

        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-muted-ice">
          <span className="px-2 py-0.5 rounded bg-midnight border border-ocean text-seafoam">
            NORTH INDIAN OCEAN (5°N–30°N)
          </span>
          <span className="text-muted-ice/70">RES: 0.25° DAILY</span>
        </div>
      </div>

      <nav className="flex items-center gap-1 bg-midnight/80 p-1 rounded-lg border border-ocean">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => dispatch(setView(item.id))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand/20 text-seafoam border border-brand/30 font-medium'
                  : 'text-muted-ice hover:text-ice hover:bg-elevated/50'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-muted-ice">
          <span className="w-2 h-2 rounded-full bg-brand" />
          <span>LAS ARGO MATCHUP LIVE</span>
        </div>

        <button
          onClick={() => dispatch(setView('explorer'))}
          className="flex items-center gap-1.5 bg-brand hover:bg-brand/90 text-deep px-3.5 py-1.5 rounded-md font-display font-semibold text-xs tracking-wide shadow-glow transition-all active:scale-95 cursor-pointer"
        >
          <span>Launch Station</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};