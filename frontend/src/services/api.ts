/**
 * frontend/src/services/api.ts
 * ──────────────────────────────
 * API Client connecting the frontend UI to the FastAPI backend.
 */

import type { ReconstructionResponse } from '../types/ocean';

const API_BASE_URL = '/api/v1';

export interface ReconstructParams {
  latitude: number;
  longitude: number;
  date: string; // YYYY-MM-DD
}

/**
 * Calls backend POST /api/v1/reconstruct
 * Sends { latitude, longitude, date } and returns vertical profile & metrics.
 */
export const reconstructProfile = async (
  params: ReconstructParams
): Promise<ReconstructionResponse> => {
  const response = await fetch(`${API_BASE_URL}/reconstruct`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      latitude: params.latitude,
      longitude: params.longitude,
      date: params.date,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.detail?.[0]?.msg ||
      (typeof errorData?.detail === 'string' ? errorData.detail : null) ||
      `Server error: ${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  const data: ReconstructionResponse = await response.json();
  return data;
};

// ── Query Logs ────────────────────────────────────────────────────────────────

export interface QueryLogEntry {
  id: number;
  lat: number;
  lon: number;
  query_date: string;
  response_time_ms: number | null;
  cache_hit: boolean;
  status_code: number;
  created_at: string;
}

export interface QueryLogsResponse {
  total: number;
  page: number;
  page_size: number;
  cache_hit_rate: number;
  logs: QueryLogEntry[];
}

/**
 * Calls backend GET /api/v1/query-logs
 * Returns paginated query history from PostgreSQL query_logs table.
 */
export const fetchQueryLogs = async (
  page = 1,
  pageSize = 20
): Promise<QueryLogsResponse> => {
  const url = `${API_BASE_URL}/query-logs?page=${page}&page_size=${pageSize}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch query logs: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<QueryLogsResponse>;
};

