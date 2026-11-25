#!/usr/bin/env python3
"""
Compares an upgraded site with a fresh one, both started with site.sh, and prints every difference.

  compare.py <fresh site name> <upgraded site name> [--report FILE] [--samples N]

Compared:
  versions   sys_modules: name and version
  schema     tables, columns, keys (mysqldump --no-data)
  data       rows of the settings tables (sys_* and others that install SQL fills), matched by content:
             auto-increment ids, references to them and times are left out; language strings are
             compared by key and language
  files      the two site folders, without caches, logs, uploads and update packs

An upgrade is complete when nothing is listed, or what is listed is explained.
Only the standard library is used.
"""

import argparse
import collections
import filecmp
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

# Tables whose rows are what a site did, not how it is set up.
SKIP_TABLES = re.compile(
    r'^(sys_sessions|sys_keys|sys_migrations|sys_files.*|sys_images.*|sys_transcoder_.*queue.*|sys_storage_(ghosts|tokens|deletions)'
    r'|sys_queue_.*|sys_cmts_.*|sys_profiles.*|sys_accounts.*|sys_localization_(keys|strings)|sys_modules_file_tracks'
    r'|sys_admin_log|sys_api_(tokens|idempotency|rate_limits)|sys_cron_jobs_.*|sys_search_.*|sys_statistics.*|sys_audit.*'
    r'|sys_agents_(vector|messages|chats|automators_.*log).*|sys_seo_.*|sys_logs.*|sys_alerts_log|bx_analytics_.*)$')
# Columns that differ between any two installs: ids given by auto-increment, references to them, times.
SKIP_COLUMNS = re.compile(
    r'^(id|ID|parent_id|IDKey|IDLanguage|IDCategory|category_id|handler_id|type_id|set_id|block_id|menu_id|page_id|form_id'
    r'|added|changed|created|updated|date|ts|when|time|installed|last_.*|.*_date|hash|secret|IDAction|IDLevel|template_id|text_updated)$')
# Options whose value belongs to the site: keys, the time of install, what cron or the first requests wrote.
SITE_OPTIONS = re.compile(
    r'^(sys_iconset_default|sys_revision|sys_install_time|sys_.*_(key|secret|salt|token|hash)|sys_cron_time|sys_site_title|site_title|sys_site_email'
    r'|sys_storage_.*_(time|ts)|sys_upgrade_channel|sys_template_cache_.*|.*_last_(run|time|check).*|sys_oauth_.*|sys_eq_time'
    r'|sys_transcoder_queue_storage|sys_css_media.*|sys_api_secret.*)$')
# What a new site gets and an updated site deliberately keeps as it was. Listed in the report, not counted.
NEW_SITE_ONLY = {
    'icon': 'icon names: a new site uses the Lucide set (sys_iconset_default), an updated one keeps Font Awesome',
    'Icon': 'icon names: a new site uses the Lucide set (sys_iconset_default), an updated one keeps Font Awesome',
    'icon_font': 'icon names: a new site uses the Lucide set (sys_iconset_default), an updated one keeps Font Awesome',
    'engine': 'grids: a new site renders every grid with AG Grid, an updated one only those a migration switched',
}
FILES_SKIP = {'cache', 'cache_public', 'logs', 'tmp', 'storage', 'updates', 'scripts', 'install'}


def site(name, *args):
    result = subprocess.run([os.path.join(HERE, 'site.sh'), args[0], name] + list(args[1:]), capture_output=True)
    if result.returncode != 0:
        sys.exit('compare.py: site.sh %s %s: %s' % (args[0], name, result.stderr.decode(errors='replace').strip()[-400:]))
    return result.stdout.decode(errors='replace')


def rows(name, query):
    return [line.split('\t') for line in site(name, 'sql', query).split('\n') if line]


def schema(name):
    text = re.sub(r' AUTO_INCREMENT=\d+', '', site(name, 'dump', '--no-data', '--skip-comments', '--skip-dump-date'))
    tables = {}
    for match in re.finditer(r'CREATE TABLE `([^`]+)` \((.*?)\n\) ENGINE', text, re.S):
        tables[match.group(1)] = {line.strip().rstrip(',') for line in match.group(2).strip().split('\n')}
    return tables


