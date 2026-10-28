# Database migrations

UNA runs install SQL once, when a site or module is installed. A change to install SQL reaches
new installs and never a database that is already installed. A migration carries that change to
installed sites. `periodic/migrate.php` (`BxDolMigrations`) runs each migration once per
database and records it in the `sys_migrations` table. After it applies anything it recompiles
languages, clears UNA's caches and bumps `sys_revision`.

Until 15.0.0 is released this runs alongside the update packs, on sites that follow master such
as api.unacms.app, which runs it on every start. After 15.0.0 it is meant to replace the update
packs.

## Folders

- `migrations/` (this folder): common migrations, which belong to no module.
- `modules/<vendor>/<module>/migrations/`: a module's migrations, `modules/system/migrations/`
  for the system module. They run while the module is installed and enabled. Installing a
  module records its migrations without running them, because its install SQL already has
  them. A disabled module's migrations wait until it is enabled again.

A module without a `migrations/` folder installs and updates as before.

A fresh install records every migration it ships with as `baseline` without running it.

## When a PR needs one

Add a migration when the PR changes what an installed site has in its database:

- `install/sql/*.sql` and `modules/system/install/sql/*.sql`
- a module's `install.sql`, `enable.sql` or `enable-app.sql` (`modules/*/*/install/sql/`)
- language strings: `modules/boonex/english/data/langs/system/en.xml` and a module's
  `install/langs/*.xml`

`disable.sql` and `uninstall.sql` run when a module is removed, so changes there need none.

The `Database migrations` check fails a PR that changes those files without adding a new
migration, unless the PR description says there is no database migration
("No database migration."). Say why there, for example "only changes uninstall SQL".
Editing a migration that is already on master does not count: sites that ran it never run it
again.

## Names and order

`YYYYMMDDNN_short_desc.ext`: the date you write it, NN a serial number for that day (00, 01,
02, ...), then a short description in lowercase words joined by `_`. For example
`2026102900_sockets_type_default.sql`. The name without extension is the migration id. The
`YYYYMMDDNN` part is unique within a folder, and an id is never changed or reused once it is on
master.

Migrations run in id order across all folders, so a module migration written after a common
one runs after it. On the same `YYYYMMDDNN`, common migrations run first, then the system
module's, then other modules' by module name. The first failure stops the run: nothing after it
runs until it succeeds.

## Formats

The extension sets the format. Any other file is an error, except `*.md` and dot files.

Every file declares the oldest UNA version it runs on, in a comment, before anything else:

```
UNA-Migration-Min-System-Version: 15.0.0
```

While the installed system is older (`sys_modules` version of `system`; 15.0.0-RC3 is older
than 15.0.0), the run stops at that migration with an error. So declare the version the
migration's code needs: for a change that sites on the current master need now, that is the
version in `inc/version.inc.php`.

### SQL

Statements run one by one with an empty `sql_mode`, as UNA's installer runs install SQL, so an
`INSERT` may leave out columns that have defaults. `SET @var = ...` carries over to the next
statements of the same file. `DELIMITER` lines work as in install SQL.

