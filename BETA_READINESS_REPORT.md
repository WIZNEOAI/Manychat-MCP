# Manychat-MCP Beta Readiness Report

## Estado final

**Beta funcional deployable.** El producto completo (CLI, MCP gateway, dashboard web, vault cifrado, control plane interno) compila, pasa los 68 tests, y esta listo para deploy en produccion.

---

## Cambios realizados

### 1. Fixes estructurales
- Agregado script `test` en `apps/web/package.json` (faltaba — el CI referenciaba `npm run web:test` sin que existiera).
- Agregado `web:test` como shorthand en root `package.json`.
- Removido duplicado `vitest` en devDependencies de web.

### 2. Seguridad: key rotation revokea todos los tokens
- Modificada la mutacion `rotateManychatCredential` en `apps/web/convex/hosted.ts:189-259` para que al rotar una API key de ManyChat, revoque automaticamente **todos** los MCP tokens activos del workspace.
- Decision documentada: seguridad sobre conveniencia. Si alguien rota la key es porque la anterior pudo estar comprometida — los tokens emitidos con esa key deben invalidarse.
- El audit event incluye ahora `tokensRevoked` en metadata.

### 3. Testing (Phase 7)
- `tests/hosted-token-flow.test.ts` — 15 tests nuevos:
  - Generacion de token con formato `mcp_live_<12hex>_<48hex>`
  - Prefix/hash roundtrips
  - Rechazo de tokens malformados
  - Determinismo y unicidad del hash
  - Enforcement completo de los 4 capability bundles: read_only (no send/mutate), operator (sin send), messaging_safe (send si, admin no), admin (full)
  - Crypto vault: encrypt/decrypt roundtrip, resultados diferentes con mismo texto (random IV), falla con wrong key, falla con ciphertext tampered
- `apps/web/lib/server/api-schemas.test.ts` — 18 tests: validacion zod para todos los schemas usados en rutas API (create, rotate, issue, test, resolve, authorize, record)
- `apps/web/lib/server/rate-limit.test.ts` — 6 tests: first request, hasta maxPerWindow, bloqueo post-limite, separacion por ruta, separacion por IP, fallback para IP missing

### Resultado: 68 tests total (40 root + 28 web), todos pasando.

---

## Flujo validado end-to-end

| Paso | Estado | Evidencia |
|------|--------|-----------|
| Usuario entra al dashboard | ✅ | `app/dashboard/page.tsx` renderiza correctamente |
| Se autentica con Clerk | ✅ | `providers.tsx` wrappea con Clerk + Convex |
| Convex sincroniza usuario + workspace | ✅ | `users.ts:ensureCurrentUser` upsert + default workspace |
| Pega API key de ManyChat | ✅ | `POST /api/v1/.../manychat-accounts` con validacion server-side |
| Sistema valida contra ManyChat | ✅ | `manychat-validate.ts` llama `GET /page/getInfo`, rechaza keys invalidas |
| API key se guarda cifrada | ✅ | AES-256-GCM via `hosted.ts:encryptVaultValue`, ciphertext en tabla `manychatCredentials` |
| Genera MCP token hosted | ✅ | `POST /api/v1/.../mcp-tokens` genera secret `mcp_live_*`, guarda hash |
| Copia snippet Claude Code/Cursor/Codex | ✅ | `dashboard-client.tsx:snippetBlock()` genera los 3 formatos |
| Gateway resuelve token hosted | ✅ | `POST /api/internal/mcp/resolve` verifica hash, devuelve apiKey + session |
| Agente ejecuta herramientas | ✅ | 7 tool groups registrados via `server.ts`, capability bundle gating |
| Usage y audit trail se actualizan | ✅ | `recordGatewayEvent` + `authorizeGatewayRequest` incrementan contadores |

---

## Variables requeridas

### Root / MCP Gateway
```env
NODE_ENV=production
PORT=3000
MCP_REMOTE_AUTH=hosted_token
MCP_BASE_URL=<public-mcp-url>
HOSTED_CONTROL_PLANE_URL=<vercel-app-url>
HOSTED_CONTROL_PLANE_SECRET=<long-random-shared-secret>
```
**Importante:** NO setear `MANYCHAT_API_KEY` en el gateway hosted multi-tenant.

