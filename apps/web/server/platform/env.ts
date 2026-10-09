import "server-only";
import { z } from "zod";

const flag = z
  .enum(["true", "false", "1", "0"])
  .default("false")
  .transform((value) => value === "true" || value === "1");

const optionalString = z.string().trim().min(1).optional();
const optionalUrl = z.url().optional();

export const envSchema = z
  .object({
    APP_ENV: z.enum(["local", "preview", "staging", "production"]).default("local"),
    SUPABASE_URL: optionalUrl,
    SUPABASE_SECRET_KEY: optionalString,
    TELEGRAM_BOT_TOKEN: optionalString,
    TELEGRAM_WEBHOOK_SECRET: optionalString,
    TELEGRAM_API_ROOT: optionalUrl,
    GEMINI_API_KEY: optionalString,
    GEMINI_BASE_URL: optionalUrl,
    AI_ENABLED: flag,
    AI_MONTHLY_BUDGET_USD: z.coerce.number().nonnegative().default(0),
    METRIKA_ID: optionalString,
    INDEXNOW_KEY: optionalString,
  })
  .superRefine((env, ctx) => {
    if (env.AI_ENABLED && !env.GEMINI_API_KEY) {
      ctx.addIssue({ code: "custom", path: ["GEMINI_API_KEY"], message: "required when AI_ENABLED" });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  // `KEY=` in an env file means "not set".
  const defined = Object.fromEntries(Object.entries(source).filter(([, value]) => value !== ""));
  const result = envSchema.safeParse(defined);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

let cached: Env | undefined;

/** Validated environment; throws on the first call if anything is invalid. */
export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}

export function isProduction(): boolean {
  return getEnv().APP_ENV === "production";
}
