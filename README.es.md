# ManyChat MCP

**Dale a tus agentes de IA superpoderes de ManyChat.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-self--host-ready-2496ED)](docs/deploy/vps-docker.md)

[English](README.md) · 🌐 **Español**

Un servidor CLI + Model Context Protocol (MCP) que deja a los agentes de IA — Claude, Cursor, Codex, OpenCode — **operar ManyChat**: leer y segmentar suscriptores, manejar tags y custom fields, enviar flows y mensajes, e inspeccionar una página.

Lo que lo hace distinto: una **capa de validación de política de Meta** integrada. Antes de que un agente envíe algo, `validate_message` lo verifica contra las reglas de ventana de 24 h de ManyChat — para que tu agente no haga que le flageen la cuenta. **Ningún otro MCP de ManyChat codifica esa política.**

> Open-source y self-hosteable para siempre (CLI + MCP). Un control plane hosted opcional — **Revenue Operator** — agrega un vault cifrado, MCP tokens hosted, usage/audit y billing encima. El runtime OSS nunca es un demo capado.

---

## Instalación en 60 segundos

```bash
git clone https://github.com/WIZNEOAI/Manychat-MCP.git
cd Manychat-MCP
pnpm install
pnpm build
```

Configurá tu API key de ManyChat ([cómo generarla](https://help.manychat.com/hc/en-us/articles/14959510331420-How-to-generate-a-token-for-the-Manychat-API-and-where-to-get-parameters)):

```bash
export MANYCHAT_API_KEY=mc_...
```

Verificá:

```bash
node dist/index.js doctor      # chequea key + conectividad
node dist/index.js page info   # imprime tu página
```

## Conectá tu agente

El servidor MCP corre local por stdio. Apuntá cualquier cliente MCP a él.

**Claude Desktop / Claude Code** (`claude_desktop_config.json` o `.mcp.json`):

```json
{
  "mcpServers": {
    "manychat": {
      "command": "node",
      "args": ["/ruta/absoluta/a/Manychat-MCP/dist/index.js", "mcp", "serve", "--transport", "stdio"],
      "env": { "MANYCHAT_API_KEY": "mc_..." }
    }
  }
}
```

**Cursor** (`~/.cursor/mcp.json`): mismo formato.

**Codex** (`~/.codex/config.toml`):

```toml
[mcp_servers.manychat]
command = "node"
args = ["/ruta/absoluta/a/Manychat-MCP/dist/index.js", "mcp", "serve", "--transport", "stdio"]
env = { MANYCHAT_API_KEY = "mc_..." }
```

Los modos remoto (HTTP) y hosted-token están en [`docs/connect/mcp-clients.md`](docs/connect/mcp-clients.md).

## Qué obtiene tu agente

**28 tools** — toda la superficie de operación:

| Grupo | Tools |
|---|---|
| Página y política | `get_page_info`, `validate_message` (el wedge de política), `health_check`, `list_bot_fields`, `set_bot_field`, `list_growth_tools`, `list_otn_topics` |
| Suscriptores | `get_subscriber`, `find_subscriber_by_email`, `find_subscriber_by_phone`, `find_subscriber_by_name`, `create_subscriber`, `update_subscriber`, `add_tag_to_subscriber`(`_by_name`), `remove_tag_from_subscriber`(`_by_name`) |
| Tags | `list_tags`, `create_tag` |
| Custom fields | `list_custom_fields`, `create_custom_field`, `set_custom_field`(`_by_name`), `set_custom_fields_bulk` |
| Flows | `list_flows`, `send_flow` |
| Mensajería | `send_content`, `send_text_message` |

**6 prompts** (playbooks listos): `onboard_subscriber`, `recover_lead`, `send_campaign`, `analyze_subscriber`, `segment_audience`, `diagnose_automation`.

**8 resources** (contexto en vivo): `page-info`, `tag-catalog`, `custom-fields-catalog`, `bot-fields`, `flow-catalog`, `otn-topics`, `subscriber-schema`, `api-limits`.

## El wedge de política

Meta aplica ventanas de mensajería estrictas (regla de 24 h, límites de message tags). Un agente que envía a ciegas termina con la cuenta restringida. Antes de cualquier envío, llamá:

```jsonc
validate_message({ subscriberId, channel, payload })
// → { allowed: boolean, reason, window, suggestion }
```

Verifica la ventana de última interacción del suscriptor y la política del canal, y le dice al agente si el envío es seguro — y si no, qué hacer en su lugar. Este guard es el diferenciador central y se queda en la capa OSS.

## Agent skills

Dos skills instalables que envuelven workflows comunes de operador:

- **`manychat-operator`** — operación día a día de la cuenta
- **`manychat-growth-engine`** — loops de captura → nurture → recuperación de leads

Ver [`docs/connect/agent-skills.md`](docs/connect/agent-skills.md). Las skills viven en [`skills/`](skills/).

## CLI

La CLI es la fuente de verdad; MCP reusa la misma capa de ejecución.

```
manychat doctor
manychat page info
manychat tags list|create
manychat fields list|create|set|set-bulk
manychat flows list|send
manychat subscribers get|find|create|update
manychat subscribers tags add|remove
manychat send text|content
manychat raw get|post
manychat mcp serve
```

Contrato de salida: JSON en `stdout`, diagnósticos en `stderr`. Exit codes: `0` ok · `2` input inválido · `3` auth/config · `4` error de API · `5` rate limit.

## Hosted (Revenue Operator)

¿No querés self-hostear? El control plane hosted te deja pegar una key de ManyChat una vez (guardada cifrada), emitir MCP tokens, y conectar cualquier agente sin manejar un servidor — más usage y audit.

Tres tiers: **Free** para evaluar, **Supporter** para builders que corren agentes a diario, y **Pro** para agencias y operadores multi-marca. Los precios y los límites por tier viven en la página del producto, que es la única fuente de verdad; este README a propósito no repite números que no puede hacer cumplir.

El control plane es un codebase separado y propietario. Nada de acá depende de él: el gateway le habla por los tres endpoints de [`docs/control-plane-contract.md`](docs/control-plane-contract.md), y sólo si seteás `MCP_REMOTE_AUTH=hosted_token`. Todos los demás modos corren solos.

## Self-host del gateway

Para un MCP remoto multi-tenant persistente, deployá el gateway (`src/`, Dockerfile, `GET /health`) a un host estable — **EasyPanel/VPS** o cualquier plataforma de contenedores. Ver [`docs/deploy/mcp-gateway-vps.md`](docs/deploy/mcp-gateway-vps.md) y [`docs/deploy/vps-docker.md`](docs/deploy/vps-docker.md).

## Desarrollo

```bash
pnpm install
pnpm run lint     # tsc --noEmit
pnpm run build    # tsc
pnpm test         # vitest — 91
```

Los tres tienen que pasar antes de un commit; no hay CI en los pull requests. Ver [`CONTRIBUTING.md`](CONTRIBUTING.md) para qué miramos en un cambio, más [`CLAUDE.md`](CLAUDE.md) y [`AGENTS.md`](AGENTS.md).

## Seguridad

- Nunca asumas que un envío es seguro fuera de la ventana de 24 h — usá `validate_message`.
- No uses Message Tags como fallback default de Messenger después del 2026-02-09.
- Read-before-write, verify-after-write para mutaciones.

## Licencia

[AGPL-3.0-or-later](LICENSE). Self-hosteá libremente; el uso en red debe compartir el código fuente.

---

Hecho por [Gnosix / WIZNEO](https://wizneo.org). No afiliado a ManyChat.
