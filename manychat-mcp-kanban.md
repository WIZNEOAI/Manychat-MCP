# 🚀 ManyChat MCP Server — Kanban de Acción & Arquitectura

> **Objetivo:** MCP Server open-source, production-ready, deployable en Railway.
> Los usuarios aportan su propia API Key de ManyChat → los agentes AI tienen acceso completo a toda la plataforma.

---

## 🏗️ ARQUITECTURA TÉCNICA

### Stack Decisión: **TypeScript + MCP SDK oficial**

| Criterio | TypeScript | Python |
|---|---|---|
| MCP SDK oficial | ✅ Primario | ✅ Secundario |
| Type safety para API | ✅ Excelente | Moderado |
| Deploy Railway | ✅ Native | ✅ Funciona |
| Ecosistema MCP | ✅ Mejor soporte | Bueno |
| Zod schema validation | ✅ Built-in | Pydantic |

**Decisión: TypeScript con `@modelcontextprotocol/sdk`**

---

### Estructura de Proyecto

```
manychat-mcp/
├── src/
│   ├── index.ts                    # Entry point, servidor MCP
│   ├── server.ts                   # Configuración MCP Server
│   ├── auth/
│   │   └── manychat-client.ts      # HTTP client autenticado
│   ├── tools/                      # MCP Tools (acciones)
│   │   ├── subscribers/
│   │   │   ├── get-subscriber.ts
│   │   │   ├── find-subscriber.ts
│   │   │   ├── create-subscriber.ts
│   │   │   └── update-subscriber.ts
│   │   ├── flows/
│   │   │   ├── list-flows.ts
│   │   │   ├── run-flow.ts
│   │   │   └── send-flow.ts
│   │   ├── messages/
│   │   │   ├── send-message.ts
│   │   │   ├── send-content.ts
│   │   │   └── send-dynamic.ts
│   │   ├── tags/
│   │   │   ├── list-tags.ts
│   │   │   ├── add-tag.ts
│   │   │   └── remove-tag.ts
│   │   ├── custom-fields/
│   │   │   ├── list-fields.ts
│   │   │   └── set-field.ts
│   │   ├── otn/
│   │   │   └── create-otn.ts
│   │   └── broadcasting/
│   │       └── send-broadcast.ts
│   ├── resources/                  # MCP Resources (datos accesibles)
│   │   ├── page-info.ts            # Info del Page de ManyChat
│   │   ├── subscriber-schema.ts    # Schema de suscriptor
│   │   ├── flow-catalog.ts         # Catálogo de flows disponibles
│   │   ├── tag-catalog.ts          # Catálogo de tags
│   │   └── custom-fields-catalog.ts
│   ├── prompts/                    # MCP Prompts (templates)
│   │   ├── onboard-subscriber.ts
│   │   ├── recover-lead.ts
│   │   ├── segment-audience.ts
│   │   ├── send-campaign.ts
│   │   └── analyze-subscriber.ts
│   ├── schemas/                    # Zod schemas
│   │   ├── subscriber.ts
│   │   ├── flow.ts
│   │   ├── message.ts
│   │   └── common.ts
│   └── types/
│       └── manychat.ts             # Types globales
├── tests/
│   ├── tools.test.ts
│   └── integration.test.ts
├── .env.example
├── railway.toml
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

---

### Cómo funciona la API Key

El servidor acepta la API key de ManyChat de **dos formas**:

1. **Variable de entorno:** `MANYCHAT_API_KEY=tu_key` (para Railway deploy personal)
2. **Header por request:** `X-ManyChat-API-Key: tu_key` (para uso multi-tenant)

```typescript
// src/auth/manychat-client.ts
const apiKey = process.env.MANYCHAT_API_KEY || request.headers['x-manychat-api-key'];
```

Esto permite tanto uso personal (una sola cuenta) como ofrecer el MCP como servicio a múltiples clientes.

---

## 📋 KANBAN DE ACCIÓN

---

### 📌 BACKLOG

| ID | Tarea | Prioridad |
|---|---|---|
| B-01 | Research ManyChat API docs completo (v2) | 🔴 Alta |
| B-02 | Definir Railway deployment config | 🔴 Alta |
| B-03 | Setup GitHub repo + CI/CD | 🟡 Media |
| B-04 | Documentar todos los endpoints disponibles | 🟡 Media |
| B-05 | Tests de integración con sandbox | 🟡 Media |
| B-06 | Escribir README open-source | 🟢 Baja |
| B-07 | Agregar ejemplos de uso con Claude Desktop | 🟢 Baja |

---

### 🔵 SPRINT 1 — Foundation (Días 1-3)

**Goal:** Servidor MCP funcional con auth y primer tool operativo.

| ID | Tarea | Descripción |
|---|---|---|
| S1-01 | Init proyecto TypeScript | `npm init`, tsconfig, dependencias base |
| S1-02 | Instalar MCP SDK | `@modelcontextprotocol/sdk`, `zod`, `axios` |
| S1-03 | Crear MCP Server base | `StdioServerTransport` + `HttpServerTransport` |
| S1-04 | Crear `ManyChat Client` | Wrapper HTTP con auth, error handling, retry |
| S1-05 | Tool: `get_subscriber` | Primer tool funcional con schema Zod |
| S1-06 | Tool: `find_subscriber` | Buscar por email/phone |
| S1-07 | Resource: `page_info` | Info de la página conectada |
| S1-08 | Test manual con Claude Desktop | Verificar que el server responde |

**Dependencias:**
```json
{
  "@modelcontextprotocol/sdk": "^1.0.0",
  "zod": "^3.22.0",
  "axios": "^1.6.0",
  "dotenv": "^16.0.0"
}
```

---

### 🟣 SPRINT 2 — Core Tools (Días 4-7)

**Goal:** Cobertura completa de Subscribers, Tags y Custom Fields.

| ID | Tarea | Endpoint ManyChat |
|---|---|---|
| S2-01 | Tool: `create_subscriber` | POST /subscriber/createSubscriber |
| S2-02 | Tool: `update_subscriber` | POST /subscriber/updateSubscriber |
| S2-03 | Tool: `list_tags` | GET /fb-page/getTags |
| S2-04 | Tool: `add_tag_to_subscriber` | POST /subscriber/addTag |
| S2-05 | Tool: `remove_tag_from_subscriber` | POST /subscriber/removeTag |
| S2-06 | Tool: `list_custom_fields` | GET /fb-page/getCustomFields |
| S2-07 | Tool: `set_custom_field` | POST /subscriber/setCustomField |
| S2-08 | Resource: `tag_catalog` | Lista de tags de la página |
| S2-09 | Resource: `custom_fields_catalog` | Schema de campos custom |
| S2-10 | Schemas Zod completos | subscriber, tag, field |

---

### 🟠 SPRINT 3 — Flows & Messaging (Días 8-12)

**Goal:** Capacidad de ejecutar flows y enviar mensajes desde agentes.

| ID | Tarea | Endpoint ManyChat |
|---|---|---|
| S3-01 | Tool: `list_flows` | GET /fb-page/getFlows |
| S3-02 | Tool: `run_flow` | POST /subscriber/sendFlow |
| S3-03 | Tool: `send_content` | POST /sending/sendContent |
| S3-04 | Tool: `send_dynamic_block` | POST /sending/sendDynamicBlock |
| S3-05 | Tool: `send_otn_message` | OTN (One Time Notification) |
| S3-06 | Resource: `flow_catalog` | Lista de flows disponibles |
| S3-07 | Prompt: `onboard_subscriber` | Template para onboarding |
| S3-08 | Prompt: `recover_lead` | Template para reactivar leads |
| S3-09 | Prompt: `send_campaign` | Template para enviar campañas |

---

### 🟡 SPRINT 4 — Prompts & Context Avanzado (Días 13-16)

**Goal:** Prompts listos para agentes especializados en marketing automation.

| ID | Tarea | Descripción |
|---|---|---|
| S4-01 | Prompt: `analyze_subscriber` | Analizar perfil y comportamiento |
| S4-02 | Prompt: `segment_audience` | Segmentar por tags/campos |
| S4-03 | Prompt: `create_automation_strategy` | Estrategia de automación |
| S4-04 | Prompt: `diagnose_flow` | Debuggear un flow |
| S4-05 | Context tool: `get_account_overview` | Resumen completo de la cuenta |
| S4-06 | Context tool: `get_subscriber_journey` | Historial de un suscriptor |
| S4-07 | Resource: `subscriber_schema_docs` | Docs del schema para agentes |

---

### 🔴 SPRINT 5 — Production & Railway Deploy (Días 17-20)

**Goal:** Deploy en Railway, listo para producción.

| ID | Tarea | Descripción |
|---|---|---|
| S5-01 | Crear `railway.toml` | Config de deploy |
| S5-02 | Variables de entorno Railway | `MANYCHAT_API_KEY`, `PORT`, `NODE_ENV` |
| S5-03 | Health check endpoint | GET /health para Railway |
| S5-04 | Rate limiting | Respetar límites de ManyChat API |
| S5-05 | Error handling robusto | Retry logic, mensajes claros |
| S5-06 | Logging estructurado | Para debugging en producción |
| S5-07 | Dockerfile | Para builds reproducibles |
| S5-08 | GitHub Actions CI | Test en cada PR |
| S5-09 | Primer deploy exitoso | Verificar URL pública |
| S5-10 | Documentar configuración Railway | README paso a paso |

---

### 🟢 SPRINT 6 — Open Source Launch (Días 21-25)

**Goal:** Repositorio público, documentado y usable por la comunidad.

| ID | Tarea | Descripción |
|---|---|---|
| S6-01 | README.md completo | Instalación, uso, ejemplos |
| S6-02 | CONTRIBUTING.md | Guía para contribuidores |
| S6-03 | LICENSE | MIT License |
| S6-04 | Ejemplos de uso | Claude Desktop, API directa |
| S6-05 | Smithery.ai publish | Directorio oficial de MCP servers |
| S6-06 | glama.ai publish | Otro directorio MCP |
| S6-07 | Post en X/Twitter | Anuncio open-source |
| S6-08 | Demo video | Show don't tell |

---

## 🔧 CONFIGURACIÓN TÉCNICA CLAVE

### railway.toml

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "always"

[[services]]
name = "manychat-mcp"
```

