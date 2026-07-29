## Summary

<!-- What does this PR change and why? -->

## How to test

There is no CI on PRs — run the gate locally and paste the result.

```bash
CI=true pnpm install --frozen-lockfile
pnpm run lint && pnpm test && pnpm run build
```

## Checklist

- [ ] Full gate green locally (see [CONTRIBUTING.md](../CONTRIBUTING.md) for expected test counts)
- [ ] CLI stdout remains JSON where applicable; diagnostics on stderr
- [ ] No new secret logging (API keys, MCP tokens, vault keys, internal shared secrets)
- [ ] Tests added or updated (mocked HTTP only — no live ManyChat calls)
- [ ] Policy wedge (`src/policy/`, `validate_message`) not weakened or bypassed
- [ ] No state introduced that outlives a request in `src/mcp/serve.ts`
- [ ] No limit advertised in copy or docs that no code path enforces

## Screenshots / evidence

<!-- Optional: dashboard or terminal -->
