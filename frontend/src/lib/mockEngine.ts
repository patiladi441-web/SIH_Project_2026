import { STANDARD_DEPTHS, type ReconstructionResponse } from '../types/ocean';

export const simulateInference = async (
  lat: number,
  lon: number,
  _date: string
): Promise<ReconstructionResponse> => {
  await new Promise((r) => setTimeout(r, 2200));

  const sstBase = 28.5 + Math.sin(lat * 0.1) * 1.2 - Math.cos(lon * 0.05) * 0.8;
  const thermoclineDepth = 110 + Math.sin(lon * 0.2) * 35;

  const aiTemps = STANDARD_DEPTHS.map((z) => {
    const t = 4.0 + (sstBase - 4.0) / (1.0 + Math.exp((z - thermoclineDepth) / 55));
    return parseFloat(t.toFixed(2));
  });

  const argoTemps = aiTemps.map((t, i) => {
    const depthNoise = (Math.random() - 0.5) * (i < 5 ? 0.35 : 0.8);
    return parseFloat(Math.max(3.8, t + depthNoise).toFixed(2));
  });

  const confidence = STANDARD_DEPTHS.map((z) => {
    const val = 0.96 - (z / 1000) * 0.14 - Math.random() * 0.03;
    return parseFloat(val.toFixed(2));
  });

  return {
    depths_m: STANDARD_DEPTHS,
    temperature_c: aiTemps,
    confidence,
    nearest_argo: {
      float_id: `INCOIS-ARGO-${Math.floor(2900000 + Math.random() * 99999)}`,
      distance_km: parseFloat((18.4 + Math.random() * 24).toFixed(1)),
      depths_m: STANDARD_DEPTHS,
      temperature_c: argoTemps,
    },
    metrics: {
      rmse: 0.42,
      correlation: 0.982,
      mean_bias: 0.08,
    },
  };
};