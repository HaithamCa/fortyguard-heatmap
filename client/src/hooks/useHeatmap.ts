import { useState, useRef, useEffect } from 'react';
import type { HeatmapPayload } from '../types/heatmap';
import * as api from '../services/api';

type Phase = 'idle' | 'submitting' | 'waiting' | 'processing' | 'completed' | 'error' | 'timeout';

const POLL_INTERVAL_MS = Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 5000;
const POLL_TIMEOUT_MS = Number(import.meta.env.VITE_POLL_TIMEOUT_MS) || 300000;

function isTransientStatus(code?: number) {
  // FortyGuard status often returns gateway timeouts while still processing — keep polling.
  return (
    !code ||
    code === 408 ||
    code === 425 ||
    code === 429 ||
    code === 500 ||
    code === 502 ||
    code === 503 ||
    code === 504
  );
}

export default function useHeatmap() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [activityId, setActivityId] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pollingRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);
  const lastPayloadRef = useRef<HeatmapPayload | null>(null);
  const lastResponseRef = useRef<any>(null);

  function mapErrorCodeToMessage(code?: number, defaultMsg?: string) {
    if (!code) return defaultMsg ?? 'Analysis failed. Try again.';
    if (code === 400) return 'Please draw a valid area.';
    if (code === 401 || code === 403) return 'Analysis service unavailable.';
    if (code === 429) return 'Too many requests. Please try again.';
    if (code === 502 || code === 503 || code === 504) {
      return 'Temperature service is slow or timing out. Keep the area smaller (US only) and try again.';
    }
    if (code >= 500 && code < 600) return 'Analysis failed. Try again.';
    return defaultMsg ?? 'Analysis failed. Try again.';
  }

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    attemptsRef.current = 0;
  }

  function startPolling(id: string, intervalMs = 3000, maxDurationMs = 120000) {
    stopPolling();
    setPhase('processing');
    attemptsRef.current = 0;
    const maxAttempts = Math.ceil(maxDurationMs / intervalMs);

    return new Promise<any>((resolve, reject) => {
      async function check() {
        attemptsRef.current += 1;
        try {
          const res = await api.getStatus(id);
          // Debug: log raw response from status endpoint for troubleshooting
          try {
            console.debug('[useHeatmap] poll status response', { attempt: attemptsRef.current, httpStatus: res.status, data: res.data });
          } catch (e) {
            // ignore logging errors
          }
          lastResponseRef.current = res.data;
          const body = res?.data;
          // support multiple possible shapes from backend / FortyGuard
          const statusRaw =
            body?.status ??
            body?.activity_status ??
            body?.state ??
            body?.raw?.status ??
            (body?.data && (body.data.status ?? body.data.activity_status));
          const statusField = typeof statusRaw === 'string' ? statusRaw.toLowerCase() : statusRaw;
          const maybeData = body?.data ?? body;
          const featureCount = Array.isArray(maybeData?.geojson?.features)
            ? maybeData.geojson.features.length
            : 0;

          // Consider complete if backend signals completion explicitly, or if transformed data contains result/summary/hotspots/geojson tiles
          if (
            statusField === 'completed' ||
            statusField === 'done' ||
            statusField === 'success' ||
            maybeData?.result ||
            maybeData?.summary ||
            (Array.isArray(maybeData?.hotspots) && maybeData.hotspots.length > 0) ||
            featureCount > 0
          ) {
            stopPolling();
            // Empty completed heatmap (e.g. AOI outside US coverage) — surface a clear message
            if (
              (statusField === 'completed' || statusField === 'done' || statusField === 'success') &&
              !maybeData?.summary &&
              !(Array.isArray(maybeData?.hotspots) && maybeData.hotspots.length > 0) &&
              featureCount === 0
            ) {
              setResult(maybeData);
              setPhase('error');
              setErrorMessage(
                'Analysis completed but returned no temperature tiles. FortyGuard coverage is currently United States only — draw an AOI inside the US and try again.'
              );
              resolve({ status: 'completed_empty', data: maybeData });
              return;
            }
            setResult(maybeData);
            setPhase('completed');
            setErrorMessage(null);
            resolve({ status: 'completed', data: maybeData });
            return;
          }

          // Still processing
          if (statusField === 'processing' || statusField === 'in_progress' || res.status === 202) {
            setPhase('processing');
          }
        } catch (err) {
          const code = (err as any)?.response?.status;
          // Transient upstream timeouts/rate limits — keep polling
          if (isTransientStatus(code) || !code) {
            setPhase('processing');
            setErrorMessage(null);
          } else if (code >= 400 && code < 600) {
            // Permanent client/auth errors — stop
            stopPolling();
            setPhase('error');
            setErrorMessage(mapErrorCodeToMessage(code));
            reject(err);
            return;
          }
        }

        if (attemptsRef.current >= maxAttempts) {
          stopPolling();
          setPhase('timeout');
          const last = lastResponseRef.current;
          const lastSummary = last && (last.summary || (Array.isArray(last.hotspots) ? { hotspots: last.hotspots.length } : null));
          const message = `Polling timeout after ${attemptsRef.current} attempts (${Math.round((attemptsRef.current * intervalMs)/1000)}s). Last response snapshot: ${JSON.stringify(lastSummary ?? last ?? {}).slice(0,1000)}`;
          setErrorMessage(message);
          reject(new Error(message));
        }
      }

      // initial check immediately
      check();
      pollingRef.current = window.setInterval(check, intervalMs) as unknown as number;
    });
  }

  async function run(payload: HeatmapPayload) {
    lastPayloadRef.current = payload;
    setPhase('submitting');
    setResult(null);
    setActivityId(null);
    setErrorMessage(null);
    try {
      const res = await api.postHeatmap(payload);
      const id = res?.activityId ?? res?.activity_id ?? null;
      setActivityId(id);
      setPhase('waiting');
      if (!id) {
        setPhase('error');
        setErrorMessage('Analysis service unavailable.');
        throw new Error('No activityId returned');
      }
      // begin polling until completion
      const final = await startPolling(id, POLL_INTERVAL_MS, POLL_TIMEOUT_MS);
      return { activityId: id, result: final };
    } catch (err) {
      const code = (err as any)?.response?.status;
      // Don't wipe a more specific message already set by polling
      setPhase((prev) => (prev === 'completed' ? prev : 'error'));
      setErrorMessage((prev) => prev ?? mapErrorCodeToMessage(code));
      throw err;
    }
  }

  function retry() {
    if (!lastPayloadRef.current) return Promise.reject(new Error('No payload to retry'));
    return run(lastPayloadRef.current);
  }

  // cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, []);

  function reset() {
    stopPolling();
    setPhase('idle');
    setActivityId(null);
    setResult(null);
    setErrorMessage(null);
    lastPayloadRef.current = null;
  }

  return { phase, activityId, result, run, errorMessage, retry, stopPolling, reset };
}
