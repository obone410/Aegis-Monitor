import type { NextRequest } from "next/server";
import { authorizeRequest } from "@/server/auth";
import { MonitoringService } from "@/server/services/monitoring-service";
import { createTraceId } from "@/server/trace";
import type { EnvironmentName } from "@/types/monitoring";

export const dynamic = "force-dynamic";

const isEnvironmentName = (value: string | null): value is EnvironmentName =>
  value === "production" || value === "preview" || value === "staging";

export async function GET(request: NextRequest) {
  const auth = authorizeRequest(request);

  if (!auth.allowed) {
    return new Response("Unauthorized", { status: 401 });
  }

  const requestedEnvironment = request.nextUrl.searchParams.get("environment");
  const environment = isEnvironmentName(requestedEnvironment) ? requestedEnvironment : "production";
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = async () => {
        if (closed) {
          return;
        }

        const service = MonitoringService.fromEnv();
        const { snapshot } = await service.getSnapshot({
          traceId: request.headers.get("x-request-id") ?? createTraceId("stream"),
          environment,
          bypassCache: true
        });

        controller.enqueue(
          encoder.encode(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`)
        );
      };

      void send();
      const interval = setInterval(() => {
        void send();
      }, 7000);

      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