### .env.example

```env
# Tu API Key de ManyChat (obligatorio)
MANYCHAT_API_KEY=your_manychat_api_key_here

# Puerto del servidor (Railway lo asigna automáticamente)
PORT=3000

# Modo de transporte: stdio | http
MCP_TRANSPORT=http

# Ambiente
NODE_ENV=production
```

### Transports disponibles

```typescript
// Para Claude Desktop (local) → STDIO
// Para Railway + agentes remotos → HTTP/SSE

const transport = process.env.MCP_TRANSPORT === 'http' 
  ? new StreamableHTTPServerTransport({ port: Number(process.env.PORT) || 3000 })
  : new StdioServerTransport();
```

---

## 📦 TOOLS COMPLETAS (Referencia)

### Subscribers (8 tools)
- `get_subscriber` — Obtener suscriptor por ID
- `find_subscriber` — Buscar por email o teléfono
- `create_subscriber` — Crear nuevo suscriptor
- `update_subscriber` — Actualizar datos
- `add_tag` — Agregar tag a suscriptor
- `remove_tag` — Remover tag
- `set_custom_field` — Asignar valor a campo custom
- `get_subscriber_bot_fields` — Obtener campos del bot

### Flows & Messaging (5 tools)
- `list_flows` — Listar todos los flows del bot
- `run_flow` — Ejecutar flow sobre un suscriptor
- `send_content` — Enviar contenido específico
- `send_dynamic_block` — Enviar bloque dinámico
- `send_otn` — Enviar notificación OTN

