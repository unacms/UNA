# Agent documentation — customization layer

This folder holds **per-project agent instructions** that **reference** the repo-root [`agents.md`](../../../../agents.md) and [`claude.md`](../../../../claude.md) and **extend** them with fork- or client-specific knowledge.

## Workflow

| Repo | What to change |
|------|----------------|
| **Upstream NEO (this monorepo)** | Keep [`agents.md`](../../../../agents.md) and [`claude.md`](../../../../claude.md) as the shared source of truth. Leave the files in **this folder** minimal so they rarely conflict on merge. |
| **Branch / fork / customer projects** | Prefer **only** editing files under [`packages/app/customization/`](..)—including [`agents.md`](agents.md) and [`claude.md`](claude.md) here—to add deployment URLs, UNA module notes, team conventions, or extra skills notes without touching root docs or default app code. |

Root docs describe skills ([`.agents/skills/`](../../../../.agents/skills/)), UNA integration, and precedence—including the **[`una-api`](../../../../.agents/skills/una-api/SKILL.md)** skill for backend/API contracts. This folder is the safe place to stack **additional** rules for a derivative build.
