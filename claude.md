# Claude (and Claude Code) — NEO monorepo

**Primary instructions:** Read [agents.md](agents.md). It is the canonical guide for this repo (structure, Next/Expo, UNA CMS, styling, checklists).

**Installed agent skills:** Per [Vercel Agent Skills](https://vercel.com/docs/agent-resources/skills), the canonical copy is [`.agents/skills/`](.agents/skills/); [`.claude/skills/`](.claude/skills/) contains symlinks into it. Root [`skills-lock.json`](skills-lock.json) records installed versions/hashes. Installed packages include Vercel `agent-skills` (e.g. `vercel-react-best-practices`, `vercel-composition-patterns`, `vercel-react-native-skills`, `web-design-guidelines`, `deploy-to-vercel`), `next-skills` (`next-best-practices`, `next-cache-components`, `next-upgrade`), `vercel/turborepo`, `vercel-labs/agent-browser` (see also bundled skills in that repo), and `expo/skills` `building-native-ui`. CLI install ids may differ from short GitHub folder names—use `npx skills add <owner/repo>` and follow the CLI’s skill list if needed.

**Precedence:** NEO-specific rules in [agents.md](agents.md) and [.cursorrules](.cursorrules) override generic React/Next guidance when they conflict—especially UNA [`fetcher`](packages/app/lib/fetcher.js), API shape, guest-safe blocks ([docs/una-api-best-practices.md](docs/una-api-best-practices.md)), cross-platform code in `packages/app`, and design tokens.

**Multi-agent:** These skills are also wired for Cursor, Codex, Copilot, and others; see [skills.sh](https://skills.sh) for discovery.

**Customization / forks:** Per-project agent notes belong in [`packages/app/customization/resources/claude.md`](packages/app/customization/resources/claude.md) and [`packages/app/customization/resources/agents.md`](packages/app/customization/resources/agents.md) so branch projects avoid editing root docs—see [`packages/app/customization/resources/README.md`](packages/app/customization/resources/README.md).
