# customization/resources

Files a fork ships with its build, plus its notes for coding agents. The rules for forks and the full list of customization seams are in the NEO root [`AGENTS.md`](../../../../AGENTS.md#forks-and-the-customization-layer).

| Path | Used for |
|---|---|
| `web/` | Flat files copied into `apps/next/public/static/` whenever the Next config loads, served as `/static/<name>`: `favicon.svg`, `manifest.json` and every icon the manifest names. Subfolders aren't copied, and the copy never deletes stale files. The folder is optional. |
| `native/` | App icon, splash and other native assets. Nothing reads this folder on its own; reference the files from `config/app.config.js` as `../../packages/app/customization/resources/native/<file>`. |
| `sounds/` | Default notification and UI sounds, used through `customization/sounds.js`. |
| `agents.md` | The fork's notes for every coding agent. |
| `claude.md` | The fork's notes for Claude Code only. |

Upstream NEO (`neo/` in [unacms/UNA](https://github.com/unacms/UNA)) keeps `agents.md` and `claude.md` as templates and changes nothing below their "Per-project additions" line, so a fork's notes there survive every sync.
