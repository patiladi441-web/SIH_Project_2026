export interface ReconstructionRequest {
  latitude: number;
  longitude: number;
  date: string;
}

export interface ArgoProfile {
  float_id: string;
  distance_km: number;
  depths_m: number[];
  temperature_c: number[];
}

export interface ReconstructionResponse {
  depths_m: number[];
  temperature_c: number[];
  confidence: number[];
  nearest_argo: ArgoProfile;
  metrics: {
    rmse: number;
    correlation: number;
    mean_bias: number;
  };
}

export const STANDARD_DEPTHS = [
  0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000
];