# Agent Entry Point

This repository is a CLI-first ManyChat toolkit.

Primary product:
- `manychat` CLI
- API-key-first access to the ManyChat Account Public API
- JSON-first output for automation and agent consumption

Secondary product:
- MCP compatibility mode through `manychat mcp serve`

Read in this order:
1. `README.md`
2. `docs/context/product-baseline.md`
3. `docs/context/manychat-official-baseline.md`
4. `docs/context/cli-spec.md`
5. `docs/context/safety-model.md`
6. `docs/context/mcp-migration-map.md`

Core rules:
- Treat `API Key` auth as the default and only supported auth path for the CLI.
- Treat MCP OAuth, Redis token stores, and HTTP MCP sessions as legacy compatibility concerns.
- Prefer read-before-write and verify-after-write when calling mutating commands.
- Do not assume messages can be sent outside channel policy windows.
- Keep stdout machine-readable. Put diagnostics on stderr.

Primary CLI surface:
- `manychat doctor`
- `manychat page info`
- `manychat tags list|create`
- `manychat fields list|create|set|set-bulk`
- `manychat flows list|send`
- `manychat subscribers get|find|create|update`
- `manychat subscribers tags add|remove`
- `manychat send text|content`
- `manychat raw get|post`
- `manychat mcp serve`

Non-goals for v1:
- Native ManyChat app distribution via `App Key`
- CLI-managed OAuth login flows
- Promising deliverability outside ManyChat and Meta policy windows