### Page/Bot (4 tools)
- `get_page_info` — Info del bot/página
- `list_tags` — Todos los tags disponibles
- `list_custom_fields` — Todos los campos custom
- `get_bot_fields` — Campos del bot

### Utilities (2 tools)
- `get_account_overview` — Resumen ejecutivo de la cuenta
- `health_check` — Verificar conexión con ManyChat

---

## 📖 RESOURCES COMPLETAS

| Resource | URI | Descripción |
|---|---|---|
| Page Info | `manychat://page/info` | Datos del bot conectado |
| Tag Catalog | `manychat://tags/all` | Lista de todos los tags |
| Custom Fields | `manychat://fields/custom` | Schema de campos custom |
| Bot Fields | `manychat://fields/bot` | Campos del sistema |
| Flow Catalog | `manychat://flows/all` | Todos los flows disponibles |
| Subscriber Schema | `manychat://schema/subscriber` | Documentación del schema |
| API Limits | `manychat://meta/limits` | Rate limits actuales |

---

## 💬 PROMPTS INCLUIDOS

| Prompt | Uso |
|---|---|
| `onboard_subscriber` | Onboarding paso a paso de nuevo lead |
| `recover_lead` | Reactivar suscriptor inactivo |
| `send_campaign` | Orquestar envío de campaña |
| `analyze_subscriber` | Análisis profundo de perfil |
| `segment_audience` | Crear segmentación inteligente |
| `diagnose_automation` | Debug de una automatización |
| `create_flow_strategy` | Diseñar estrategia de flow |

---

## 🎯 CASOS DE USO PARA GNOSIX

Con este MCP server, puedes ofrecer a clientes:

1. **Agente de Gestión de Leads** → Usa `find_subscriber` + `add_tag` + `run_flow` para calificar y enrutar leads automáticamente
2. **Agente de Seguimiento Post-Consulta** → Usa `send_content` + `set_custom_field` para personalizar mensajes
3. **Agente de Análisis de Audiencia** → Usa `get_account_overview` + resources para reportes automáticos
4. **Agente de Campañas Inteligentes** → Usa `segment_audience` prompt + `send_campaign` para targeting preciso

---

## 📅 TIMELINE RESUMEN

```
Semana 1: Foundation + Core Tools (Sprints 1-2)
Semana 2: Flows + Prompts + Context (Sprints 3-4)
Semana 3: Deploy Railway + Open Source (Sprints 5-6)
```

**Total estimado: 3 semanas para MVP open-source production-ready.**

---

*Generado para Gnosix — ManyChat MCP Server Open Source Project*
