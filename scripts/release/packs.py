#!/usr/bin/env python3
"""
Builds the files part of UNA update packs. SQL is not generated here.

  packs.py system  --old-tree DIR --new-tree DIR --from 15.0.0-RC4 --to 15.0.0-RC5 [--out DIR]
  packs.py modules --since 15.0.0-RC4 --to-ref HEAD --system-version 15.0.0-RC5 [--out DIR] [--module NAME ...]
  packs.py versions --mode release|dev [--write]
  packs.py verify  --generated DIR --ref 15.0.0-RC4

system:  compares two unpacked release packages (the previous release and the new build) and writes
         upgrade/files/<from>-<to>/ with files/, files_delete.php and check.php. sql.sql, app.sql and
         script.php are created as stubs only when they are missing.
modules: for every module under modules/boonex that changed since its last update pack was made, writes modules/boonex/<module>/updates/<from>_<to>/ with install/config.php,
         install/installer.php, install/langs/ and source/. install/sql/ is left to a person.
versions: sets module versions for the release commit, or back to .DEV after it (see versions()).
verify:  compares generated packs with the ones committed at a git ref and prints every difference.

Only the standard library is used. Run it from the repository root.
"""

import argparse
import filecmp
import os
import re
import shutil
import subprocess
import sys

# Folders of a site that a system patch never writes to or deletes from.
SYSTEM_SKIP_TOP = ('install', 'cache', 'cache_public', 'logs', 'tmp', 'storage')
# Module vendors whose files travel in the system patch; other modules have their own update packs.
SYSTEM_MODULE_VENDORS = ('base', 'system')

MODULES_DIR = 'modules/boonex'

HEADER = """<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */
"""


def fail(message):
    sys.exit('packs.py: ' + message)


def git(*args, binary=False):
    result = subprocess.run(('git',) + args, capture_output=True)
    if result.returncode != 0:
        fail('git ' + ' '.join(args) + ': ' + result.stderr.decode(errors='replace').strip())
    return result.stdout if binary else result.stdout.decode()


def git_has(ref, path):
    return subprocess.run(('git', 'cat-file', '-e', ref + ':' + path), capture_output=True).returncode == 0


def write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f:
        f.write(data if isinstance(data, bytes) else data.encode())


def version_key(version):
    return [int(x) if x.isdigit() else x for x in re.split(r'[.\-]', version)]


def dotted(version):
    """15.0.0-RC4 -> 15.0.0.RC4, the spelling of upgrade/files folders and patch names."""
    return version.replace('-', '.')


# --------------------------------------------------------------------------------------------------
# system pack


def tree_files(root):
    found = set()
    for folder, _, names in os.walk(root):
        for name in names:
            found.add(os.path.relpath(os.path.join(folder, name), root).replace(os.sep, '/'))
    return found


def in_system_patch(path):
    parts = path.split('/')
    if parts[0] in SYSTEM_SKIP_TOP:
        return False
    if parts[0] == 'modules' and len(parts) > 2 and parts[1] not in SYSTEM_MODULE_VENDORS:
        return False
    return True


def removed_dirs(old_root, new_root, deleted):
    """Topmost folders that the new version no longer has; without them a patch leaves empty folders."""
    dirs = set()
    for path in deleted:
        folder = os.path.dirname(path)
        top = None
        while folder and not os.path.isdir(os.path.join(new_root, folder)):
            top = folder
            folder = os.path.dirname(folder)
        if top:
            dirs.add(top)
    return sorted(dirs)


