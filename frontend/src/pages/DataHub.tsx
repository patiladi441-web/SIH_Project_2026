import React from 'react';
import { Database, Search, DownloadCloud, ArrowUpRight, CheckCircle2, ShieldAlert } from 'lucide-react';

const DATASETS = [
  {
    name: 'Sea Surface Temperature (SST)',
    source: 'NOAA OISST / CMEMS',
    spatial: '0.25°',
    temporal: 'Daily',
    coverage: '1981 - 2026',
    status: 'Available',
    type: 'Surface Input'
  },
  {
    name: 'Sea Surface Height (SSH / SLA)',
    source: 'ISRO / CMEMS (Jason-3)',
    spatial: '0.25°',
    temporal: 'Daily',
    coverage: '1993 - 2026',
    status: 'Available',
    type: 'Surface Input'
  },
  {
    name: 'Sea Surface Salinity (SSS)',
    source: 'SMAP / CMEMS',
    spatial: '0.25°',
    temporal: 'Daily',
    coverage: '2015 - 2026',
    status: 'Available',
    type: 'Surface Input'
  },
  {
    name: 'Surface Winds (U, V)',
    source: 'Oceansat-3 / ASCAT',
    spatial: '0.25°',
    temporal: 'Daily',
    coverage: '2000 - 2026',
    status: 'Available',
    type: 'Surface Input'
  },
  {
    name: 'Subsurface Temperature (Target)',
    source: 'GLORYS12V1 Reanalysis',
    spatial: '0.25°',
    temporal: 'Daily',
    coverage: '1993 - 2026',
    status: 'Available',
    type: 'Training Target'
  },
  {
    name: 'In-Situ Profiles',
    source: 'INCOIS / Argo GDAC',
    spatial: 'Variable',
    temporal: '~10 Days',
    coverage: '2000 - 2026',
    status: 'Live Matchup',
    type: 'Validation'
  },
];

export const DataHub: React.FC = () => {
  return (
    <div className="h-[calc(100vh-4rem)] w-full bg-deep text-ice overflow-y-auto font-sans p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div>
            <div className="flex items-center gap-2 text-brand font-mono text-xs uppercase tracking-widest mb-2">
              <Database className="w-4 h-4" />
              <span>Data Explorer</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-ice">Satellite & Ocean Datasets</h1>
            <p className="text-muted-ice mt-2 max-w-2xl text-sm leading-relaxed">
              Standardized, harmonized, and regridded inputs for the OceanEmbed representation learning pipeline. 
              All data is spatially interpolated to a common 0.25° × 0.25° grid covering the North Indian Ocean.
            </p>
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-ice" />
              <input 
                type="text" 
                placeholder="Search catalog..." 
                className="pl-9 pr-4 py-2.5 bg-midnight border border-ocean rounded-lg text-sm text-ice focus:border-brand-light outline-none w-64 transition-all shadow-inner"
              />
            </div>
            <button className="flex items-center gap-2 bg-brand/10 hover:bg-brand/20 border border-brand/30 text-brand-light px-4 py-2.5 rounded-lg text-sm transition-all cursor-pointer shadow-glow">
              <DownloadCloud className="w-4 h-4" />
              Export Manifest
            </button>
          </div>
        </div>

        {/* Data Catalog Table */}
        <div className="bg-midnight/90 border border-ocean rounded-xl overflow-hidden shadow-xl backdrop-blur-md animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-elevated/40 border-b border-ocean">
                  <th className="px-6 py-4 font-mono text-xs text-muted-ice uppercase font-medium">Dataset</th>
                  <th className="px-6 py-4 font-mono text-xs text-muted-ice uppercase font-medium">Source / Agency</th>
                  <th className="px-6 py-4 font-mono text-xs text-muted-ice uppercase font-medium">Resolution</th>
                  <th className="px-6 py-4 font-mono text-xs text-muted-ice uppercase font-medium">Coverage</th>
                  <th className="px-6 py-4 font-mono text-xs text-muted-ice uppercase font-medium">Role</th>
                  <th className="px-6 py-4 font-mono text-xs text-muted-ice uppercase font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ocean text-sm">
                {DATASETS.map((data, idx) => (
                  <tr key={idx} className="hover:bg-elevated/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-display font-medium text-ice group-hover:text-brand-light transition-colors">{data.name}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-ice">{data.source}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-ice">{data.spatial}</span>
                        <span className="text-xs text-muted-ice">{data.temporal}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-ice font-mono text-xs">{data.coverage}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono border shadow-sm ${
                        data.type === 'Surface Input' ? 'bg-satellite/10 text-satellite border-satellite/20' : 
                        data.type === 'Validation' ? 'bg-argo/10 text-argo border-argo/20' : 
                        'bg-ai/10 text-brand-light border-ai/20'
                      }`}>
                        {data.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {data.status === 'Available' ? (
                          <CheckCircle2 className="w-4 h-4 text-brand" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-warning" />
                        )}
                        <span className={data.status === 'Available' ? 'text-brand' : 'text-warning'}>
                          {data.status}
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-muted-ice opacity-0 group-hover:opacity-100 transition-opacity ml-2 cursor-pointer hover:text-brand-light" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-elevated/20 border-t border-ocean px-6 py-4 flex items-center justify-between text-xs font-mono text-muted-ice">
            <span>Showing 6 of 6 harmonized datasets</span>
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand animate-pulse" /> OPENDAP Servers Online</span>
          </div>
        </div>

      </div>
    </div>
  );
};
