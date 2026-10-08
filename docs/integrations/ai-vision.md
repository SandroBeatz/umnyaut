---
version: 1.0
date: 2026-10-08
category: integrations
---

# AI Vision Features

> Version 1.0 · 2026-10-08 · [Integrations](../integrations/)

## Overview

AI is called **only from the server** and **only to turn a photo or text into form parameters**. The person confirms the values; then the normal deterministic formula runs. The form always works without AI.

| Feature | What it does | Stage |
|---|---|---|
| Label photo | Reads roll size, repeat, pack area, mix consumption from packaging | 3 |
| Apartment plan photo | Detects rooms and dimensions from a developer plan / tech passport | 3 |
| Description by words/voice | “Комната 4,6 на 4,3, потолки 2,7, одно окно…” → filled planner | 3 |
| Contractor estimate check | Photo/PDF estimate → lines; code compares volumes (not prices) | 4 |
| Finish visualization | Experiment after month 6; not designed yet (different provider) | 4 |

> Status: planned. Source: technical spec §13, business spec §9.

## Architecture

### Pipeline (same for all features)

1. **Browser** downscales the photo to 1280 px long side and re-encodes to JPEG (cheaper, strips geotags/EXIF).
2. **Server** checks the device daily limit and monthly budget in `ai_usage`.
3. **Provider** gets the image, a short instruction, and a response schema. The instruction demands only what is printed and `null` for anything not visible.
4. **Server** validates the response with Zod, records cost, returns fields with confidence flags.
5. **Browser** shows a confirmation screen (mint fields marked “проверьте”; low confidence → orange border). The person edits and confirms.

Photos are never stored or logged — they live in the memory of one request.

```ts
interface VisionProvider {
  extract<T>(request: {
    images: Uint8Array[];
    instruction: string;
    schema: z.ZodType<T>;
    tier: 'fast' | 'accurate';
  }): Promise<{ data: T; usage: { inputTokens: number; outputTokens: number; costMicroUsd: number } }>;
}
```

The provider is swappable without touching features. Default implementation: Anthropic API.

### Models and cost (estimates from the spec)

| Feature | Tier | In tokens | Out tokens | ≈ Cost | Free per day |
|---|---|---|---|---|---|
| Label photo | fast | ≈ 2,500 | ≈ 300 | ≈ $0.004 | 5 |
| Description | fast | ≈ 700 | ≈ 300 | ≈ $0.002 | 10 |
| Plan photo | accurate | ≈ 4,000 | ≈ 800 | ≈ $0.016 | 2 |
| Estimate check (≤ 5 pages) | accurate | ≈ 12,000 | ≈ 2,500 | ≈ $0.05 | 1, then paid pack |

The technical spec names “Claude Haiku 4.5” for the fast tier and “Claude Sonnet 5.5” for the accurate tier. **Verify model IDs before implementation** — current IDs are `claude-haiku-4-5-20251001` (fast) and `claude-sonnet-5` / `claude-opus-5-5` (accurate); “Sonnet 5.5” does not appear in the current model list. Pick the cheapest model that passes the quality gate below.

### Budget protection

| Mechanism | How |
|---|---|
| Daily limit | Counter per device id (localStorage); in Telegram per user |
| Second circuit | Daily cap per IP so clearing storage does not reset the limit |
| Monthly budget | Sum of `cost_microusd`; when exceeded, AI buttons hide until next month |
| Kill switch | `AI_ENABLED=false` disables all features without a deploy |
| Timeout | 20 s per request, one retry; on failure the plain form is shown |

### Security

- Accept JPEG/PNG/WebP by file signature only, ≤ 4 MB.
- Prompt-injection inside photos/estimates: output constrained by schema, numbers checked against bounds, response text never executed or rendered as HTML.

### Quality gate before release

- Test set: 30 real label photos + 10 plans, hand-labelled.
- Threshold: ≥ 90% label fields correct; a wrong field with high confidence is a blocker.
- Compare fast vs accurate tiers on the set; ship the cheapest that passes.
- In production: ratio `ai_corrected / ai_used` per feature.

## Configuration

`ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL` (proxy fallback if the VPS country can't reach the API), `AI_ENABLED`, `AI_MONTHLY_BUDGET_USD` (business ceiling 1–3k ₽/month). Non-prod environments get a small separate budget.

## Usage

`POST /api/ai/label` with a downscaled JPEG → `{ ok: true, data: { rollWidthMm: 1060, rollLengthM: 10, repeatCm: 64, confidence: {...} } }` → confirmation screen → values applied to the wallpaper form. Mascot pose `think` with “Читаю этикетку” and a “Ввести вручную” button while waiting (≤ 20 s).

## Cross-references

- [Server API and Data](../code/server-api-and-data.md) — `ai_usage` table, `/api/ai/*` routes
- [Telegram Bot](../integrations/telegram-bot.md) — photo intake from chat
- [Product and Domain](../business/product-and-domain.md) — the “AI never computes” rule
- [Design System](../design/design-system.md) — recognition states

## File Structure

| Path | Description |
|---|---|
| `apps/web/server/ai/provider.ts` | `VisionProvider` interface |
| `apps/web/server/ai/anthropic.ts` | Anthropic implementation |
| `apps/web/server/ai/features/{label,plan,describe}.ts` | Instruction + schema per feature |
| `apps/web/app/api/ai/*/route.ts` | Route handlers |
| `apps/web/src/features/scan-label/` | Camera button, confirmation screen |
