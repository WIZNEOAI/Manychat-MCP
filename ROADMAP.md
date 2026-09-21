# Roadmap

This repository is the **OSS self-host runtime**: CLI, MCP (stdio + HTTP), policy wedge,
agent skills, and deploy guides. A hosted control plane lives in a private repository and
is **not open**. Do not treat this repo as that product.

## In progress / beta

- OSS runtime: CLI, MCP local/remote, and self-host deployment guides stay broadly usable
- Gateway: `hosted_token` mode stays available for operators who run their own control plane
- Docs: self-host deploy guides (Docker, VPS, Railway)

## Next

- Durable or Redis-backed rate limits for the gateway's internal routes
- More channels in the policy wedge, and tighter WhatsApp template handling
- n8n webhook nodes and playbook templates

## Non-goals (v1)

- ManyChat “App Key” native app distribution
- OAuth as the primary CLI auth story
- Promising message delivery outside ManyChat / Meta policy windows
- Shipping a public BYOK gateway or a hosted sign-up on the OSS landing

This runtime works standalone. The policy wedge stays in the OSS layer. See
[docs/control-plane-contract.md](docs/control-plane-contract.md) for the optional HTTP seam
to a private control plane (`MCP_REMOTE_AUTH=hosted_token` only).
