import "server-only";
import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("applies defaults for an empty environment", () => {
    const env = parseEnv({});
    expect(env.APP_ENV).toBe("local");
    expect(env.AI_ENABLED).toBe(false);
    expect(env.AI_MONTHLY_BUDGET_USD).toBe(0);
  });

  it("parses flags and numbers from strings", () => {
    const env = parseEnv({
      APP_ENV: "production",
      AI_ENABLED: "1",
      ANTHROPIC_API_KEY: "k",
      AI_MONTHLY_BUDGET_USD: "20",
    });
    expect(env.AI_ENABLED).toBe(true);
    expect(env.AI_MONTHLY_BUDGET_USD).toBe(20);
  });

  it("fails fast on an unknown APP_ENV", () => {
    expect(() => parseEnv({ APP_ENV: "prod" })).toThrow(/APP_ENV/);
  });

  it("requires an API key when AI is enabled", () => {
    expect(() => parseEnv({ AI_ENABLED: "true" })).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("treats empty values as unset", () => {
    expect(parseEnv({ SUPABASE_URL: "", APP_ENV: "" }).APP_ENV).toBe("local");
  });

  it("rejects malformed URLs", () => {
    expect(() => parseEnv({ SUPABASE_URL: "not a url" })).toThrow(/SUPABASE_URL/);
  });
});
