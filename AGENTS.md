# Notes for coding agents

# Project Structure

This repository contains the UNA PHP application and the NEO frontend monorepo as `neo/` subfolder.

## Repository layout

```text
/
├── ...                    # UNA PHP application
├── tests/                 # UNA PHP unit and integration tests
├── modules/               # UNA modules
├── tools/                 # Agent MCP tools (see tools/AGENTS.md)
├── ...
└── neo/                   # NEO frontend monorepo
    ├── apps/
    │   ├── expo/          # Expo / React Native mobile application
    │   └── next/          # Next.js web frontend
    ├── packages/          # Shared frontend packages
    ├── package.json
    └── ...
```

## UNA coding restrictions

These apply to UNA PHP (`inc/`, `modules/`, `studio/`, `template/`, and install or update SQL). They do not apply to `neo/`.

- Text may contain multibyte characters. Do not use byte-oriented functions (`strlen`, `substr`, `strpos`, `strrpos`, `strtolower`, `strtoupper`, `substr_replace`) on it. Use `get_mb_len`, `get_mb_substr`, `get_mb_replace`, `bx_mb_strpos`, and `bx_mb_substr_replace` from `inc/utils.inc.php`.
- Do not migrate the database from PHP. No `CREATE`, `ALTER`, or other schema change that runs when a page or service loads.
- SQL belongs in a `*Db` or `*Query` class. Do not put queries in a module, template, form, page, grid or other classes.
- HTML belongs in a template `*.html` file and is rendered with `parseHtmlByName`. Do not build markup as strings in PHP.
- No Cyrillic characters in code, comments, or SQL. User-facing text is a language key. Errors and logs without translations is acceptable.
- Common system classes (`BxDol*`, `BxBase*`, `BxTempl*`) are autoloaded. Do not guard them with `class_exists`, `bx_import`, or `require`. Custom modules classes need to be explicitly loaded with `bx_import`.
- Do not hardcode a list of module names. Read installed modules from `BxDolModuleQuery`.
- Do not call module by a literal name (`BxDolModule::getInstance('bx_posts')`, `BxDolService::call('bx_posts', ...)`, `new BxPostsModule`) without checking if module is installed `BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts')`.
- Call `getParam` only with a name that exists in `sys_options`. Declare the option in that module's install SQL before reading it.
- Do not add or edit anything under `upgrade/files/`. That folder records past releases. Do not put new migrations there.
- A change to install SQL also needs a migration for sites that are already installed. See "Database migrations" below.
- Set `active_api` in `modules/system/install/sql/enable-app-pages.sql` (page blocks, including their `config_api`) and `modules/system/install/sql/enable-app-menus.sql` (menu items) for core, for modules use `modules/boonex/*/install/sql/enable-app.sql` files. Do not set it in `install.sql`, `enable.sql`, or other common install and enable scripts.

## Studio app icons

Before adding or changing a launcher tile (`studio/template/images/icons/wi-*.svg`, `modules/**/template/images/icons/std-icon.svg`), read [`.agents/skills/studio-icons/SKILL.md`](.agents/skills/studio-icons/SKILL.md).

## Tests

Run UNA PHPUnit inside the `php` service from `docker compose`. That container is on the `unanet` network and reaches MariaDB at the host name stored in the installed site (`mysql`). PHPUnit is `plugins/bin/phpunit` after `composer install` (dev dependencies included). The site must already be installed (`inc/header.inc.php` present). Start the stack with `docker compose up -d` first.

From the repository root:

Unit tests:

```bash
docker compose exec -w /opt/una php ./plugins/bin/phpunit -c tests/phpunit.xml --testsuite Units
```

Integration tests:

```bash
docker compose exec -w /opt/una php ./plugins/bin/phpunit -c tests/phpunit.xml --testsuite Integration
```

One test class or method (`--filter` matches the class or method name):

```bash
docker compose exec -w /opt/una php ./plugins/bin/phpunit -c tests/phpunit.xml --filter TestName
```

Integration tests read `tests/.env` when that file exists (`cp tests/.env.example tests/.env`). Otherwise they use the installer defaults. A case skips an account that is not installed. JUnit output is written to `logs/junit.xml`.

