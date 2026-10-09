# Project Documentation

UmnyAut («Умняут») — a connected renovation calculator: enter room dimensions once, get a verified merged shopping list in packs, rolls and bags. This directory holds:

1. **Source specs** (`specs/`, Russian) — business, technical and design specifications, mockups, roadmap script. They are the source of truth; reference docs below are English digests of them.
2. **Reference documentation** — human- and AI-readable docs about this codebase, organized by category.
3. **Skill specifications** (`skills/`) — tool-agnostic blueprints that any AI agent can turn into a working skill for its own host (Claude Code, Codex, or a generic agent).
4. **Agent specifications** (`agents/`) — tool-agnostic blueprints that any developer can turn into a working AI subagent for its own host (a Claude Code subagent in `.claude/agents/`, a Codex custom agent in `.codex/agents/`, or a generic framework's agent).

> This README is also an instruction set for AI agents. If you are an agent reading this, the sections marked **For AI** below tell you what you are allowed and expected to do.

## Layout

| Path | What lives here |
|---|---|
| `specs/` | Source specs (RU), mockups HTML, roadmap script, Wordstat CSV |
| `details/` | Brand assets: logos, favicons, mascot poses and clips, concept references |
| `architecture/` | Project structure, module boundaries, routing, state |
| `design/` | Themes, CSS variables, design tokens, visual system |
| `ui/` | Component usage, template patterns, layout |
| `code/` | Calc engine, server API, data |
| `business/` | Domain logic, product rules, SEO and analytics |
| `deploy/` | Build, CI/CD, hosting, environments |
| `integrations/` | Telegram, AI vision |
| `practices/` | Conventions, testing, git workflow |
| `plan/` | Phased development plan, accounts registry, dependencies, content & assets plan |
| `skills/` | Skill specifications (blueprints for AI skills) |
| `agents/` | Agent specifications (blueprints for AI subagents) |

## Reference docs

| Doc | Version |
|---|---|
| [Architecture Overview](./architecture/overview.md) | 1.1 |
| [Product and Domain](./business/product-and-domain.md) | 2.0 |
| [Competitive Benchmark](./business/competitive-benchmark.md) | 1.0 |
| [SEO and Analytics](./business/seo-and-analytics.md) | 1.1 |
| [Calculation Engine](./code/calc-engine.md) | 1.0 |
| [Server API and Data](./code/server-api-and-data.md) | 1.0 |
| [Calculator Shell, Pages and Routing](./ui/calculator-shell-and-pages.md) | 1.0 |
| [Design System](./design/design-system.md) | 1.1 |
| [Telegram Bot and Mini App](./integrations/telegram-bot.md) | 1.0 |
| [AI Vision Features](./integrations/ai-vision.md) | 1.0 |
| [Environments and CI/CD](./deploy/environments-and-ci.md) | 1.3 |
| [Prod Server Runbook](./deploy/prod-server-runbook.md) | 1.0 |
| [Engineering Practices](./practices/engineering-practices.md) | 1.1 |
| [Development Plan](./plan/development-plan.md) | 2.2 |
| [Accounts and Services](./plan/accounts-and-services.md) | 1.0 |
| [Dependencies](./plan/dependencies.md) | 1.0 |
| [Content and Assets Plan](./plan/content-plan.md) | 1.2 |
| [Progress Log](./plan/progress-log.md) | 1.1 |

## Skill specifications

Each file in `skills/` is a **spec**: a versioned, host-neutral description of one skill — its purpose, triggers, workflow, and acceptance criteria. A spec is not a finished skill; it is the source of truth from which a real skill is built, adapted to whatever tool reads it.

### Current specs

<!-- AUTO: regenerate this table from docs/skills/*.md on every /docs run -->
| Spec | Version | Status | Built for |
|---|---|---|---|
| [New Calculator](./skills/new-calculator.md) | 1.0 | built | claude-code |
| [Calculator Release Check](./skills/calculator-release-check.md) | 1.0 | built | claude-code |
| [Tool Content](./skills/tool-content.md) | 1.0 | built | claude-code |
| [UI Component](./skills/ui-component.md) | 1.0 | built | claude-code |
| [DB Migration](./skills/db-migration.md) | 1.0 | built | claude-code |
| [Preflight](./skills/preflight.md) | 1.1 | built | claude-code |

## Agent specifications

Each file in `agents/` is an **agent spec**: a versioned, host-neutral description of one AI subagent — its purpose, when to delegate to it, system prompt, tools, model, and guardrails. A spec is not a finished agent; it is the source of truth from which a real agent is built, adapted to whatever host reads it.

### Current agents

<!-- AUTO: regenerate this table from docs/agents/*.md on every /docs run -->
| Spec | Version | Status | Built for |
|---|---|---|---|
| [Calc Engineer](./agents/calc-engineer.md) | 1.0 | built | claude-code |
| [Formula Reviewer](./agents/formula-reviewer.md) | 1.0 | built | claude-code |
| [Frontend Builder](./agents/frontend-builder.md) | 1.0 | built | claude-code |
| [SEO Content Writer](./agents/seo-content-writer.md) | 1.0 | built | claude-code |
| [Code Reviewer](./agents/code-reviewer.md) | 1.0 | built | claude-code |
| [Platform Engineer](./agents/platform-engineer.md) | 1.0 | built | claude-code |

## For AI: materializing a skill from a spec

When asked to build/create/update skills (e.g. "обнови скилы", "set up the skills", or during `/init`):

1. Read each spec in `skills/`.
2. Choose the adaptation section matching your host: §9.1 Claude Code, §9.2 Codex / AGENTS.md, or §9.3 Universal if your host isn't listed.
3. Build the skill in your host's native format:
   - **Claude Code** → create `.claude/skills/<slug>/SKILL.md` (project-level by default) with `name` + a `description` that encodes the spec's §2 triggers; add `scripts/`, `references/`, `assets/` from §6.
   - **Codex** → add the capability to `AGENTS.md` (or the spec's named instruction file) in Codex's instruction style.
   - **Other** → follow §9.3 Universal.
4. Verify the build against the spec's §8 Acceptance criteria.
5. Update the spec's **Materialization log** row (tool, location, built-from spec version, date) and set the spec `status` to `built`.

Always confirm with the user before creating or overwriting skill files.

## For AI: materializing an agent from a spec

When asked to build/create/update agents (e.g. "обнови агентов", "set up the agents", "build the frontend agent", or during `/init`):

1. Read each spec in `agents/`.
2. Choose the adaptation section matching your host: §12.1 Claude Code, §12.2 Codex, or §12.3 Universal if your host isn't listed.
3. Build the agent in your host's native format:
   - **Claude Code** → create `.claude/agents/<slug>.md` (project-level by default; `~/.claude/agents/` for a personal agent) with YAML frontmatter (`name`, a `description` that encodes the spec's §2 delegation triggers, plus `tools`/`model`/`permissionMode` from §5/§6/§9) and a Markdown body = the §4 system prompt + §7 procedure + §8 output contract.
   - **Codex** → create `.codex/agents/<slug>.toml` (project-level by default; `~/.codex/agents/` for personal) with `name`, `description`, `developer_instructions` (§4 + §7 + §8), and `model`/`model_reasoning_effort`/`sandbox_mode`/`[mcp_servers.*]` from §6/§9.
   - **Other** → follow §12.3 Universal.
4. Verify the build against the spec's §11 Acceptance criteria.
5. Update the spec's **Materialization log** row (tool, location, built-from spec version, date) and set the spec `status` to `built`.

Always confirm with the user before creating or overwriting agent files.

## For AI: /init behavior

If `skills/` contains specs but the corresponding skills are not built for this host (no matching entry in a spec's Materialization log, or the host's target file is missing), tell the user these specs exist and offer to materialize them. Do the same for any specs in `agents/`. Build only after confirmation.

## For AI: "update skills" / "update agents" behavior

For each spec in `skills/` (on "update skills") or `agents/` (on "update agents"), compare its `spec_version` against the version recorded in the Materialization log for your host:

- Recorded version **older** than `spec_version` → the built skill/agent is stale; rebuild it and update the log.
- **No** recorded row for your host → not built here; offer to build it.
- Versions **match** → up to date; skip.

Report what is stale, what is current, and what is missing before changing anything.
