---
name: api-health
description: Check availability and response times of the external crossword API
user_invocable: true
---

# /api-health

Check the health and response times of the external CrossQuest Python API on Railway.

## Instructions

Run health checks against both API endpoints and report results.

### Check 1: Categories Endpoint

```bash
curl -s -o /dev/null -w "HTTP %{http_code} in %{time_total}s" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"guessed_words":{}}' \
  https://cross-questpython-production.up.railway.app/api/categories
```

### Check 2: Full Categories Response

```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"guessed_words":{}}' \
  https://cross-questpython-production.up.railway.app/api/categories
```

## Output Format

```
API Health Check
────────────────────────────────────
 Endpoint       Status    Time
────────────────────────────────────
 /categories    200 OK    1.23s
────────────────────────────────────
```

### Interpret Results

- **Response time > 5s**: Likely a cold start. Note: "Railway cold start detected. First request is slow, subsequent requests will be faster."
- **Response time > 15s**: Server might be sleeping. Note: "Server appears to be waking from sleep. This is normal for Railway free/hobby tier."
- **Response time < 2s**: Server is warm. Note: "API is responsive."
- **HTTP 5xx**: Server error. Note: "Backend may be down or misconfigured."
- **Timeout (no response in 30s)**: Note: "API unreachable. Check Railway deployment status."

Also report:

- Number of categories returned (from the JSON response)
- Whether the response format is valid (`{ categories: [...] }`)

## Notes

- The API is hosted on Railway and may have cold starts (15-30 seconds)
- Do NOT test the `/crossword` endpoint in health check — it triggers expensive generation
- The `/categories` endpoint is safe to call repeatedly