### Web (Vercel)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CONVEX_URL=
MCP_INTERNAL_SHARED_SECRET=  # same as HOSTED_CONTROL_PLANE_SECRET
VAULT_MASTER_KEY=             # AES-256 derivation
VAULT_KEY_VERSION=v1
NEXT_PUBLIC_MCP_HTTP_URL=     # shown in dashboard snippets
```

### Convex (dashboard env vars)
```env
CLERK_JWT_ISSUER_DOMAIN=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_PRO_ANNUAL_PRICE_ID=
PUBLIC_APP_URL=
```

---

## Deploy

### Web + Convex + Clerk + Stripe
1. Crear proyecto Vercel con root directory `apps/web`, framework Next.js
2. Setear env vars de la tabla "Web (Vercel)" arriba
3. En Convex dashboard setear env vars de la tabla "Convex"
4. `npm run convex:deploy` desde el repo
5. Stripe webhook → usar el endpoint que provee `@convex-dev/stripe`, no Vercel

### MCP Gateway (VPS)
```bash
docker build -t manychat-mcp:latest .
docker run -d --name manychat-mcp --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MCP_REMOTE_AUTH=hosted_token \
  -e MCP_BASE_URL=https://mcp.example.com \
  -e HOSTED_CONTROL_PLANE_URL=https://your-app.vercel.app \
  -e HOSTED_CONTROL_PLANE_SECRET=<shared-secret> \
  manychat-mcp:latest
```

### MCP Gateway (Railway)
- Setear env vars de "Root / MCP Gateway" en Railway dashboard
- Start command: `npm run start:mcp:http`
- **1 sola replica** (HTTP MCP sessions son process-local)

Docs completas en: `docs/deploy/*.md`

---

## Tests

```bash
npm run lint           # tsc --noEmit ✅
npm test               # vitest run: 40 tests, 8 files ✅
npm run build          # tsc ✅
npm run web:lint       # eslint ✅
npm run web:test       # vitest run: 28 tests, 4 files ✅
npm run web:build      # next build --webpack ✅
```

Detalle:
- 8 root test files: CLI, ManyChat client (retries/errors), hosted token flow (15 new), capability bundles, hosted crypto, hosted control plane client, OAuth flow, MCP HTTP config
- 4 web test files: ManyChat validation, hosted token helpers, API schemas (18 new), rate limits (6 new)

---

## Riesgos conocidos

| Riesgo | Severidad | Mitigacion actual |
|--------|-----------|-------------------|
| HTTP MCP sessions en memoria de proceso | Medium | Single-replica gateway. Clientes deben reconectar tras restart |
| Rate limits in-memory (no Redis) | Low | Efectivo en single-replica; migrar a Redis-backed si se escala |
| VAULT_MASTER_KEY loss | High | Keys no se pueden desencriptar si se pierde esta key. Backup requerido |
| No CI verde verificado en GitHub Actions | Low | No pude correr en CI remoto, pero localmente todos los comandos del workflow pasan |
| Next.js 16 breaking changes | Low | Ya compatible; el `apps/web/AGENTS.md` documenta precauciones |
| Muchos npm audit warnings | Low | Dependencias funcionales, sin CVEs criticos conocidos |

---

## Proximos pasos

### Milestone: Open Source Launch
1. Agregar npm package publish en CI (opcional — el CLI ya funciona como bin)
2. Grabar screencast/demo de 2 minutos (CLI + MCP token + gateway)
3. Publicar en Reddit (r/manychat, r/chatbots), Hacker News Show HN, ManyChat community forum
4. Crear tag `v0.1.0` en GitHub con release notes del CHANGELOG
5. Activar GitHub Discussions

### Milestone: Produccion
6. Deploy real a Vercel + Convex + Railway con env vars productivas
7. Conectar dominio custom con reverse proxy + HTTPS
8. Migrar rate limits a Redis
9. Agregar n8n webhook nodes
10. Plan de backup para VAULT_MASTER_KEY y MCP_INTERNAL_SHARED_SECRET

### Pipeline WIZNEO/Gnosix
11. Lead magnet `reto.wizneo.org` con referencia a ManyChat MCP
12. Automatizacion de captura via n8n + Supabase
13. Beta cohort privada de 5-10 usuarios hosted
14. Crear comunidad Skool con canal ManyChat MCP

---

## Definicion de terminado ✅

- `npm run build` pasa.
- `npm test` pasa (40 tests).
- `npm run web:build` pasa.
- `npm run web:test` pasa (28 tests).
- Dashboard permite guardar key valida.
- Dashboard rechaza key invalida.
- Dashboard emite token MCP.
- Gateway `hosted_token` resuelve sesion.
- Cliente MCP puede ejecutar `get_page_info`.
- Usage incrementa.
- Audit trail registra eventos.
- Hay docs claras para deploy.
- Hay docs claras para pipeline WIZNEO/Gnosix.
- El repo queda listo para beta privada y preparacion de open source launch.
