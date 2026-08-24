<p align="center">
  <img src="docs/assets/cover.png" alt="ManyChat MCP — una terminal corriendo manychat connect y manychat mcp serve, junto a canales de chat, email y comentarios converge en un chequeo de seguridad" width="100%">
</p>

<h1 align="center">ManyChat MCP</h1>

<p align="center"><strong>Dale a tus agentes de IA superpoderes de ManyChat — sin que le flageen la cuenta.</strong></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL_v3-2DE2C0.svg" alt="Licencia: AGPL v3"></a>
  <a href="docs/deploy/vps-docker.md"><img src="https://img.shields.io/badge/Docker-self--host-ready-2496ED" alt="Docker self-host listo"></a>
  <img src="https://img.shields.io/badge/MCP-2026--07--28-0C0D0F" alt="Protocolo MCP 2026-07-28">
  <img src="https://img.shields.io/badge/tests-110-2DE2C0" alt="110 tests">
</p>

<p align="center"><a href="README.md">English</a> · 🌐 <strong>Español</strong> · <a href="NOTICE.md">Aviso de licencia</a></p>

Un CLI + servidor Model Context Protocol que deja a los agentes de IA — Claude, Cursor, Codex, OpenCode — **operar ManyChat**: leer y segmentar suscriptores, manejar tags y custom fields, enviar flows y mensajes, e inspeccionar una página.

Lo que lo hace distinto: una **capa de validación de política de Meta** integrada. Antes de que un agente envíe algo, `validate_message` lo verifica contra las reglas de ventana de 24 h de ManyChat — para que tu agente no haga que le restrinjan la cuenta. **Ningún otro MCP de ManyChat codifica esa política.**

---

## Corrélo en 60 segundos

```bash
npx mcp-manychat connect
```

Ese único comando te dice dónde sacar tu API key de ManyChat, cómo guardarla para no
perderla, e imprime una config lista para pegar en tu agente. Con `--open` te abre también
la página de registro.

¿Preferís trabajar desde el código?

```bash
git clone https://github.com/WIZNEOAI/Manychat-MCP.git
cd Manychat-MCP
pnpm install && pnpm build
node dist/index.js connect
```

### ¿No querés mantener un servidor?

