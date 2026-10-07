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
    │   └── nextjs/        # Next.js web frontend
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
- Set `active_api` in `install/sql/enable-app-pages.sql` (page blocks) and `install/sql/enable-app-menus.sql` (menu items) for core, for modules use `modules/boonex/*/install/sql/enable-app.sql` files. Do not set it in `install.sql`, `enable.sql`, or other common install and enable scripts.

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

## NEO (`neo/`)

`neo/` is NEO, the Next.js and Expo client for UNA, kept here as a git subtree. Before changing anything under `neo/`, read [`neo/AGENTS.md`](neo/AGENTS.md). Claude Code loads it through `neo/CLAUDE.md` when it opens a file there.

- Run NEO's yarn scripts from `neo/`, not from the UNA root.
- Branch from `master` and open the PR here. Start the title of a NEO-only PR with `Neo:`.
- Never commit to unacms/neo. It is a mirror that `.github/workflows/sync-neo.yml` pushes on every push to `master`, and client projects fork it.
- UNA CI doesn't check `neo/`. Run `yarn typecheck` and `yarn lint` in `neo/` before you push.
- CI deploys both halves to the `una-ci` Railway project: service `una` (UNA) and service `neo` (the NEO web client, built from `neo/` with `scripts/railway/neo/`). A PR gets `pr-<n>.unacms.app` (NEO) and `api-pr-<n>.unacms.app` (UNA); master deploys production. See `.github/workflows/ci.yml` and `scripts/railway/`.
- A UNA service that NEO calls must return JSON for guests too; see [`neo/.agents/skills/una-api/SKILL.md`](neo/.agents/skills/una-api/SKILL.md).

