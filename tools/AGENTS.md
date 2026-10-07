# Tools

CLI MCP servers for coding agents. Run them inside the `php` service from the repository root, with the stack up (`docker compose up -d`).

Each file is an MCP server (stdio, protocol `2026-07-28`). Messages are one JSON-RPC object per line. Every request includes `_meta.io.modelcontextprotocol/protocolVersion` (`2026-07-28`) and `_meta.io.modelcontextprotocol/clientCapabilities`. The server answers `server/discover`, `tools/list`, and `tools/call`.

## Language keys

`add_lang_key.php` adds a missing English or Russian string. Do not insert keys by hand into language XML, `sys_localization_keys`, or `sys_localization_strings`. Read [`.agents/skills/language-keys/SKILL.md`](../.agents/skills/language-keys/SKILL.md) before adding one.

It writes the key into the language XML next to the closest existing keys, inserts it into the database when that language is installed, and recompiles the language cache. An existing translation is left unchanged.

```bash
docker compose exec -T -w /opt/una php php tools/add_lang_key.php <<'EOF'
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"add","arguments":{"language":"en","key":"_sys_example","translation":"Hello"},"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientCapabilities":{}}}}
EOF
```

A successful `add` result has `content` (a short status) and `structuredContent` (`file`, `xml` of `added` or `already_present`, `keptExisting`, `languageInstalled`, `keyCreated`, `translationStatus` of `added`, `already_present`, or `skipped`, `keyId`, `category`, `recompiled`). A failure comes back as `isError: true`. When the language is not installed, the XML is still written and `languageInstalled` is false.

## Database

`db.php` queries the installed UNA database. It reads the host, name, user, and password from `inc/header.inc.php` and connects directly. Run it inside the `php` service so that host (`mysql`) resolves. A `tools/call` of the `query` tool runs the statement on the live database for this instance.

```bash
docker compose exec -T -w /opt/una php php tools/db.php <<'EOF'
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"query","arguments":{"sql":"SELECT id, name FROM sys_modules LIMIT 5"},"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientCapabilities":{}}}}
EOF
```

A successful `query` result has `content` (tab-separated text; the word `NULL` stands for a null) and `structuredContent.results` (column names and rows, JSON `null` for a null). Several statements separated by semicolons are allowed. A statement that changes rows reports `affected`. A SQL failure comes back as `isError: true`.
