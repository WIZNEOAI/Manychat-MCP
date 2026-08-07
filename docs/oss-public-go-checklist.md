# OSS public go-checklist (ManyChat MCP)

Local prep for making the OSS runtime public. **Do not execute side-effect steps without explicit Ulises GO.**

## Already done locally (prep)

- [x] Badge + docs test count aligned to **108**
- [x] `package.json` `homepage` → `https://manychat.wizneo.org`
- [x] GitHub Actions CI: lint / test / build on `main` + PRs
- [x] CONTRIBUTING reflects CI + local gate

## Still needs explicit GO

1. **Commit + push** this prep branch/commit to `origin/main` (or PR)
2. Confirm CI green on GitHub
3. **`npm publish`** `mcp-manychat@0.1.0` (package is public-ready; registry currently 404)
4. **`gh repo edit WIZNEOAI/Manychat-MCP --visibility public`** (repo is PRIVATE today)
5. Tag **`v0.1.0`** + GitHub Release notes
6. External smoke as a stranger:
   - clone public repo
   - `npx mcp-manychat --help` / `npx mcp-manychat connect`
   - `npx mcp-manychat doctor` with a throwaway ManyChat test key
7. Optional: set GitHub repo homepage to `https://manychat.wizneo.org`

## Out of scope for OSS track

- Clerk prod / Stripe LIVE / Convex hosted control plane
- Switching `mcp.wizneo.org` to `hosted_token`
- Marketing blast

Those belong to **Track B — hosted prod** and need their own GO sequence.
