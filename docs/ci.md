# CI rulebook

How UNA's CI decides what to run and deploy, and the rules that keep it fast without letting it lie. The workflows are `.github/workflows/ci.yml` (tests and deploys) and `.github/workflows/preview.yml` (PR previews).

## What runs on a PR

The first job, **What changed**, reads the PR's diff and decides the rest. A job with nothing to do is skipped.

| You changed | PHPUnit | NEO lint and typecheck | Preview deploy (with the `preview` label) |
| --- | --- | --- | --- |
| Only files under `neo/` | No | Yes | NEO only |
| Anything outside `neo/` | Yes | No | UNA only |
| Both | Yes | Yes | Both |
| `neo/desktop/una-api/openapi.json` | Yes (`ApiV2SpecFileTest` compares it with the PHP code) | Yes | Both |
| `.github/workflows/ci.yml`, `preview.yml`, `.github/actions/`, `.github/scripts/` | Yes | Yes | Both |

The `Database migrations` and `Desktop app` workflows have their own rules and are unchanged.

## What runs on master

Every push to master runs the whole PHPUnit suite, on PHP 8.3 and 8.5, whatever it changed. It then deploys to production only the half that changed: UNA to api.unacms.app when something outside `neo/` changed, the NEO web client when `neo/` or `scripts/railway/neo*` changed.

## Previews

- A PR gets a Railway preview only when it has the **`preview`** label. Adding the label starts a full CI run that tests the PR and deploys both UNA and NEO into the environment `pr-<number>`. The PR comment lists the URLs. A fresh UNA install takes about 10 minutes.
- After that, each push redeploys only the half it changed.
- Removing the label, or closing the PR, deletes the environment. A CI run in progress is cancelled with it; when that happens, the checks run again for the same commit without a deploy.
- `[no deploy]` in the title also keeps the label from deploying.
- Forks and Dependabot PRs never get previews, because they have no access to secrets.

## Skipping deploys

- Put **`[no deploy]`** in the PR title or in the commit message (any letter case). Tests still run; no preview or production deploy happens. A squash merge carries the PR title into the commit on master, so one marker covers both.
- Don't use `[skip ci]`. It skips the tests too.
- To deploy master by hand, open UNA CI under Actions, press **Run workflow** on `master`, and leave the PR field empty. Both halves deploy.

## How the tests run

- PHPUnit runs in four legs: two per PHP version, each with its own database. The leg named **Unit tests (PHP x)** runs Units and half of Integration. **Integration tests (PHP x)** runs the other half. Those four names are the required checks in the master ruleset.
- `.github/scripts/phpunit-shard.php` splits Integration by the seconds each file took on the last master run, so the halves finish together. A new file counts as the median until master has timed it.
- The **Tests** job fails when any leg failed, or when the legs together did not run every Integration file exactly once.
- Dependencies and built assets (`plugins/`, `plugins_public/`, the messenger build) are cached. The key covers everything `composer install` and `yarn install` read: the lockfiles, `patches/`, `scripts/`, `src/`, the build configs, and every template and script Tailwind scans for class names (see `tailwind.config.js`). The cache also refreshes every month. A run whose key changed installs them once, in **Install dependencies**. When the yarn build starts reading a new place, add it to `inputs` in **What changed**.
- NEO lint caches `node_modules` (keyed on the `package.json` files and `neo/patches/`) and the base branch's results (keyed on the base commit), so a PR lints only itself.
- JUnit reports from every leg are kept for 7 days as artifacts named `junit-php<version>-shard<n>`.

## Rules

1. **Never hide a failure.** No retries, longer timeouts or skipped tests to get a green run. A check that passes only on a rerun has a bug: find it. The one retry left is NEO's `yarn install` against the npm registry's occasional 502, which no code change can fix.
2. **Never check less.** Required checks and lint rules only stay or grow. Path rules narrow what a PR runs, never what master runs.
3. **Everything that can reach a file is listed.** A job whose inputs change must rerun. When a test or build starts reading a new place, such as a new directory the yarn build reads, add it to the rules in **What changed** or to the cache key.
4. **No new required check without a job that always reports.** A required check whose job is skipped by `if:` never reports, so the PR waits forever. Skip the steps inside the job instead, as the test legs do.
5. **A skipped run must not look like a pass.** Don't add label or comment triggers to `ci.yml`; a run for some other label would report the required checks as skipped. Put them in their own workflow, as `preview.yml` does.
6. **Measure before and after.** A CI change says in its PR what it saved, in numbers from real runs.
7. **Keep previews rare.** Add the `preview` label only when someone will open the preview, and remove it when they're done.
