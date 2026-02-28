# ManyChat MCP Server

Open-source [Model Context Protocol](https://modelcontextprotocol.io/) server that gives AI agents full access to the ManyChat platform. Connect your ManyChat account and let Claude, Cursor, or any MCP-compatible agent manage subscribers, tags, flows, messaging, and more.

## Features

- **24 tools** covering subscribers, tags, custom fields, flows, messaging, and page management
- **8 resources** for account data, schemas, and rate limit references
- **6 prompts** for common automation tasks (onboarding, lead recovery, campaigns, etc.)
- **Dual transport**: stdio for local CLI use, HTTP for remote/Railway deployment
- **Dual auth**: BYO API key or OAuth Connect for multi-user setups
- **Production-ready**: structured logging, retry with backoff, rate limit handling, Docker support

## Quick Start

### 1. Install

```bash
git clone https://github.com/gnosix/manychat-mcp.git
cd manychat-mcp
npm install
npm run build
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env` and add your ManyChat API key:

```
MANYCHAT_API_KEY=your_key_here
```

Find your key at **ManyChat > Settings > API > Generate your API Key** (requires a paid plan).

### 3. Run locally (stdio)

```bash
npm start
```

### 4. Run as HTTP server

```bash
MCP_TRANSPORT=http npm start
```

The server starts on port 3000 (or `$PORT`).

## Connect to Claude Desktop

Add this to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "manychat": {
      "command": "node",
      "args": ["/absolute/path/to/manychat-mcp/dist/index.js"],
      "env": {
        "MANYCHAT_API_KEY": "your_key_here"
      }
    }
  }
}
```

## Connect to Cursor

Add this to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "manychat": {
      "command": "node",
      "args": ["/absolute/path/to/manychat-mcp/dist/index.js"],
      "env": {
        "MANYCHAT_API_KEY": "your_key_here"
      }
    }
  }
}
```

## Connect to a Remote Server (HTTP mode)

For agents connecting to a deployed instance:

```json
{
  "mcpServers": {
    "manychat": {
      "url": "https://your-app.up.railway.app/mcp",
      "headers": {
        "X-ManyChat-API-Key": "your_key_here"
      }
    }
  }
}
```

## Deploy to Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template)

1. Fork this repo.
2. Create a new project on [Railway](https://railway.app).
3. Connect your GitHub repo.
4. Set environment variables:
   - `MANYCHAT_API_KEY` — your ManyChat API key
   - `MCP_TRANSPORT` — `http`
   - `BASE_URL` — your Railway public URL (e.g. `https://your-app.up.railway.app`)
5. Deploy. The health check at `/health` will confirm it's running.

## OAuth Connect (Multi-User)

For multi-user deployments where each user connects their own ManyChat account:

1. Deploy the server in HTTP mode with `BASE_URL` set.
2. MCP clients discover the OAuth endpoints via `/.well-known/oauth-protected-resource`.
3. Users are redirected to a login page where they paste their ManyChat API key.
4. The server issues an OAuth token mapped to their key.
5. The MCP client uses the token for subsequent requests.

No shared API keys needed — each user authenticates independently.

## Available Tools

### Subscribers
| Tool | Description |
|------|-------------|
| `get_subscriber` | Get subscriber info by ID |
| `find_subscriber_by_email` | Find by email |
| `find_subscriber_by_phone` | Find by phone |
| `find_subscriber_by_name` | Find by name (up to 100 results) |
| `create_subscriber` | Create new subscriber |
| `update_subscriber` | Update subscriber data |

### Tags
| Tool | Description |
|------|-------------|
| `list_tags` | List all account tags |
| `create_tag` | Create a new tag |
| `add_tag_to_subscriber` | Add tag by ID |
| `add_tag_to_subscriber_by_name` | Add tag by name |
| `remove_tag_from_subscriber` | Remove tag by ID |
| `remove_tag_from_subscriber_by_name` | Remove tag by name |

### Custom Fields
| Tool | Description |
|------|-------------|
| `list_custom_fields` | List all custom fields |
| `create_custom_field` | Create a new custom field |
| `set_custom_field` | Set field value by ID |
| `set_custom_field_by_name` | Set field value by name |
| `set_custom_fields_bulk` | Set multiple fields at once (max 20) |

### Flows & Messaging
| Tool | Description |
|------|-------------|
| `list_flows` | List all automation flows |
| `send_flow` | Trigger a flow for a subscriber |
| `send_content` | Send rich Dynamic Content |
| `send_text_message` | Send a simple text message |

### Page & System
| Tool | Description |
|------|-------------|
| `get_page_info` | Get bot/page information |
| `list_bot_fields` | List bot-level fields |
| `set_bot_field` | Set a bot field value |
| `list_growth_tools` | List growth tools/widgets |
| `list_otn_topics` | List OTN topics |
| `health_check` | Verify API connection |

## Available Resources

| Resource | URI | Description |
|----------|-----|-------------|
| Page Info | `manychat://page/info` | Bot information |
| Tags | `manychat://tags/all` | All tags |
| Custom Fields | `manychat://fields/custom` | Custom field definitions |
| Bot Fields | `manychat://fields/bot` | Bot system fields |
| Flows | `manychat://flows/all` | All automation flows |
| OTN Topics | `manychat://otn/topics` | Notification topics |
| Subscriber Schema | `manychat://schema/subscriber` | Schema docs |
| API Limits | `manychat://meta/limits` | Rate limit reference |

## Available Prompts

| Prompt | Description |
|--------|-------------|
| `onboard_subscriber` | Step-by-step new lead onboarding |
| `recover_lead` | Re-engage inactive subscribers |
| `send_campaign` | Orchestrate targeted campaigns |
| `analyze_subscriber` | Deep profile analysis |
| `segment_audience` | Smart audience segmentation |
| `diagnose_automation` | Debug automation issues |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MANYCHAT_API_KEY` | Yes (stdio) | — | Your ManyChat API key |
| `MCP_TRANSPORT` | No | `stdio` | Transport mode: `stdio` or `http` |
| `PORT` | No | `3000` | HTTP server port |
| `BASE_URL` | No | `http://localhost:3000` | Public URL (for OAuth) |
| `NODE_ENV` | No | `development` | Environment |
| `LOG_LEVEL` | No | `info` | Logging level: `debug`, `info`, `warn`, `error` |

## Development

```bash
npm run dev      # Run with tsx (hot reload)
npm run build    # Compile TypeScript
npm run lint     # Type check without emitting
npm test         # Run tests
```

## License

MIT — see [LICENSE](LICENSE).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
