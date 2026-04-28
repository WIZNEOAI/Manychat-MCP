## Summary

<!-- What does this PR change and why? -->

## How to test

```bash
npm run lint && npm test && npm run build
npm run web:lint && npm run web:test && npm run web:build
```

## Checklist

- [ ] CLI stdout remains JSON where applicable; diagnostics on stderr
- [ ] No new secret logging (API keys, MCP tokens, vault keys, internal shared secrets)
- [ ] Tests added or updated (mocked HTTP only in CI)
- [ ] `apps/web` changes follow `apps/web/AGENTS.md` if touched

## Screenshots / evidence

<!-- Optional: dashboard or terminal -->
