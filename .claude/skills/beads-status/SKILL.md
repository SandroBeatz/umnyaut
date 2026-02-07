---
name: beads-status
description: Quick access to beads (bd) issue tracking commands
user_invocable: true
---

# /beads-status [list|ready|show <id>]

Quick wrapper for common `bd` (beads) issue tracking commands.

## Arguments

- `list` (default) — Show all open issues
- `ready` — Show issues ready to work on (no blockers)
- `show <id>` — Show details of a specific issue
- `stats` — Show project statistics

## Instructions

### For `list` (or no argument):

```bash
bd list --status=open
```

Show all open issues with their IDs, titles, priorities, and statuses.

### For `ready`:

```bash
bd ready
```

Show issues that are ready to work on (open status, no blocking dependencies). These are the issues an agent can pick up immediately.

### For `show <id>`:

```bash
bd show <id>
```

Show full details of a specific issue including description, dependencies, and history.

### For `stats`:

```bash
bd stats
```

Show project statistics: open/closed/blocked counts, priority distribution.

## Output

Present the results in a clean, readable format. For `list` and `ready`, summarize:

- Issue ID
- Title
- Priority (P0-P4)
- Status
- Any blocking dependencies

## Notes

- Beads data is stored in `.beads/` directory
- Issues use the prefix from project initialization
- Run `bd sync` to sync with git remote
- See CLAUDE.md for full bd command reference