def table_rows(name, table, columns):
    select = ', '.join("COALESCE(REPLACE(REPLACE(`%s`, '\\t', ' '), '\\n', '\\\\n'), 'NULL')" % c for c in columns)
    return collections.Counter(tuple(r) for r in rows(name, 'SELECT %s FROM `%s`' % (select, table)))


def language_strings(name):
    query = ("SELECT k.`Key`, l.`Name`, REPLACE(REPLACE(s.`String`, '\\t', ' '), '\\n', '\\\\n') FROM `sys_localization_strings` s "
             "JOIN `sys_localization_keys` k ON k.`ID` = s.`IDKey` JOIN `sys_localization_languages` l ON l.`ID` = s.`IDLanguage`")
    # Keys with a number at the end are made for one site: form fields and pages an admin or a seed added.
    return {(r[0], r[1]): (r[2] if len(r) > 2 else '') for r in rows(name, query) if not re.search(r'_\d{9,}$', r[0])}


def files(root):
    found = {}
    for folder, dirs, names in os.walk(root):
        rel = os.path.relpath(folder, root)
        dirs[:] = [d for d in dirs if not (rel == '.' and d in FILES_SKIP) and d != 'updates']
        for n in names:
            found[os.path.normpath(os.path.join(rel, n))] = os.path.join(folder, n)
    return found