[manychat.wizneo.org](https://manychat.wizneo.org) hostea el mismo runtime: conectás tu key
de ManyChat una vez, queda cifrada, y obtenés un token MCP revocable para apuntar cualquier
agente. Hay tier gratis.

Es una comodidad, no una versión mejor. Cada tool, cada prompt y el guard de política están
acá, bajo AGPL, para siempre. **El runtime OSS nunca es un demo capado.**

---

### Paso 1 — conseguí tu API key de ManyChat

En ManyChat: **Settings → API → Generate your API Key**. Necesitás cuenta **Pro** de
ManyChat. ([Instrucciones oficiales](https://help.manychat.com/hc/en-us/articles/14959510331420-How-to-generate-a-token-for-the-Manychat-API-and-where-to-get-parameters).)

> **La key se muestra una sola vez.** Copiala antes de cerrar esa pantalla. Si la perdés
> tenés que generar una nueva, y eso invalida la anterior y rompe todo lo que la esté
> usando. La key da acceso total a la página a la que pertenece — tratala como una
> contraseña.

### Paso 2 — guardala como variable de entorno

```bash
export MANYCHAT_API_KEY='mc_tu_key_aca'
```

Eso vive sólo en la terminal actual. Para que quede, agregá esa misma línea a `~/.zshrc`
(macOS) o `~/.bashrc` (Linux), y abrí una terminal nueva.

¿Manejás más de una cuenta de ManyChat? Usá un archivo de perfiles — `~/.manychat/config.json`:

```json
{
  "profiles": {
    "default":  { "apiKey": "mc_tu_key_aca" },
    "clienteA": { "apiKey": "mc_otra_key" }
  }
}
```

Después pasás `--profile clienteA` (o seteás `MANYCHAT_PROFILE=clienteA`).

**No hagas esto:** commitear la key a un repo · pasar `--api-key` en una máquina compartida,
donde queda en el historial de la shell · pegarla en un chat de IA. El servidor MCP la lee
del entorno; nunca necesita aparecer en un mensaje.

### Paso 3 — verificá

```bash
manychat doctor      # chequea la key y la conectividad
manychat page info   # imprime tu página
```

## Conectá tu agente

El servidor MCP corre local por stdio. `manychat connect` te imprime esto ya rellenado con
tus rutas reales, pero como referencia:

**Claude Desktop / Claude Code** (`claude_desktop_config.json` o `.mcp.json`):

```json
{
  "mcpServers": {
    "manychat": {
      "command": "npx",
      "args": ["-y", "mcp-manychat", "mcp", "serve", "--transport", "stdio"],
      "env": { "MANYCHAT_API_KEY": "mc_..." }
    }
  }
}
```

**Cursor** (`~/.cursor/mcp.json`): mismo formato.

**Codex** (`~/.codex/config.toml`):

```toml
[mcp_servers.manychat]
command = "npx"
args = ["-y", "mcp-manychat", "mcp", "serve", "--transport", "stdio"]
env = { MANYCHAT_API_KEY = "mc_..." }
```

¿Trabajás desde un clon en vez de npm? Cambiá `command`/`args` por `"node"` y
`["/ruta/absoluta/a/dist/index.js", "mcp", "serve", "--transport", "stdio"]` — la ruta tiene
que ser absoluta, porque los clientes MCP la resuelven desde su propio directorio de trabajo.

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
manychat connect [--open]      # empezá acá
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

Qué agrega la capa de pago encima de este runtime: una **bóveda cifrada de credenciales** para pegar la key de ManyChat una vez y que no se vuelva a mostrar, **tokens MCP revocables** emitidos por agente en vez de repartir la key cruda, **usage y audit** por workspace, y límites de plan aplicados de verdad.

Tres tiers: **Free** para evaluar, **Supporter** para builders que corren agentes a diario, y **Pro** para agencias y operadores multi-marca. Los precios y los límites por tier viven en la página del producto, que es la única fuente de verdad; este README a propósito no repite números que no puede hacer cumplir.

El control plane es un codebase separado y propietario. Nada de acá depende de él: el gateway le habla por los tres endpoints de [`docs/control-plane-contract.md`](docs/control-plane-contract.md), y sólo si seteás `MCP_REMOTE_AUTH=hosted_token`. Todos los demás modos corren solos.

## Self-host del gateway

Para un MCP remoto multi-tenant persistente, deployá el gateway (`src/`, Dockerfile, `GET /health`) a un host estable — **EasyPanel/VPS** o cualquier plataforma de contenedores. Ver [`docs/deploy/mcp-gateway-vps.md`](docs/deploy/mcp-gateway-vps.md) y [`docs/deploy/vps-docker.md`](docs/deploy/vps-docker.md).

## Desarrollo

```bash
pnpm install
pnpm run lint     # tsc --noEmit
pnpm run build    # tsc
pnpm test         # vitest — 110
```

Los tres tienen que pasar antes de un commit. CI también los corre en pull requests y pushes a `main`. Ver [`CONTRIBUTING.md`](CONTRIBUTING.md) para qué miramos en un cambio, más [`CLAUDE.md`](CLAUDE.md) y [`AGENTS.md`](AGENTS.md).

## Seguridad

- Nunca asumas que un envío es seguro fuera de la ventana de 24 h — usá `validate_message`.
- No uses Message Tags como fallback default de Messenger después del 2026-02-09.
- Read-before-write, verify-after-write para mutaciones.

## Licencia

**[AGPL-3.0-or-later](LICENSE).** Usalo, forkealo, vendé servicios construidos encima —
incluso comercialmente. Lo que la licencia pide a cambio: si corrés una versión
**modificada** como servicio de red, les debés a sus usuarios el código fuente completo de
lo que estás corriendo.

Podés hacer negocio con esto. Lo que no podés es hacerlo cerrado.

Aparte, una licencia de copyright no es una licencia de marca: **Gnosix**, **WIZNEO**,
**Revenue Operator** y nuestra identidad visual quedan reservados. Shipeá tu fork con un
nombre que sea claramente tuyo.

Resumen en lenguaje claro en inglés y español, incluido cómo se manejan las credenciales:
**[NOTICE.md](NOTICE.md)**.

---

Hecho por [Gnosix / WIZNEO](https://wizneo.org). **No afiliado, avalado ni patrocinado por
ManyChat, Inc.** — "ManyChat" es marca de su titular, usada acá sólo para describir con qué
habla este software.
