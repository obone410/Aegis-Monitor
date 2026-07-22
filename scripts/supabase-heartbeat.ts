import { sendSupabaseTelemetryHeartbeat } from "../src/server/services/supabase-heartbeat.ts";

const result = await sendSupabaseTelemetryHeartbeat({
  supabaseUrl: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  source: process.env.GITHUB_ACTIONS ? "github-actions" : "manual"
});

console.log(`Supabase telemetry heartbeat complete at ${result.writtenAt}.`);