```sql
-- UNA-Migration-Min-System-Version: 15.0.0
-- Posts: "Popular" menu item for the API (#6100). sys_menu_items has no unique key on the
-- name, so INSERT IGNORE would add it again on every run.
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title`, `link`, `active`, `active_api`, `order`)
SELECT 'bx_posts_submenu', 'bx_posts', 'posts-popular', '_bx_posts_menu_item_title_entries_popular', 'page.php?i=posts-popular', 1, 1, 3 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'bx_posts_submenu' AND `name` = 'posts-popular');
```

### PHP

For changes SQL cannot express well. It runs with UNA loaded and starts with the same guard as
every UNA file, so a web request for it does nothing. Returning `false` or throwing fails it; a
returned function is called the same way.

```php
<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0
 * Editor videos: transcoder handlers for the new sys_videos_editor_* objects (#5776)
 */

BxDolTranscoder::registerHandlersSystem();
```

### XML: language strings

The format of update packs' language files. `string_add` adds a key, `string_upd` changes a
string, and `string_del` deletes a key from every language. Strings go in the language that
`name` names, in the module's language category (`category="..."` on `<resources>` sets
another). Where that language is not installed the file changes nothing: installing the
language later brings its current strings.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- UNA-Migration-Min-System-Version: 15.0.0 -->
<resources name="en" flag="gb" title="English">
    <string_add name="_bx_posts_txt_popular"><![CDATA[Popular]]></string_add>
    <string_upd name="_sys_txt_login"><![CDATA[Sign in]]></string_upd>
    <string_del name="_bx_posts_txt_old"></string_del>
</resources>
```

Change the strings in the language's install files too (`install/langs/en.xml`), so new
installs get them.

## Safe to run twice

A migration must be safe to run on a database that already has its change. A site installed
from an older commit, or restored from a backup, runs every migration it has not recorded, and
a failed migration runs again from its first statement.

- `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`,
  `ADD INDEX IF NOT EXISTS`, `DROP ... IF EXISTS` (MariaDB syntax).
- New rows: `INSERT IGNORE` only when the table has a unique key on them (check the
  `CREATE TABLE`; many, like `sys_menu_items` and `sys_pages_blocks`, have none), otherwise
  `INSERT ... SELECT ... FROM DUAL WHERE NOT EXISTS (...)`.
- Changed rows: `UPDATE ... WHERE` the old value, so an admin's own setting is left alone.
- Never delete a row and insert it again to change it. It gets a new id, and anything that
  refers to the old one breaks.
- Tables are created with UNA's storage engine default, so copy `CREATE TABLE` from install SQL
  as it is.

Each migration runs in a transaction together with its record in the ledger. That only helps
where its tables are InnoDB and it has no DDL: `CREATE`, `ALTER` and `DROP` commit on their own,
and MyISAM tables ignore transactions. So write it to be run twice anyway.

## Failures

The failed migration is not recorded and is rolled back where the tables allow. The run stops
there, exits with status 1, and the log says `[migrations] FAILED`, the migration, the file and
which statement. The next run starts again from that migration, so fix it by editing that same
file. A migration that has run is never run again, even when its file changes: a further change
goes in a new migration. When rebuilding languages or caches fails after migrations ran, the
ledger keeps a `~refresh-pending` row and every run tries the rebuild again.

## Baselines

Old migrations can be folded into install SQL and deleted, leaving a baseline in their place.
A baseline is a `.sql` or `.php` migration that also lists the migrations it covers, all
earlier ones from its own folder:

```sql
-- UNA-Migration-Min-System-Version: 16.0.0
-- UNA-Migration-Baseline-Covers: 2026102900_sockets_type_default 2026110300_posts_popular
ALTER TABLE `sys_objects_sockets` ADD COLUMN IF NOT EXISTS `type` varchar(32) NOT NULL default '';
INSERT INTO `sys_menu_items` (...) SELECT ... WHERE NOT EXISTS (...);
```

- A baseline runs where the first migration it covers would have run, not at its own date, so
  a migration in another folder that came after a covered one still runs after the baseline.
  Its changes must therefore not depend on another folder's migrations dated after the first
  one it covers.
- A fresh install records the baseline like any other migration.
- A database whose ledger has every covered migration records the baseline without running it.
- A database that misses any of them runs the baseline's statements or code, which must bring
  it to the state the covered migrations would have (the covered files are gone). An SQL
  baseline with no statements fails there, naming the migrations that database never ran.

Language migrations count like any other: a baseline that covers one repeats its strings with
`UPDATE` statements or PHP. The ledger rows of covered migrations stay.

## Checking it

Check the files, as CI does (no database needed):

```bash
docker compose exec -w /opt/una php php periodic/migrate.php --check
```

Run it against your local site:

```bash
docker compose exec -w /opt/una php php periodic/migrate.php
```

The ledger then skips it, so for a second run use the integration test `MigrationsDbTest`. It
runs every migration of `migrations/` and of the installed modules twice against the test
database, ignoring the ledger, and fails on any error or when the second run changes anything.
On CI that database is a fresh install of the PR, which already has every change, so it also
proves the migration is safe to run where the change is in place.

```bash
docker compose exec -w /opt/una php ./plugins/bin/phpunit -c tests/phpunit.xml --filter MigrationsDbTest
```