def main():
    parser = argparse.ArgumentParser(description='Compares an upgraded site with a fresh one.')
    parser.add_argument('fresh')
    parser.add_argument('upgraded')
    parser.add_argument('--report', help='write the report to this file as well')
    parser.add_argument('--samples', type=int, default=8, help='differences printed per table')
    args = parser.parse_args()

    out, total = [], 0

    def section(title, lines):
        nonlocal total
        total += len(lines)
        out.append('\n## %s: %s' % (title, '%d differences' % len(lines) if lines else 'same'))
        out.extend(lines)

    # versions
    f = dict(r[:2] for r in rows(args.fresh, 'SELECT `name`, `version` FROM `sys_modules`'))
    u = dict(r[:2] for r in rows(args.upgraded, 'SELECT `name`, `version` FROM `sys_modules`'))
    section('Versions', ['- %s: fresh %s, upgraded %s' % (n, f.get(n, 'not installed'), u.get(n, 'not installed'))
                         for n in sorted(set(f) | set(u)) if f.get(n) != u.get(n)])

    # schema
    fs, us = schema(args.fresh), schema(args.upgraded)
    lines = ['- table only on fresh: `%s`' % t for t in sorted(set(fs) - set(us))]
    lines += ['- table only on upgraded: `%s`' % t for t in sorted(set(us) - set(fs))]
    for t in sorted(set(fs) & set(us)):
        for d in sorted(fs[t] - us[t]):
            lines.append('- `%s` fresh only: %s' % (t, d))
        for d in sorted(us[t] - fs[t]):
            lines.append('- `%s` upgraded only: %s' % (t, d))
    section('Schema', lines)

    # data
    lines = []
    known = collections.defaultdict(list)
    counts = dict((r[0], int(r[1])) for r in rows(args.fresh, "SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()"))
    columns = collections.defaultdict(list)
    for r in rows(args.fresh, "SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME, ORDINAL_POSITION"):
        columns[r[0]].append(r[1])
    for t in sorted(set(fs) & set(us)):
        if SKIP_TABLES.match(t) or not (t.startswith('sys_') or counts.get(t, 0)):
            continue
        cols = [c for c in columns[t] if not SKIP_COLUMNS.match(c) and c not in NEW_SITE_ONLY and ('`%s`' % c) in ' '.join(us[t])]
        for c in columns[t]:
            if c in NEW_SITE_ONLY:
                known[NEW_SITE_ONLY[c]].append('%s.%s' % (t, c))
        if not cols:
            continue
        a, b = table_rows(args.fresh, t, cols), table_rows(args.upgraded, t, cols)
        if t == 'sys_options':
            name_at = cols.index('name')
            value_at = cols.index('value') if 'value' in cols else None
            def clean(counter):
                result = collections.Counter()
                for row, n in counter.items():
                    if value_at is not None and SITE_OPTIONS.match(row[name_at]):
                        row = row[:value_at] + ('(site value)',) + row[value_at + 1:]
                    result[row] += n
                return result
            a, b = clean(a), clean(b)
        only_fresh, only_upgraded = a - b, b - a
        if not only_fresh and not only_upgraded:
            continue
        lines.append('- `%s`: %d rows only on fresh, %d only on upgraded (of %d)' % (t, sum(only_fresh.values()), sum(only_upgraded.values()), sum(a.values())))
        # Rows that are the same but for one column are one change, counted per column.
        for at, column in enumerate(cols):
            index = collections.defaultdict(list)
            for row in only_upgraded.elements():
                index[row[:at] + row[at + 1:]].append(row)
            pairs = []
            for row in list(only_fresh.elements()):
                bucket = index.get(row[:at] + row[at + 1:])
                if bucket:
                    other = bucket.pop()
                    pairs.append((row[at], other[at]))
                    only_fresh[row] -= 1
                    only_upgraded[other] -= 1
            if pairs:
                kinds = collections.Counter(pairs).most_common(3)
                lines.append('    - `%s` differs in %d rows: %s' % (column, len(pairs), '; '.join(
                    'fresh "%s", upgraded "%s" (%d)' % (f[:60], u[:60], n) for (f, u), n in kinds)))
        only_fresh, only_upgraded = +only_fresh, +only_upgraded
        if only_fresh or only_upgraded:
            lines.append('    - other rows: %d only on fresh, %d only on upgraded' % (sum(only_fresh.values()), sum(only_upgraded.values())))
        def show(label, counter):
            for row in list(counter)[:args.samples]:
                cells = ['%s=%s' % (c, v[:70]) for c, v in zip(cols, row) if v not in ('', '0', 'NULL')]
                lines.append('    - %s: %s' % (label, '; '.join(cells)[:420]))
        show('fresh', only_fresh)
        show('upgraded', only_upgraded)
    section('Data', lines)
    out.append('\nNot compared, by design:')
    out.extend('- %s (%d columns)' % (reason, len(where)) for reason, where in known.items())

    # language strings
    a, b = language_strings(args.fresh), language_strings(args.upgraded)
    lines = ['- only on fresh: %s [%s]' % k for k in sorted(set(a) - set(b))]
    lines += ['- only on upgraded: %s [%s]' % k for k in sorted(set(b) - set(a))]
    lines += ['- differs: %s [%s]: fresh "%s", upgraded "%s"' % (k[0], k[1], a[k][:90], b[k][:90]) for k in sorted(set(a) & set(b)) if a[k] != b[k]]
    section('Language strings', lines)

    # files
    base = os.environ.get('UNA_CHECK_DIR') or os.path.join(HERE, '../../../packages/release/check')
    a, b = files(os.path.join(base, args.fresh, 'site')), files(os.path.join(base, args.upgraded, 'site'))
    skip = lambda p: p in ('inc/header.inc.php',) or p.startswith('plugins/composer/')
    lines = ['- only on fresh: %s' % p for p in sorted(set(a) - set(b)) if not skip(p)]
    lines += ['- only on upgraded: %s' % p for p in sorted(set(b) - set(a)) if not skip(p)]
    lines += ['- differs: %s' % p for p in sorted(set(a) & set(b)) if not skip(p) and not filecmp.cmp(a[p], b[p], shallow=False)]
    section('Files', lines)

    report = '# Upgraded site "%s" against fresh site "%s"\n\n%d differences in all.\n%s\n' % (args.upgraded, args.fresh, total, '\n'.join(out))
    if args.report:
        with open(args.report, 'w') as f:
            f.write(report)
    print(report if total < 400 else report[:30000] + '\n... (see --report for the rest)')
    return 1 if total else 0


if __name__ == '__main__':
    sys.exit(main())
