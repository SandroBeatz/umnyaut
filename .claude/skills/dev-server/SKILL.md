---
name: dev-server
description: Manage Next.js development server (start, stop, status check on port 3000)
user_invocable: true
---

# /dev-server [start|stop|status]

Manage the Next.js development server on port 3000.

## Arguments

- `start` (default) — Start the dev server if not already running
- `stop` — Stop the running dev server
- `status` — Check if the server is running

## Instructions

### For `status` or no argument default check:

1. Run `lsof -ti:3000` to check if anything is listening on port 3000
2. If a PID is found, report: "Dev server is running (PID: <pid>)"
3. If no PID, report: "Dev server is not running"

### For `start`:

1. First check if port 3000 is already in use with `lsof -ti:3000`
2. If already running, report it and do nothing
3. If not running, start the server with `npm run dev` in the background
4. Wait a few seconds, then verify it started by checking port 3000 again
5. Report the result

### For `stop`:

1. Find the PID with `lsof -ti:3000`
2. If found, kill it with `kill <pid>`
3. Verify it stopped
4. If no server is running, report "No dev server to stop"

## Notes

- The dev server runs on port 3000 by default
- Use `npm run dev` to start (runs `next dev`)
- The server should be started in the background so it doesn't block the terminal
