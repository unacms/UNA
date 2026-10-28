# Database migrations for sites that follow master

UNA runs install SQL once, when a site or module is installed, and update packs only between
released versions. A site deployed from every master commit, like api.unacms.app, gets neither:
a merged change to install SQL reaches new installs and never the running database.

A file in this folder carries one such change. `scripts/railway/migrate.php` runs each file once
per database, in file name order, on every container start, and records it in the
`sys_deploy_migrations` table. After it applies anything it recompiles languages, clears UNA's
caches and bumps `sys_revision`.

A fresh install records the files it ships with as `baseline` without running them: its install
SQL already has the changes.

## When a PR needs one

Add a migration when the PR changes what an installed site has in its database:

- `install/sql/*.sql` and `modules/system/install/sql/*.sql`
- a module's `install.sql`, `enable.sql` or `enable-app.sql` (`modules/*/*/install/sql/`)

`disable.sql` and `uninstall.sql` run when a module is removed, so changes there need none.
Neither do new language keys: `languages.php` adds keys that are missing on every start.
A changed string does need one (see below).

The `Database migrations` check fails a PR that changes those files without adding a file here,
unless the PR description says there is no database migration ("No database migration.").
Say why there, for example "only changes uninstall SQL" or "a fresh-install default only".

## Writing one

Name it `YYYYMMDD-short-name.sql` (or `.php`), dated the day you write it, for example
`20261029-sockets-type-default.sql`. Keep the change and its migration in the same PR, and put
the SQL in the PR description as well (AGENTS.md).

Every migration must be safe to run on a database that already has the change. A site installed
from an older commit, or restored from a backup, runs every file it has not recorded.

- `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`,
  `ADD INDEX IF NOT EXISTS`, `DROP ... IF EXISTS` (MariaDB syntax; production is MariaDB 11).
- New rows: `INSERT IGNORE` only when the table has a unique key on them (check the
  `CREATE TABLE`; many, like `sys_menu_items` and `sys_pages_blocks`, have none), otherwise
  `INSERT ... SELECT ... FROM DUAL WHERE NOT EXISTS (...)`.
- Changed rows: `UPDATE ... WHERE` the old value, so an admin's own setting is left alone.
- Never delete a row and insert it again to change it. It gets a new id, and anything that
  refers to the old one breaks.
- Statements run with an empty `sql_mode`, as UNA's installer does, so an `INSERT` may leave out
  columns that have defaults, the same as install SQL. Tables are created with UNA's own storage
  engine default, so copy `CREATE TABLE` from install SQL as it is.
- `SET @var = ...` carries over to the next statements of the same file, as in install SQL.

A migration that only makes sense when a module is installed starts with a `module` line. Where
the module is not installed it is recorded as skipped and never runs: installing the module later
runs its install SQL, which already has the change.

```sql
-- module: bx_posts
-- Posts: "Popular" menu item for the API (#6100). sys_menu_items has no unique key on the
-- name, so INSERT IGNORE would add it again on every run.
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title`, `link`, `active`, `active_api`, `order`)
SELECT 'bx_posts_submenu', 'bx_posts', 'posts-popular', '_bx_posts_menu_item_title_entries_popular', 'page.php?i=posts-popular', 1, 1, 3 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'bx_posts_submenu' AND `name` = 'posts-popular');
```

A changed language string, keeping any edit an admin made in Studio:

```sql
UPDATE `sys_localization_strings` AS `s`
INNER JOIN `sys_localization_keys` AS `k` ON `k`.`ID` = `s`.`IDKey`
INNER JOIN `sys_localization_languages` AS `l` ON `l`.`ID` = `s`.`IDLanguage`
SET `s`.`String` = 'Sign in'
WHERE `k`.`Key` = '_sys_txt_login' AND `l`.`Name` = 'en' AND `s`.`String` = 'Log in';
```

When SQL is not enough, a `.php` file returns a function. It runs with UNA loaded; returning
`false` or throwing fails the migration.

```php
<?php
// Editor videos: transcoder handlers for the new sys_videos_editor_* objects (#5776)
return function () {
    BxDolTranscoder::registerHandlersSystem();
};
```

## Checking it

Run it against your local site:

```bash
docker compose exec -w /opt/una -e UNA_HEADER=/opt/una/inc/header.inc.php php php scripts/railway/migrate.php
```

The ledger then skips it, so for a second run use the integration test `RailwayMigrationsDbTest`.
It runs every file here twice against the test database, ignoring the ledger, and fails on any
SQL error. On CI that database is a fresh install of the PR, which already has every change, so
it also proves the migration is safe to run where the change is in place.

```bash
docker compose exec -w /opt/una php ./plugins/bin/phpunit -c tests/phpunit.xml --filter RailwayMigrationsDbTest
```

A failed migration does not stop the site from starting. The log says `[migrations] FAILED` and
which statement; the ones after it wait. The next start tries again from the failed one, so fix
it in a new commit by editing that same file. A file that has already run is never run again,
even when it changes: put a further change in a new file.
