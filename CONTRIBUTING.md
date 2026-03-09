# Contributing to ManyChat MCP

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/gnosix/manychat-mcp.git
cd manychat-mcp
npm install
cp .env.example .env
# Edit .env with your ManyChat API key
npm run dev
```

## Project Structure

```
src/
  index.ts              # Entry point (stdio + HTTP transports)
  server.ts             # MCP server factory
  auth/
    manychat-client.ts  # ManyChat API HTTP client
    oauth.ts            # OAuth token store
    oauth-routes.ts     # OAuth endpoints + auth page
  tools/                # MCP tools grouped by domain
  resources/            # MCP resources (read-only data)
  prompts/              # MCP prompt templates
  lib/                  # Utilities (logger, etc.)
  types/                # TypeScript type definitions
```

## Adding a New Tool

1. Pick the right domain file in `src/tools/` (or create one).
2. Register your tool with `server.tool()` inside the register function.
3. Use `client.get()` or `client.post()` to call the ManyChat API.
4. Add a clear description so agents understand what the tool does.
5. Run `npm run lint` and `npm run build` to verify.

## Pull Request Process

1. Fork the repo and create your branch from `main`.
2. Make your changes with clear commit messages.
3. Ensure `npm run lint` and `npm run build` pass.
4. Open a PR with a description of what and why.

## Skills in this repo

This repo includes `skills/manychat-mcp-ops` for agent operations.

- Keep `SKILL.md` concise and procedural
- Put detailed guidance in `references/`
- Put deterministic checks in `scripts/`
- Validate scripts by running them locally before opening PRs

## Code Style

- TypeScript strict mode.
- No `any` types unless absolutely necessary.
- Tool descriptions should be clear and agent-friendly.
- Keep the ManyChat client as the single point of API contact.

## Reporting Issues

Open a GitHub issue with:
- What you expected vs. what happened.
- Steps to reproduce.
- Your Node.js version and transport mode (stdio/http).