def system_pack(args):
    old_root, new_root = args.old_tree.rstrip('/'), args.new_tree.rstrip('/')
    for root in (old_root, new_root):
        if not os.path.isfile(os.path.join(root, 'inc/version.inc.php')):
            fail(root + ' is not an unpacked UNA package (no inc/version.inc.php)')

    old_files = {p for p in tree_files(old_root) if in_system_patch(p)}
    new_files = {p for p in tree_files(new_root) if in_system_patch(p)}

    changed = sorted(p for p in new_files
                     if p not in old_files
                     or not filecmp.cmp(os.path.join(old_root, p), os.path.join(new_root, p), shallow=False))
    deleted = sorted(old_files - new_files)
    deleted_dirs = removed_dirs(old_root, new_root, deleted)

    pack = os.path.join(args.out, 'upgrade/files', dotted(args.v_from) + '-' + dotted(args.v_to))
    files_dir = os.path.join(pack, 'files')
    if os.path.isdir(files_dir):
        shutil.rmtree(files_dir)
    for path in changed:
        target = os.path.join(files_dir, path)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        shutil.copyfile(os.path.join(new_root, path), target)

    lines = ''.join(" '%s',\n" % p.replace("'", "\\'") for p in deleted + deleted_dirs)
    write(os.path.join(pack, 'files_delete.php'), "<?php\n\n$aFilesDelete = [\n" + lines + "];\n")

    spellings = sorted({args.v_from, dotted(args.v_from)}, key=lambda v: '-' in v)
    condition = ' || '.join("'%s' == $sVer" % v for v in spellings)
    write(os.path.join(pack, 'check.php'), """<?php

$mixCheckResult = 'Update can not be applied';

$sVer = $this->oDb->getOne("SELECT `version` FROM `sys_modules` WHERE `name` = 'system'");
if (%s)
    $mixCheckResult = true;

return $mixCheckResult;
""" % condition)

    where = ' OR '.join("`version` = '%s'" % v for v in spellings)
    stubs = {
        'sql.sql': "\n-- Last step is to update current version\n"
                   "UPDATE `sys_modules` SET `version` = '%s' WHERE (%s) AND `name` = 'system';\n" % (args.v_to, where),
        'app.sql': "",
        'script.php': """<?php

    // Schema changes that need a check (MySQL 5.7 has no ADD COLUMN IF NOT EXISTS) go here.

    // app related changes
    $aPathInfo = pathinfo(__FILE__);
    $mixedResult = $this->oDb->executeSQL($aPathInfo['dirname'] . '/app.sql');
    if (true !== $mixedResult) {
        if (!is_array($mixedResult))
            return $mixedResult;

        $s = '';
        foreach ($mixedResult as $a)
            $s .= "<b>{$a['query']}</b>: {$a['error']} <br />";
        return $s;
    }

    return true;
""",
    }
    for name, content in stubs.items():
        if not os.path.exists(os.path.join(pack, name)):
            write(os.path.join(pack, name), content)

    print('%s: %d files, %d to delete (%d folders)' % (pack, len(changed), len(deleted) + len(deleted_dirs), len(deleted_dirs)))


# --------------------------------------------------------------------------------------------------
# module packs


def config_value(text, key):
    match = re.search(r"'%s'\s*=>\s*'([^']*)'" % re.escape(key), text)
    return match.group(1) if match else None


def previous_pack(ref, module, below):
    """The newest update pack of a module at a ref that ends below a version: (from, to) or None."""
    names = git('ls-tree', '-d', '--name-only', ref, '%s/%s/updates/' % (MODULES_DIR, module)).split()
    packs = []
    for name in names:
        match = re.fullmatch(r'(.+)_(.+)', os.path.basename(name))
        if match and version_key(match.group(2)) < version_key(below):
            packs.append(match.groups())
    return max(packs, key=lambda p: version_key(p[1])) if packs else None


def pack_commit(ref, module, pack):
    """The commit that added a pack. The module as it was there is what sites with that pack have."""
    path = '%s/%s/updates/%s_%s/install/config.php' % (MODULES_DIR, module, pack[0], pack[1])
    return git('log', '--diff-filter=A', '--format=%H', '-1', ref, '--', path).strip() or None


def language_categories(ref):
    """Folder of a language category in a language module -> the category's name."""
    categories = {'system': 'System'}
    for line in git('grep', '-h', '-E', "'(name|language_category)' => '", ref, '--', MODULES_DIR + '/*/install/config.php').splitlines():
        match = re.search(r"'(name|language_category)'\s*=>\s*'([^']*)'", line)
        if match and match.group(1) == 'name':
            name = match.group(2)
        elif match:
            categories.setdefault(name, match.group(2))
    return categories


STRING_RE = re.compile(r'<string name="([^"]+)">(.*?)</string>', re.S)


