import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

interface TransectChartProps {
  lat: number;
  lon: number;
}

export const TransectChart: React.FC<TransectChartProps> = ({ lat, lon }) => {
  // Generate a mock 3D field resembling a 100km horizontal slice over depth.
  // Using stacked 'surface' traces for fully connected 3D layers.
  
  const plotData = useMemo(() => {
    const depths = [0, 20, 50, 100, 200, 500, 1000];
    const lats = Array.from({ length: 20 }, (_, i) => lat - 0.5 + i * 0.05);
    const lons = Array.from({ length: 20 }, (_, i) => lon - 0.5 + i * 0.05);

    const traces: any[] = [];

    depths.forEach((depth, idx) => {
      const zMatrix: number[][] = [];
      const colorMatrix: number[][] = [];

      for (let i = 0; i < lats.length; i++) {
        const zRow: number[] = [];
        const colorRow: number[] = [];
        
        for (let j = 0; j < lons.length; j++) {
          const currentLat = lats[i];
          const currentLon = lons[j];
          zRow.push(-depth); // Constant depth layer
          
          // Mock temperature based on depth and spatial variance
          const baseTemp = 28 - (depth / 1000) * 24;
          const noise = Math.sin(currentLat * 8) * Math.cos(currentLon * 8) * 1.5;
          const temp = Math.max(2, baseTemp + noise * (1 - depth/1500));
          colorRow.push(temp);
        }
        zMatrix.push(zRow);
        colorMatrix.push(colorRow);
      }

      traces.push({
        type: 'surface',
        x: lons,
        y: lats,
        z: zMatrix,
        surfacecolor: colorMatrix,
        colorscale: 'Turbo',
        cmin: 2,
        cmax: 30,
        opacity: 0.9,
        showscale: idx === 0, // only show colorbar for the first trace to avoid duplicates
        colorbar: {
          title: 'Temp (°C)',
          thickness: 12,
          len: 0.8,
          y: 0.5,
          tickfont: { color: '#91AFB3', size: 10 },
          titlefont: { color: '#E8F7F5', size: 11 },
        },
        hovertemplate: 
          'Lon: %{x:.2f}°<br>' +
          'Lat: %{y:.2f}°<br>' +
          `Depth: ${depth}m<br>` +
          'Temp: %{surfacecolor:.1f}°C<extra></extra>',
      });
    });

    return traces;
  }, [lat, lon]);

  return (
    <div className="w-full h-full min-h-[450px] bg-[#061A24] border border-[#5EEAD4]/20 rounded-xl p-0 relative flex flex-col overflow-visible shadow-[0_0_30px_rgba(15,175,154,0.15)]">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="font-display text-[#E8F7F5] text-sm uppercase tracking-wider drop-shadow-md">3D Subsurface Layers</h3>
        <span className="text-xs font-mono text-[#0FAF9A] bg-[#0FAF9A]/10 px-2 py-1 rounded backdrop-blur-sm border border-[#0FAF9A]/20">Fully Connected Mesh</span>
      </div>
      
      <div className="flex-1 w-full relative min-h-[400px]">
        <Plot
          data={plotData}
          layout={{
            autosize: true,
            margin: { l: 20, r: 20, b: 20, t: 30, pad: 10 }, // Increased margins to prevent cutoff
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            scene: {
              xaxis: { 
                title: 'Longitude', 
                color: '#91AFB3', 
                gridcolor: '#092B36', 
                zerolinecolor: '#0D3440',
                backgroundcolor: 'transparent',
                showbackground: false
              },
              yaxis: { 
                title: 'Latitude', 
                color: '#91AFB3', 
                gridcolor: '#092B36', 
                zerolinecolor: '#0D3440',
                backgroundcolor: 'transparent',
                showbackground: false
              },
              zaxis: { 
                title: 'Depth (m)', 
                color: '#91AFB3', 
                gridcolor: '#092B36', 
                zerolinecolor: '#0D3440',
                backgroundcolor: 'transparent',
                showbackground: false
              },
              camera: {
                eye: { x: 1.6, y: 1.6, z: 0.6 }
              },
              aspectratio: { x: 1, y: 1, z: 0.8 }
            }
          }}
          useResizeHandler={true}
          style={{ width: '100%', height: '100%', minHeight: '400px' }}
          config={{ displayModeBar: false }}
        />
      </div>
    </div>
  );
};
