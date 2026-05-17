"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildDemoSnapshot } from "@/lib/monitoring/mock-data";
import type { ApiMeta, ApiResponse, EnvironmentName, MonitoringSnapshot } from "@/types/monitoring";

type UseMonitoringSnapshotOptions = {
  environment: EnvironmentName;
  live: boolean;
};

type SnapshotState = {
  snapshot: MonitoringSnapshot;
  meta: ApiMeta | null;
  error: string | null;
  isRefreshing: boolean;
};

const retryDelays = [350, 900, 1600];

async function fetchSnapshot(environment: EnvironmentName, attempt = 0): Promise<ApiResponse<MonitoringSnapshot>> {
  const response = await fetch(`/api/monitoring?environment=${environment}`, {
    cache: "no-store",
    headers: {
      "x-ops-role": "responder"
    }
  });
  const body = (await response.json()) as ApiResponse<MonitoringSnapshot>;

  if (!response.ok || !body.ok) {
    if (attempt < retryDelays.length) {
      await new Promise((resolve) => window.setTimeout(resolve, retryDelays[attempt]));
      return fetchSnapshot(environment, attempt + 1);
    }
  }

  return body;
}

export function useMonitoringSnapshot({ environment, live }: UseMonitoringSnapshotOptions) {
  const [state, setState] = useState<SnapshotState>(() => ({
    snapshot: {
      ...buildDemoSnapshot(),
      environment
    },
    meta: null,
    error: null,
    isRefreshing: false
  }));
  const eventSourceRef = useRef<EventSource | null>(null);

  const refresh = useCallback(async () => {
    setState((current) => ({
      ...current,
      isRefreshing: true,
      error: null
    }));

    try {
      const body = await fetchSnapshot(environment);

      if (body.ok) {
        setState({
          snapshot: body.data,
          meta: body.meta,
          error: null,
          isRefreshing: false
        });
        return;
      }

      setState((current) => ({
        ...current,
        meta: body.meta,
        error: body.error.message,
        isRefreshing: false
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "Unable to refresh monitoring data",
        isRefreshing: false
      }));
    }
  }, [environment]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => {
      window.clearTimeout(initialRefresh);
    };
  }, [refresh]);

  useEffect(() => {
    if (!live) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      const interval = window.setInterval(() => {
        void refresh();
      }, 7000);

      return () => window.clearInterval(interval);
    }

    const source = new EventSource("/api/monitoring/stream");
    eventSourceRef.current = source;

    source.addEventListener("snapshot", (event) => {
      const snapshot = JSON.parse((event as MessageEvent).data) as MonitoringSnapshot;
      setState((current) => ({
        ...current,
        snapshot,
        error: null,
        isRefreshing: false
      }));
    });

    source.onerror = () => {
      source.close();
      eventSourceRef.current = null;
      void refresh();
    };

    return () => {
      source.close();
      eventSourceRef.current = null;
    };
  }, [live, refresh]);

  return {
    ...state,
    refresh
  };
}
