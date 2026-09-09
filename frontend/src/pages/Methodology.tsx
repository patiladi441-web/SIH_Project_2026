import React from 'react';
import { Network, Satellite, Layers, Waves, ArrowRight, Cpu, ArrowDown } from 'lucide-react';

export const Methodology: React.FC = () => {
  return (
    <div className="h-[calc(100vh-4rem)] w-full bg-deep text-ice overflow-y-auto font-sans p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div>
          <div className="flex items-center gap-2 text-brand font-mono text-xs uppercase tracking-widest mb-2">
            <Cpu className="w-4 h-4" />
            <span>Architecture</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-ice">From Surface Signals to Subsurface Insights</h1>
          <p className="text-muted-ice mt-3 max-w-3xl text-sm leading-relaxed">
            OceanEmbed treats the ocean as a 3D volume where surface dynamics are mathematically coupled to subsurface stratifications. 
            Instead of traditional statistical regression, we utilize deep representation learning to generate multi-dimensional 
            <strong> Satellite Embeddings</strong>—compact latent vectors that capture hidden ocean dynamics.
          </p>
        </div>

        {/* Visual Pipeline Diagram */}
        <div className="bg-midnight border border-ocean rounded-xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#0FAF9A_1px,transparent_1px)] [background-size:20px_20px] opacity-5 pointer-events-none" />
          
          <h3 className="font-display font-medium text-ice mb-8 relative z-10">End-to-End Deep Learning Pipeline</h3>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            
            {/* Stage 1: Surface Inputs */}
            <div className="flex-1 w-full bg-elevated border border-ocean rounded-lg p-5 flex flex-col items-center text-center shadow-lg">
              <div className="w-12 h-12 bg-satellite/10 text-satellite rounded-full flex items-center justify-center mb-3">
                <Satellite className="w-6 h-6" />
              </div>
              <h4 className="font-mono text-xs font-semibold text-ice mb-2">1. Surface Observations</h4>
              <p className="text-[11px] text-muted-ice mb-3">0.25° Resolution Daily Grids</p>
              <div className="flex flex-wrap justify-center gap-1.5 text-[10px] font-mono">
                <span className="bg-deep px-2 py-1 rounded border border-ocean">SST</span>
                <span className="bg-deep px-2 py-1 rounded border border-ocean">SSH</span>
                <span className="bg-deep px-2 py-1 rounded border border-ocean">SSS</span>
                <span className="bg-deep px-2 py-1 rounded border border-ocean">WINDS</span>
              </div>
            </div>

            <ArrowRight className="hidden lg:block w-6 h-6 text-brand opacity-60" />
            <ArrowDown className="block lg:hidden w-6 h-6 text-brand opacity-60" />

            {/* Stage 2: Encoder & Latent Space */}
            <div className="flex-1 w-full bg-brand/5 border border-brand/20 rounded-lg p-5 flex flex-col items-center text-center shadow-glow">
              <div className="w-12 h-12 bg-brand/20 text-brand rounded-full flex items-center justify-center mb-3">
                <Network className="w-6 h-6" />
              </div>
              <h4 className="font-mono text-xs font-semibold text-seafoam mb-2">2. Spatial Embedding Engine</h4>
              <p className="text-[11px] text-muted-ice mb-3">Vision Transformer (ViT) / CNN</p>
              <p className="text-[10px] font-mono text-brand bg-brand/10 px-3 py-1.5 rounded border border-brand/20">
                Latent Vector Space (Z)
              </p>
            </div>

            <ArrowRight className="hidden lg:block w-6 h-6 text-brand opacity-60" />
            <ArrowDown className="block lg:hidden w-6 h-6 text-brand opacity-60" />

            {/* Stage 3: Depth Decoder */}
            <div className="flex-1 w-full bg-elevated border border-ocean rounded-lg p-5 flex flex-col items-center text-center shadow-lg">
              <div className="w-12 h-12 bg-ai/10 text-ai rounded-full flex items-center justify-center mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="font-mono text-xs font-semibold text-ice mb-2">3. Vertical Depth Decoder</h4>
              <p className="text-[11px] text-muted-ice mb-3">Non-linear profile reconstruction</p>
              <div className="flex flex-wrap justify-center gap-1.5 text-[10px] font-mono">
                <span className="bg-deep px-2 py-1 rounded border border-ocean text-ai">0m</span>
                <span className="bg-deep px-2 py-1 rounded border border-ocean text-ai">→</span>
                <span className="bg-deep px-2 py-1 rounded border border-ocean text-ai">1000m</span>
              </div>
            </div>
            
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-midnight border border-ocean rounded-xl p-6">
            <h3 className="flex items-center gap-2 font-display font-medium text-ice mb-4">
              <Network className="w-4 h-4 text-brand" /> Supported Architectures
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted-ice">
                <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5" />
                <div><strong className="text-ice">Vision Transformers (ViT):</strong> Captures long-range spatial dependencies (e.g., Rossby waves crossing the basin).</div>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-ice">
                <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5" />
                <div><strong className="text-ice">Convolutional Neural Networks (CNN):</strong> Highly efficient for local mesoscale eddy feature extraction.</div>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-ice">
                <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5" />
                <div><strong className="text-ice">Attention-based Hybrid:</strong> Fuses spatial surface fields with temporal seasonality vectors.</div>
              </li>
            </ul>
          </div>

          <div className="bg-midnight border border-ocean rounded-xl p-6">
            <h3 className="flex items-center gap-2 font-display font-medium text-ice mb-4">
              <Waves className="w-4 h-4 text-argo" /> Validation Strategy
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted-ice">
                <span className="w-1.5 h-1.5 rounded-full bg-argo mt-1.5" />
                <div><strong className="text-ice">Ground Truth:</strong> GLORYS12V1 Global Ocean Reanalysis (Training Target).</div>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-ice">
                <span className="w-1.5 h-1.5 rounded-full bg-argo mt-1.5" />
                <div><strong className="text-ice">Independent Verification:</strong> INCOIS Live Access Server Gridded ARGO float observations.</div>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-ice">
                <span className="w-1.5 h-1.5 rounded-full bg-argo mt-1.5" />
                <div><strong className="text-ice">Metrics:</strong> Root Mean Square Error (RMSE), Pearson Correlation Coefficient, and Mean Bias evaluated across 15 standard depth layers.</div>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Footer padding for scrollability */}
        <div className="h-10"></div>
      </div>
    </div>
  );
};