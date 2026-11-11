# n8n — your own HTTP server

First [self-host your own remote](../self-host.md). No public WIZNEO gateway is offered. Docker/HTTP deployment is unverified; infrastructure needs its own validation and owner approval. A suitable paid ManyChat API plan is separate from this software.

The **user**, outside agent chat, creates a Header Auth credential in n8n's credential store:

- Header name: `X-ManyChat-API-Key`.
- Value: the user's ManyChat key, entered directly in the credential UI/secret integration, not supplied to an agent.

In an MCP Client / MCP Client Tool node:

- Transport: Streamable HTTP.
- URL: `https://YOUR-SERVER/mcp` (your server).
- Authentication: the saved Header Auth credential.
- First authorized tool: `get_page_info`, `{}` (read-only).

Attach the credential on **every** `/mcp` request. Keep it out of node text, expressions visible in exports, CLI arguments, workflow JSON and logs. Do not ask the agent to read/export the credential. HTTP never falls back to a server environment API key. This setup assumes `manychat_header` mode; OAuth is a separate exclusive mode and cannot be bypassed by this header.

Published 0.2.0 supports reads/CRM inspection. Sends and guarded writes fail closed; no evidence provider is shipped. Never send/mutate as a setup test. No live n8n-version test is claimed. Rotate any accidentally exposed credential.