## UNA pull requests

These apply to changes in UNA PHP (`inc/`, `modules/`, `studio/`, `template/`, `tests/`, and install or update SQL). They do not apply to a PR that only changes `neo/`.

Before opening the pull request:

- Add unit and/or integration tests for new functionality.
- Run the affected test suites. The run must finish with no failed tests. A skipped case is acceptable only when the suite skips it because the account or module is not installed.
- Review the change for security issues (injection, missing auth or permission checks, unsafe file or path handling, secrets in code or logs, and similar).
- Review the change for performance issues and bottlenecks (queries in loops, unbounded result sets, repeated work per request, and similar).
- When the change includes a database migration, run it on your local site and run `--filter RailwayMigrationsDbTest` (see "Database migrations") before opening the pull request.

The pull request description must include the database migration SQL when the change has one. When it has none, say that there is no database migration.

## Database migrations

The installer runs install SQL once, on an empty database, and api.unacms.app is deployed from every master commit without reinstalling, so a change to install SQL never reaches it by itself. A PR that changes what an installed site has in its database adds a migration to [`scripts/railway/migrations/`](scripts/railway/migrations/README.md). The Railway image runs each one once per database on start, records it in `sys_deploy_migrations`, then clears caches and bumps `sys_revision`.

- Needed for changes to `install/sql/*.sql`, `modules/system/install/sql/*.sql`, and a module's `install.sql`, `enable.sql` or `enable-app.sql`. Not for `disable.sql`, `uninstall.sql`, or new language keys (the image adds missing keys on start). A changed language string needs one.
- One file per change: `scripts/railway/migrations/YYYYMMDD-short-name.sql`, or `.php` returning a function when SQL is not enough. A module's migration starts with `-- module: bx_name`.
- It must be safe to run on a database that already has the change: `IF NOT EXISTS`, `INSERT IGNORE` or `INSERT ... WHERE NOT EXISTS`, `UPDATE ... WHERE` the old value. Never delete a row and insert it again. Statements run with an empty `sql_mode`, like install SQL.
- Run it on your local site with `docker compose exec -w /opt/una -e UNA_HEADER=/opt/una/inc/header.inc.php php php scripts/railway/migrate.php`. The integration test `RailwayMigrationsDbTest` then runs every migration twice more, ignoring the ledger, and fails on an SQL error.
- A migration that has run is never run again, even when its file changes, so a further change goes in a new file. One that failed was not recorded: fix that file in place.
- The `Database migrations` check fails a PR that changes install SQL without adding a migration, unless the description says "No database migration." with the reason.
- Module update packs (`modules/*/*/updates/`) are still needed for released versions. A migration is for sites that follow master.

## NEO (`neo/`)

`neo/` is NEO, the Next.js and Expo client for UNA, kept here as a git subtree. Before changing anything under `neo/`, read [`neo/AGENTS.md`](neo/AGENTS.md). Claude Code loads it through `neo/CLAUDE.md` when it opens a file there.

- Run NEO's yarn scripts from `neo/`, not from the UNA root.
- Branch from `master` and open the PR here. Start the title of a NEO-only PR with `Neo:`.
- Never commit to unacms/neo. It is a mirror that `.github/workflows/sync-neo.yml` pushes on every push to `master`, and client projects fork it.
- Run `yarn typecheck` and `yarn lint` in `neo/` before you push. On a PR that touches `neo/`, the CI job `NEO lint and typecheck` runs both on the PR and on its base and fails on any new error.
- CI deploys both halves to the `una-ci` Railway project: service `una` (UNA) and service `neo` (the NEO web client, built from `neo/` with `scripts/railway/neo/`). A PR gets `neo-pr-<n>.up.railway.app` (NEO) and `una-pr-<n>.up.railway.app` (UNA), Railway's own domains, so previews need no certificates of their own; master deploys production (`api.unacms.app`). See `.github/workflows/ci.yml` and `scripts/railway/`.
- A UNA service that NEO calls must return JSON for guests too; see [`neo/.agents/skills/una-api/SKILL.md`](neo/.agents/skills/una-api/SKILL.md).

