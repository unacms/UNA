---
name: language-keys
description: Add a missing English or Russian UNA string with tools/add_lang_key.php, an MCP server (stdio, protocol 2026-07-28) that updates the language XML, the database, and the language cache. Use when introducing a user-facing string, language key, or translation. Do not insert keys by hand into language XML, sys_localization_keys, or sys_localization_strings.
---

# Language keys

Add a missing English or Russian string with `tools/add_lang_key.php`. Do not insert keys by hand into language XML, `sys_localization_keys`, or `sys_localization_strings`.

The file is an MCP server (stdio, protocol `2026-07-28`). Run it in the php container from the UNA root. A `tools/call` of the `add` tool takes `language` (`en` or `ru`), `key`, and `translation`. An existing translation is left unchanged. The tool inserts the key in the right language file next to the closest existing keys (`_sys_…` to system, `_bx_posts_…` to Posts, and so on), inserts it into the database when that language is installed, and recompiles the language cache.

Pass `module` when the key prefix does not name the module (`_bx_orgs_` belongs to `bx_organizations`).

Every request includes `_meta.io.modelcontextprotocol/protocolVersion` (`2026-07-28`) and `_meta.io.modelcontextprotocol/clientCapabilities`.

```bash
docker compose exec -T -w /opt/una php php tools/add_lang_key.php <<'EOF'
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"add","arguments":{"language":"en","key":"_sys_example","translation":"Hello"},"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientCapabilities":{}}}}
EOF
```

A translation may contain line breaks inside the JSON string. Add both `en` and `ru` when you introduce a key. Russian may be absent from the database; the Russian XML is still written (`languageInstalled` is false), and calling the tool again after Russian is installed fills the database from that file.

A successful result has `content` and `structuredContent` (`file`, `xml` of `added` or `already_present`, `keptExisting`, `languageInstalled`, `keyCreated`, `translationStatus` of `added`, `already_present`, or `skipped`, `keyId`, `category`, `recompiled`). A failure comes back as `isError: true`.
