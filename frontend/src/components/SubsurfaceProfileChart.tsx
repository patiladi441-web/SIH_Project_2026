import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { ReconstructionResponse } from '../types/ocean';

interface Props {
  data: ReconstructionResponse;
}

export const SubsurfaceProfileChart: React.FC<Props> = React.memo(({ data }) => {
  const chartData = useMemo(() => {
    return data.depths_m.map((depth, idx) => {
      const ai = data.temperature_c[idx];
      const conf = data.confidence[idx] || 0.9;
      const margin = (1 - conf) * 4; 

      return {
        depth,
        aiTemp: ai,
        argoTemp: data.nearest_argo?.temperature_c?.[idx] ?? null,
        confUpper: parseFloat((ai + margin).toFixed(2)),
        confLower: parseFloat((ai - margin).toFixed(2)),
      };
    });
  }, [data]);

  return (
    <div className="w-full h-full min-h-[200px] flex flex-col pt-2 font-mono text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart layout="vertical" data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#092B36" strokeDasharray="3 3" horizontal vertical />
          
          <XAxis 
            type="number" 
            domain={[2, 32]} 
            tick={{ fill: '#91AFB3', fontSize: 10 }}
            stroke="#0D3440" 
            orientation="top" 
            unit="°C"
          />
          
          <YAxis 
            dataKey="depth" 
            type="number" 
            reversed 
            domain={[0, 1000]} 
            ticks={[0, 100, 200, 500, 1000]} 
            tick={{ fill: '#91AFB3', fontSize: 10 }}
            stroke="#0D3440"
            unit="m"
          />

          <Tooltip
            contentStyle={{ backgroundColor: '#061A24', borderColor: '#0FAF9A', borderRadius: '8px' }}
            itemStyle={{ color: '#E8F7F5' }}
            labelFormatter={(label) => `Depth: ${label}m`}
          />

          {/* AI Confidence Band */}
          <Area dataKey="confUpper" stroke="none" fill="#0FAF9A" fillOpacity={0.1} />
          
          {/* Real Argo Float Data */}
          <Line 
            type="monotone" 
            dataKey="argoTemp" 
            stroke="#F59E0B" 
            strokeWidth={2} 
            strokeDasharray="4 4" 
            dot={{ fill: '#F59E0B', r: 2 }} 
            name="ARGO In-Situ" 
          />

          {/* OceanEmbed AI Prediction */}
          <Line 
            type="monotone" 
            dataKey="aiTemp" 
            stroke="#14B8A6" 
            strokeWidth={2.5} 
            dot={{ fill: '#14B8A6', r: 2 }} 
            name="OceanEmbed AI" 
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 px-6 text-[10px] text-muted-ice">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-ai" /> OceanEmbed</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-argo" /> ARGO Float</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-brand/20 border border-brand border-dashed" /> Confidence Bounds</span>
      </div>
    </div>
  );
});

