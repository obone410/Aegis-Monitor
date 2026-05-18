import { z } from "zod";

const booleanString = z
  .enum(["true", "false"])
  .optional()
  .transform((value) => value === "true");

const envSchema = z.object({
  APP_NAME: z.string().min(1).default("Aegis-Monitor"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  VERCEL_API_TOKEN: z.string().min(1).optional(),
  VERCEL_PROJECT_ID: z.string().min(1).optional(),
  VERCEL_TEAM_ID: z.string().min(1).optional(),
  SUPABASE_URL: z.url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  MONITORING_API_KEY: z.string().min(12).optional(),
  MONITORING_REQUIRE_API_KEY: booleanString,
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional()
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}

export function getEnvIssues() {
  const result = envSchema.safeParse(process.env);
  return result.success ? [] : result.error.issues;
}
