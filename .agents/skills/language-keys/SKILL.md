---
name: language-keys
description: Add a missing English or Russian UNA string with scripts/add_lang_key.php, which updates the language XML, the database, and the language cache. Use when introducing a user-facing string, language key, or translation. Do not insert keys by hand into language XML, sys_localization_keys, or sys_localization_strings.
---

# Language keys

Add a missing English or Russian string with `scripts/add_lang_key.php`. Do not insert keys by hand into language XML, `sys_localization_keys`, or `sys_localization_strings`.

Run it in the php container. Arguments are language (`en` or `ru`), key, and translation. An existing translation is left unchanged. The script inserts the key in the right language file next to the closest existing keys (`_sys_…` to system, `_bx_posts_…` to Posts, and so on), inserts it into the database when that language is installed, and recompiles the language cache.

```bash
docker exec -i una-php-1 php /opt/una/scripts/add_lang_key.php en _sys_example "Hello"

docker exec -i una-php-1 php /opt/una/scripts/add_lang_key.php ru _sys_example - <<'EOF'
Line one
Line two
EOF
```

Pass `-` as the translation to read stdin. That keeps line breaks; one trailing newline is removed. Add both `en` and `ru` when you introduce a key. Russian may be absent from the database; the Russian XML is still written, and re-running the command after Russian is installed fills the database from that file.