def lang_strings(data):
    return dict(STRING_RE.findall(data.decode('utf-8', errors='replace'))) if data else {}


def lang_update(old, new):
    """An update pack language file for the difference between two language files, or None."""
    old_strings, new_strings = lang_strings(old), lang_strings(new)
    lines = []
    for key, value in new_strings.items():
        if key not in old_strings:
            lines.append('\t<string_add name="%s">%s</string_add>' % (key, value))
        elif old_strings[key] != value:
            lines.append('\t<string_upd name="%s">%s</string_upd>' % (key, value))
    for key in old_strings:
        if key not in new_strings:
            lines.append('\t<string_del name="%s" />' % key)
    if not lines:
        return None
    text = new.decode('utf-8', errors='replace')
    root = re.search(r'<resources[^>]*>', text)
    return '<?xml version="1.0" encoding="utf-8"?>\n%s\n%s\n</resources>\n' % (root.group(0) if root else '<resources>', '\n'.join(lines))


def lang_target(path):
    """Where a changed language file of a module goes in the pack's install/langs/, or None."""
    match = re.fullmatch(r'install/langs/([^/]+\.xml)', path)
    if match:
        return match.group(1)
    match = re.fullmatch(r'data/langs/([^/]+/[^/]+\.xml)', path)  # language modules: one folder per category
    return match.group(1) if match else None


def module_config(module, config, previous, v_from, v_to, system_version, flags, deleted, categories):
    pack_name = '%s_%s' % (v_from, v_to)
    uri = config_value(config, 'home_uri')
    values = {
        'version_from': v_from,
        'version_to': v_to,
        'home_dir': '%s%s/' % (config_value(config, 'home_dir'), 'updates/update_' + pack_name),
        'home_uri': '%s_update_%s_%s' % (uri, v_from.replace('.', ''), v_to.replace('.', '')),
    }
    delete_files = 'array(%s)' % ''.join("\n        '%s'," % p for p in deleted) + ('\n    ' if deleted else '')

    if previous:
        # The previous pack's config carries what is specific to the module (module_uri, restore_languages, ...).
        text = previous
        for key, value in values.items():
            text = re.sub(r"('%s'\s*=>\s*)'[^']*'" % key, lambda m: m.group(1) + "'%s'" % value, text, count=1)
        text = re.sub(r"('compatible_with'\s*=>\s*array\()[^)]*\)", lambda m: m.group(1) + "\n        '%s'\n    )" % system_version, text, count=1)
        for key, value in flags.items():
            text = re.sub(r"('%s'\s*=>\s*)\d" % key, lambda m: m.group(1) + str(value), text, count=1)
        text = re.sub(r"('delete_files'\s*=>\s*)array\([^)]*\)", lambda m: m.group(1) + delete_files, text, count=1)
        if categories:
            # A language module: the categories whose strings this pack changes.
            if len(categories) == 1 and categories[0][1] == '':
                value = "'%s'" % categories[0][0]
            else:
                value = 'array(%s\n    )' % ''.join("\n        array('name' => '%s', 'path' => '%s')," % c for c in categories)
            text = re.sub(r"('language_category'\s*=>\s*)(?:'[^']*'|array\(.*?\n    \))", lambda m: m.group(1) + value, text, count=1, flags=re.S)
        return text

    return HEADER + """
$aConfig = array(
    /**
     * Main Section.
     */
    'title' => '%(title)s',
    'version_from' => '%(version_from)s',
    'version_to' => '%(version_to)s',
    'vendor' => '%(vendor)s',

    'compatible_with' => array(
        '%(system)s'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => '%(home_dir)s',
    'home_uri' => '%(home_uri)s',

    'module_dir' => '%(module_dir)s',
    'module_uri' => '%(module_uri)s',

    'db_prefix' => '%(db_prefix)s',
    'class_prefix' => '%(class_prefix)s',

    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'execute_sql' => %(execute_sql)d,
        'update_files' => %(update_files)d,
        'update_languages' => %(update_languages)d,
        'clear_db_cache' => %(clear_db_cache)d,
    ),

    /**
     * Category for language keys.
     */
    'language_category' => '%(language_category)s',

    /**
     * Files Section
     */
    'delete_files' => %(delete_files)s,
);
""" % dict(values, system=system_version, delete_files=delete_files,
           title=config_value(config, 'title'), vendor=config_value(config, 'vendor'),
           module_dir=config_value(config, 'home_dir'), module_uri=uri,
           db_prefix=config_value(config, 'db_prefix'), class_prefix=config_value(config, 'class_prefix'),
           language_category=config_value(config, 'language_category'), **flags)


