# ManyChat CLI

CLI-first toolkit for operating ManyChat through the Account Public API.

Primary product:
- `manychat` CLI
- API-key-first auth
- JSON-first output for agents, scripts, and operators

Compatibility product:
- MCP server through `manychat mcp serve`

## Official source of truth

This repo is grounded in official ManyChat documentation:

- API key generation and parameter discovery:
  https://help.manychat.com/hc/en-us/articles/14959510331420-How-to-generate-a-token-for-the-Manychat-API-and-where-to-get-parameters
- App-based API access model, documented only as a v1 boundary:
  https://help.manychat.com/hc/en-us/articles/14281269835548-Dev-Program-Obtaining-API-Access-through-Apps
- Messaging windows and policy constraints:
  https://help.manychat.com/hc/en-us/articles/23358636027932-Understanding-messaging-windows
  https://help.manychat.com/hc/en-us/articles/14281199732892-How-to-send-messages-outside-the-24-hour-and-7-day-windows-in-Messenger-and-Instagram

## Quick start

```bash
git clone https://github.com/gnosix/manychat-mcp.git
cd manychat-mcp
npm install
npm run build
```

Set your API key:

```env
MANYCHAT_API_KEY=your_key_here
```

Run a health check:

```bash
node dist/index.js doctor
```

Read page info:

```bash
node dist/index.js page info
```

List tags:

```bash
node dist/index.js tags list
```

## CLI surface

Core commands:

- `manychat doctor`
- `manychat page info`
- `manychat tags list|create`
- `manychat fields list|create|set|set-bulk`
- `manychat flows list|send`
- `manychat subscribers get|find|create|update`
- `manychat subscribers tags add|remove`
- `manychat send text|content`
- `manychat raw get|post`

Global flags:

- `--api-key`
- `--profile`
- `--base-url`
- `--json`
- `--pretty`
- `--verbose`
- `--quiet`

Output contract:

- JSON on `stdout`
- diagnostics on `stderr`
- exit codes:
  - `0` success
  - `2` invalid input
  - `3` auth/config error
  - `4` ManyChat API error
  - `5` rate limit or retry exhaustion

## Agent documentation

Read these files in order:

1. `AGENTS.md`
2. `docs/context/product-baseline.md`
3. `docs/context/manychat-official-baseline.md`
4. `docs/context/cli-spec.md`
5. `docs/context/safety-model.md`
6. `docs/context/mcp-migration-map.md`

## MCP compatibility mode

Legacy MCP serving remains available:

```bash
node dist/index.js mcp serve --transport stdio
```

HTTP compatibility mode:

```bash
MCP_TRANSPORT=http node dist/index.js mcp serve --port 3000
```

Legacy HTTP auth behavior remains:

- `Authorization: Bearer <mcp_access_token>`
- `X-ManyChat-API-Key: <manychat_api_key>`

Treat this as compatibility behavior, not the primary product flow.

## Endpoint references

- Legacy endpoint-to-MCP mapping: `docs/manychat-endpoint-matrix.md`
- MCP-to-CLI migration map: `docs/context/mcp-migration-map.md`
- Skills bundle for operational agents: `skills/manychat-mcp-ops`
- Open-source + SaaS product blueprint: `docs/open-source-saas-blueprint.md`

## Safety notes

- Do not assume automated messages are safe outside the 24-hour window.
- Do not treat Message Tags as the default Messenger fallback after February 9, 2026.
- Prefer read-before-write and verify-after-write for all mutating workflows.

## Development

```bash
npm run lint
npm test
npm run build
```

## License

MIT. See `LICENSE`.
