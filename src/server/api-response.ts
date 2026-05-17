import { NextResponse } from "next/server";
import type { ApiErrorPayload, ApiMeta, ApiResponse } from "@/types/monitoring";

export function createApiMeta(meta: Partial<ApiMeta> & Pick<ApiMeta, "traceId">): ApiMeta {
  return {
    generatedAt: new Date().toISOString(),
    cache: "bypass",
    role: "viewer",
    ...meta
  };
}

export function ok<T>(data: T, meta: ApiMeta, init?: ResponseInit) {
  const body: ApiResponse<T> = {
    ok: true,
    data,
    meta
  };

  return NextResponse.json(body, {
    ...init,
    headers: {
      "x-trace-id": meta.traceId,
      ...(init?.headers ?? {})
    }
  });
}

export function fail(error: ApiErrorPayload, meta: ApiMeta, init?: ResponseInit) {
  const body: ApiResponse<never> = {
    ok: false,
    error,
    meta
  };

  return NextResponse.json(body, {
    status: init?.status ?? 500,
    ...init,
    headers: {
      "x-trace-id": meta.traceId,
      ...(init?.headers ?? {})
    }
  });
}
