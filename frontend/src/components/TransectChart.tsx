import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Mock data representing a 100km horizontal slice of the ocean
const mockTransectData = Array.from({ length: 20 }).map((_, i) => ({
  distance: i * 5, // km
  surface: 28.5 + Math.sin(i * 0.5) * 0.5,
  thermocline: 22.0 + Math.sin(i * 0.5) * 1.2,
  deep: 14.0 + Math.sin(i * 0.2) * 0.8,
  abyssal: 4.5,
}));

export const TransectChart: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[250px] bg-midnight border border-ocean rounded-xl p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display text-ice text-sm uppercase tracking-wider">Horizontal Cross-Section (Transect)</h3>
        <span className="text-xs font-mono text-brand bg-brand/10 px-2 py-1 rounded">Distance: 100 km</span>
      </div>
      
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockTransectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSurface" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorThermo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid stroke="#092B36" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="distance" tick={{ fill: '#91AFB3', fontSize: 10 }} stroke="#0D3440" unit="km" />
            <YAxis reversed domain={[0, 30]} tick={{ fill: '#91AFB3', fontSize: 10 }} stroke="#0D3440" unit="°C" />
            
            <Tooltip contentStyle={{ backgroundColor: '#061A24', borderColor: '#0FAF9A' }} />
            
            <Area type="monotone" dataKey="surface" stroke="#EF4444" fillOpacity={1} fill="url(#colorSurface)" name="Surface Temp" />
            <Area type="monotone" dataKey="thermocline" stroke="#F59E0B" fillOpacity={1} fill="url(#colorThermo)" name="Thermocline (100m)" />
            <Area type="monotone" dataKey="deep" stroke="#0FAF9A" fillOpacity={0.1} name="Mesopelagic (500m)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};