def release_config(config, version, system_version):
    """A module's install/config.php as a release ships it: no .DEV, compatible with this system version."""
    config = re.sub(r"('version'\s*=>\s*')[^']*'", lambda m: m.group(1) + version + "'", config, count=1)
    return re.sub(r"('compatible_with'\s*=>\s*array\(\s*)'[^']*'", lambda m: m.group(1) + "'%s'" % system_version, config, count=1)


def module_packs(args):
    to_ref = args.to_ref
    category_names = language_categories(to_ref)
    modules = sorted(os.path.basename(p) for p in git('ls-tree', '-d', '--name-only', to_ref, MODULES_DIR + '/').split())
    if args.module:
        modules = [m for m in modules if m in args.module]

    built, skipped = [], []
    for module in modules:
        home = '%s/%s' % (MODULES_DIR, module)
        config = git('show', '%s:%s/install/config.php' % (to_ref, home))
        v_to = re.sub(r'\.DEV$', '', config_value(config, 'version') or '', flags=re.I)
        last = previous_pack(to_ref, module, v_to)
        # What sites have is the module as it was when its last pack was made, which can be before the release tag.
        from_ref = (args.from_ref or pack_commit(to_ref, module, last)) if last else None
        released = [n for n in git('ls-tree', '-d', '--name-only', to_ref, home + '/updates/').split() if n.endswith('_' + v_to)]
        if released and not args.rebuild:
            if git('diff', '--name-only', pack_commit(to_ref, module, os.path.basename(released[0]).split('_')), to_ref, '--', home, ':!%s/updates' % home, ':!%s/migrations' % home).strip():
                skipped.append((module, 'changed after its %s pack was made: raise the version in install/config.php, or pass --rebuild to make that pack again' % v_to))
            continue
        if not from_ref:
            if git('diff', '--name-only', args.since, to_ref, '--', home, ':!%s/updates' % home, ':!%s/migrations' % home).strip():
                skipped.append((module, 'changed since %s and has no update pack to start from: not delivered by packs' % args.since))
            continue

        status = git('diff', '--no-renames', '--name-status', from_ref, to_ref, '--', home)
        changes = []
        for line in status.splitlines():
            state, path = line.split('\t', 1)
            rel = path[len(home) + 1:]
            if not rel.startswith(('updates/', 'migrations/')):
                changes.append((state, rel))
        if [rel for _, rel in changes] == ['install/config.php']:
            # A version line alone ("Back to DEV") is not a change to deliver.
            strip = lambda text: re.sub(r"'version'\s*=>\s*'[^']*'", '', text)
            if strip(git('show', '%s:%s/install/config.php' % (from_ref, home))) == strip(config):
                changes = []
        if not changes:
            continue
        v_from = last[1]

        pack = os.path.join(args.out, home, 'updates', '%s_%s' % (v_from, v_to))
        if os.path.isdir(os.path.join(pack, 'source')):
            shutil.rmtree(os.path.join(pack, 'source'))
        if os.path.isdir(os.path.join(pack, 'install/langs')):
            shutil.rmtree(os.path.join(pack, 'install/langs'))

        deleted, has_langs, categories, pending_langs = [], False, [], []
        is_language = 'BX_DOL_MODULE_TYPE_LANGUAGE' in config
        for state, rel in changes:
            if state == 'D':
                deleted.append(rel)
                continue
            data = git('show', '%s:%s/%s' % (to_ref, home, rel), binary=True)
            if rel == 'install/config.php':
                data = release_config(data.decode(), v_to, args.system_version).encode()
            write(os.path.join(pack, 'source', rel), data)

            target = lang_target(rel)
            if target:
                old = git('show', '%s:%s/%s' % (from_ref, home, rel), binary=True) if git_has(from_ref, '%s/%s' % (home, rel)) else None
                update = lang_update(old, data)
                if update:
                    if is_language:
                        folder = target.split('/')[0]
                        categories.append((category_names.get(folder, folder), folder + '/'))
                    pending_langs.append((target, update))
                    has_langs = True

        categories = sorted(set(categories))
        if len(categories) == 1:
            # One category: its file sits in install/langs/ itself, as in the packs so far.
            categories = [(categories[0][0], '')]
            pending_langs = [(target.split('/', 1)[1], update) for target, update in pending_langs]
        for target, update in pending_langs:
            write(os.path.join(pack, 'install/langs', target), update)

        if not os.path.isfile(os.path.join(pack, 'source/install/config.php')):
            write(os.path.join(pack, 'source/install/config.php'), release_config(config, v_to, args.system_version))

        sql_dir = os.path.join(pack, 'install/sql')
        has_sql = os.path.isdir(sql_dir) and bool(os.listdir(sql_dir))
        flags = {'execute_sql': int(has_sql), 'update_files': 1, 'update_languages': int(has_langs), 'clear_db_cache': int(has_sql)}

        previous_path = '%s/updates/%s_%s/install/config.php' % (home, last[0], last[1])
        previous = git('show', '%s:%s' % (to_ref, previous_path)) if git_has(to_ref, previous_path) else None
        write(os.path.join(pack, 'install/config.php'),
              module_config(module, config, previous, v_from, v_to, args.system_version, flags, deleted, categories))

        installer = os.path.join(pack, 'install/installer.php')
        if not os.path.exists(installer):
            write(installer, HEADER + """
class %sUpdater extends BxDolStudioUpdater
{
    function __construct($aConfig)
    {
        parent::__construct($aConfig);
    }
}
""" % config_value(config, 'class_prefix'))

        sql_changed = [rel for state, rel in changes if re.fullmatch(r'install/sql/(install|enable|enable-app)\.sql', rel)]
        built.append((module, v_from, v_to, len(changes) - len(deleted), len(deleted), sql_changed))

    for module, v_from, v_to, files, deleted, sql_changed in built:
        note = ('  SQL NEEDED: ' + ', '.join(os.path.basename(p) for p in sql_changed)) if sql_changed else ''
        print('%-22s %s -> %s  %d files, %d deleted%s' % (module, v_from, v_to, files, deleted, note))
    for module, reason in skipped:
        print('%-22s SKIPPED: %s' % (module, reason))
    print('%d packs, %d modules skipped' % (len(built), len(skipped)))


