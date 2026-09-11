import React, { useEffect, useState, useCallback } from 'react';
import { History, RefreshCw, Zap, Database, Clock, MapPin, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { fetchQueryLogs, type QueryLogEntry, type QueryLogsResponse } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCoord(val: number, isLat: boolean): string {
  const abs = Math.abs(val).toFixed(3);
  const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
  return `${abs}°${dir}`;
}

function formatDateTime(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  } catch {
    return { date: iso.slice(0, 10), time: '' };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface QueryHistoryProps {
  /** If provided, the panel auto-refreshes when this counter increments (e.g. after a new reconstruct call). */
  refreshTrigger?: number;
}

export const QueryHistory: React.FC<QueryHistoryProps> = ({ refreshTrigger }) => {
  const [data, setData] = useState<QueryLogsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 10;

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchQueryLogs(p, PAGE_SIZE);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load query history');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + when page changes
  useEffect(() => {
    load(page);
  }, [page, load]);

  // Auto-refresh when a new query is made
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      setPage(1);
      load(1);
    }
  }, [refreshTrigger, load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const hitRate = data ? Math.round(data.cache_hit_rate * 100) : 0;

  return (
    <div className="flex flex-col bg-midnight/90 border border-ocean rounded-xl overflow-hidden shadow-xl backdrop-blur-md animate-slide-up">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-ocean bg-elevated/30">
        <div className="flex items-center gap-2.5">
          <History className="w-4 h-4 text-brand" />
          <span className="font-display font-semibold text-ice text-sm uppercase tracking-wider">
            Query History
          </span>
          {data && (
            <span className="px-2 py-0.5 bg-brand/15 text-brand border border-brand/30 rounded-full text-[10px] font-mono">
              {data.total} total
            </span>
          )}
        </div>

        {/* Stats + Refresh */}
        <div className="flex items-center gap-3">
          {data && data.total > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-ice">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-amber-300 font-semibold">{hitRate}%</span>
              <span>cache hit</span>
            </div>
          )}
          <button
            onClick={() => load(page)}
            disabled={loading}
            className="p-1.5 rounded-lg text-muted-ice hover:text-ice hover:bg-elevated/60 transition-colors cursor-pointer disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-x-auto">
        {error ? (
          /* Error state — backend probably not running */
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center px-6">
            <AlertCircle className="w-8 h-8 text-red-400/70" />
            <p className="text-sm text-muted-ice font-mono">{error}</p>
            <p className="text-xs text-muted-ice/60">
              Make sure Docker containers are running:&nbsp;
              <code className="text-brand-light bg-elevated/60 px-1.5 py-0.5 rounded">docker compose up -d</code>
            </p>
          </div>
        ) : loading && !data ? (
          /* Skeleton loader */
          <div className="divide-y divide-ocean/50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-4 animate-pulse">
                <div className="w-28 h-3 bg-elevated/60 rounded" />
                <div className="w-20 h-3 bg-elevated/60 rounded" />
                <div className="w-16 h-3 bg-elevated/60 rounded" />
                <div className="ml-auto w-14 h-5 bg-elevated/60 rounded-full" />
              </div>
            ))}
          </div>
        ) : data && data.total === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center px-6">
            <Database className="w-8 h-8 text-muted-ice/40" />
            <p className="text-sm font-display text-muted-ice">No queries yet</p>
            <p className="text-xs text-muted-ice/60">
              Use the Explorer to query a location — each request is logged to PostgreSQL.
            </p>
          </div>
        ) : (
          /* Data table */
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-elevated/20 border-b border-ocean text-muted-ice uppercase text-[10px]">
                <th className="px-5 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> Coordinates
                  </span>
                </th>
                <th className="px-4 py-2.5 font-medium">Query Date</th>
                <th className="px-4 py-2.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Latency
                  </span>
                </th>
                <th className="px-4 py-2.5 font-medium">Cache</th>
                <th className="px-5 py-2.5 font-medium text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ocean/40">
              {data?.logs.map((row: QueryLogEntry) => {
                const { date: dt, time } = formatDateTime(row.created_at);
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-elevated/25 transition-colors group"
                  >
                    {/* ID */}
                    <td className="px-5 py-3 text-muted-ice/60">{row.id}</td>

                    {/* Coordinates */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-ice">{formatCoord(row.lat, true)}</span>
                        <span className="text-muted-ice">{formatCoord(row.lon, false)}</span>
                      </div>
                    </td>

                    {/* Query Date */}
                    <td className="px-4 py-3 text-muted-ice">{row.query_date}</td>

                    {/* Latency */}
                    <td className="px-4 py-3">
                      {row.response_time_ms != null ? (
                        <span className={`font-semibold ${
                          row.response_time_ms < 100 ? 'text-brand' :
                          row.response_time_ms < 500 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {row.response_time_ms}ms
                        </span>
                      ) : (
                        <span className="text-muted-ice/40">—</span>
                      )}
                    </td>

                    {/* Cache Hit */}
                    <td className="px-4 py-3">
                      {row.cache_hit ? (
                        <span className="px-2 py-0.5 bg-brand/15 text-brand border border-brand/30 rounded-full text-[10px]">
                          HIT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px]">
                          MISS
                        </span>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="px-5 py-3 text-right">
                      <div className="flex flex-col gap-0.5 items-end">
                        <span className="text-muted-ice">{dt}</span>
                        <span className="text-muted-ice/50 text-[10px]">{time}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination Footer ── */}
      {data && data.total > 0 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-ocean bg-elevated/20 text-[11px] font-mono text-muted-ice">
          <span>
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, data.total)} of{' '}
            <span className="text-ice font-semibold">{data.total}</span> queries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-1.5 rounded-lg hover:bg-elevated/60 transition-colors disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-ice">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-1.5 rounded-lg hover:bg-elevated/60 transition-colors disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
