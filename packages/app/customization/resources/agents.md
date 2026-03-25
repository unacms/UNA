# Agent instructions — customization layer

This file is part of [`packages/app/customization/`](..). Use it to **add** project-specific guidance for AI agents **without** forking the main monorepo [`agents.md`](../../../../agents.md).

## Canonical reference (read first)

- **Full NEO monorepo instructions:** [`agents.md` at repository root](../../../../agents.md)
- **Claude entry point:** [`claude.md` at repository root](../../../../claude.md)
- **Installed Vercel/agent skills:** [`.agents/skills/`](../../../../.agents/skills/) — see root `agents.md` for the skill table, CLI ids, and [skill precedence](../../../../agents.md#skill-precedence-neo-vs-generic-guidance)

## Upstream vs derivative projects

- **Upstream:** Keep this file short; avoid duplicating root content.
- **Branches / forks:** Edit **this file** (and other files under `packages/app/customization/` only) to record client-specific UNA endpoints, modules, branding, deployment, or team rules—so merges from upstream do not conflict with local agent docs at the repo root.

---

## Per-project additions

_Add content below this line. Examples: customer UNA URL patterns, feature flags, module-specific API notes, or conventions that do not belong in the shared root doc._