# --------------------------------------------------------------------------------------------------
# module versions


def disk_packs(module):
    folder = '%s/%s/updates' % (MODULES_DIR, module)
    names = os.listdir(folder) if os.path.isdir(folder) else []
    return [m.groups() for m in (re.fullmatch(r'(.+)_(.+)', n) for n in names) if m]


def versions(args):
    """
    release: every module gets the version sites will have after this release: its own version without
             .DEV when it has an update pack to that version (or never had packs), else the version its
             last pack leaves. Run it after `modules`.
    dev:     back to development: a module whose version is the one its last pack leaves gets the next
             version with .DEV; a module without packs gets the line it had at --orig-ref.
    """
    changed = 0
    for module in sorted(os.listdir(MODULES_DIR)):
        path = '%s/%s/install/config.php' % (MODULES_DIR, module)
        if not os.path.isfile(path):
            continue
        with open(path, 'rb') as f:
            raw = f.read()
        match = re.search(rb"'version'\s*=>\s*'([^']*)'", raw)
        if not match:
            continue
        current = match.group(1).decode()
        packs = disk_packs(module)
        last = max((p[1] for p in packs), key=version_key) if packs else None

        if args.mode == 'release':
            base = re.sub(r'\.DEV$', '', current, flags=re.I)
            new = base if not last or last == base else last
        elif last:
            if current != last:
                continue
            parts = last.split('.')
            parts[-1] = str(int(parts[-1]) + 1)
            new = '.'.join(parts) + '.DEV'
        else:
            original = git('show', '%s:%s' % (args.orig_ref, path)) if git_has(args.orig_ref, path) else ''
            new = config_value(original, 'version') or current

        if new != current:
            changed += 1
            print('%-22s %s -> %s' % (module, current, new))
            if args.write:
                with open(path, 'wb') as f:
                    f.write(raw[:match.start(1)] + new.encode() + raw[match.end(1):])
    print('%d modules %s' % (changed, 'changed' if args.write else 'would change (pass --write)'))


# --------------------------------------------------------------------------------------------------
# verify


def verify(args):
    root = args.generated.rstrip('/')
    generated = tree_files(root)
    packs = sorted({re.match(r'(.+?/updates/[^/]+|upgrade/files/[^/]+)/', p).group(1)
                    for p in generated if re.match(r'(.+?/updates/[^/]+|upgrade/files/[^/]+)/', p)})
    total = 0
    for pack in packs:
        ours = {p for p in generated if p.startswith(pack + '/')}
        theirs = set(git('ls-tree', '-r', '--name-only', args.ref, pack + '/').splitlines())
        if not theirs:
            print('%s: not at %s' % (pack, args.ref))
            total += 1
            continue
        problems = []
        for path in sorted(ours - theirs):
            problems.append('  only generated: ' + path[len(pack) + 1:])
        for path in sorted(theirs - ours):
            problems.append('  only committed: ' + path[len(pack) + 1:])
        for path in sorted(ours & theirs):
            with open(os.path.join(root, path), 'rb') as f:
                mine = f.read()
            committed = git('show', '%s:%s' % (args.ref, path), binary=True)
            if mine != committed:
                kind = 'line endings' if mine.replace(b'\r\n', b'\n') == committed.replace(b'\r\n', b'\n') else 'content'
                problems.append('  differs (%s): %s' % (kind, path[len(pack) + 1:]))
        total += len(problems)
        print('%s: %s' % (pack, 'same' if not problems else '%d differences' % len(problems)))
        for line in problems[:args.limit]:
            print(line)
        if len(problems) > args.limit:
            print('  ... %d more' % (len(problems) - args.limit))
    print('%d packs, %d differences' % (len(packs), total))
    return 1 if total else 0


def main():
    parser = argparse.ArgumentParser(description='Builds the files part of UNA update packs.')
    commands = parser.add_subparsers(dest='command', required=True)

    p = commands.add_parser('system')
    p.add_argument('--old-tree', required=True, help='unpacked package of the previous release')
    p.add_argument('--new-tree', required=True, help='unpacked package of the new release')
    p.add_argument('--from', dest='v_from', required=True, help='previous system version, as in BX_DOL_VERSION')
    p.add_argument('--to', dest='v_to', required=True, help='new system version, as in BX_DOL_VERSION')
    p.add_argument('--out', default='.', help='where the repository tree is written (default: here)')
    p.set_defaults(run=system_pack)

    p = commands.add_parser('modules')
    p.add_argument('--since', required=True, help='git ref of the previous release, to report changed modules that get no pack')
    p.add_argument('--from-ref', help='compare every module with this ref instead of the commit that added its last pack')
    p.add_argument('--to-ref', required=True, help='git ref of the new release')
    p.add_argument('--system-version', required=True, help='new system version, for compatible_with')
    p.add_argument('--module', action='append', help='only this module folder (repeatable)')
    p.add_argument('--rebuild', action='store_true', help="make a pack again when the module's version already has one")
    p.add_argument('--out', default='.', help='where the repository tree is written (default: here)')
    p.set_defaults(run=module_packs)

    p = commands.add_parser('versions')
    p.add_argument('--mode', required=True, choices=('release', 'dev'))
    p.add_argument('--orig-ref', default='HEAD', help='dev: where modules without packs take their version line from')
    p.add_argument('--write', action='store_true', help='change the files; without it only the list is printed')
    p.set_defaults(run=versions)

    p = commands.add_parser('verify')
    p.add_argument('--generated', required=True, help='folder that system/modules wrote with --out')
    p.add_argument('--ref', required=True, help='git ref that has the committed packs')
    p.add_argument('--limit', type=int, default=12, help='differences printed per pack')
    p.set_defaults(run=verify)

    args = parser.parse_args()
    sys.exit(args.run(args) or 0)


if __name__ == '__main__':
    main()
