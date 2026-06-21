# ManyChat MCP / Revenue Operator — Canon de Proyecto y Handoff

Documento: ManyChat MCP / Revenue Operator — Canon de Proyecto y Handoff
Owner: Ulises Arellano / Gnosix + WIZNEO
Status: Active
Updated: 2026-06-19
Version: 2026-06-19.1
Objective: Dejar una fuente canónica para terminar el repo, el producto hosted y la publicación sin perder contexto entre sesiones.
Links: Repo local `/root/manychat-mcp`; branch `uiux/manychat-premium-control-plane`; Drive root `ManyChat MCP Product Assets — 2026-06-18`; handoff local `docs/product/completion-handoff-2026-06-19.md`
Dependencies: GitHub, Vercel, Convex, Clerk, Stripe, Railway/VPS, ManyChat API, Google Drive
Tools: Claude Code/WIZ, Codex reviewer, GWS CLI, Convex, Clerk, Vercel, Railway/VPS
Agent Owner: WIZ
Approval Required: push, deploy, public release, DNS, Stripe live, outbound/public launch posts
Next Actions: actualizar docs/changelog, correr verificación completa, preparar PR, pedir approval antes de push
Pending Decisions: beta con billing vs beta gratis/manual; Railway vs VPS gateway; npm publish vs GitHub release only

## Canon actual

- Nombre del repo/producto OSS: ManyChat MCP.
- Nombre de la capa pagada: Revenue Operator.
- El repo OSS sigue siendo CLI + MCP + self-host. No debe quedar como demo capado de SaaS.
- La capa pagada vende operación: dashboard, vault cifrado, tokens hosted, usage/audit, lead-state, handoff, reporting y playbooks.
- Posicionamiento público: “Your leads already exist. The problem is what happens after.”
- Gnosix: raíz B2B de sistemas AI en producción.
- WIZNEO: capa builder/contenido/comunidad de Ulises.
- No mezclar Gnosix oro/negro con WIZNEO Matrix verde en assets públicos de marca. Este proyecto usa una estética dark/green tipo WIZNEO para el producto builder.

## Qué queda viejo o superseded

- Cualquier doc que describa ManyChat MCP solo como herramienta técnica queda incompleto. Debe reconocer el split OSS + Revenue Operator.
- `BETA_READINESS_REPORT.md` está históricamente útil, pero sus conteos de tests y estado son anteriores a Lead-State v1. Actualizar antes de PR.
- `docs/product/drive-launch-pack-2026-06-18.md` queda como pack previo; este doc lo supersede para continuidad desde 2026-06-19.
- Los screenshots viejos de landing siguen como evidencia histórica, pero los screenshots actuales subidos hoy son la evidencia visual vigente.
- No asumir deploy productivo. Hasta este corte no hubo push, deploy ni publicación externa.

## Estado logrado en repo

- Branch actual: `uiux/manychat-premium-control-plane`.
- Working tree antes de crear este canon: limpio tras Lead-State v1.
- Handoff local creado: `docs/product/completion-handoff-2026-06-19.md`.
- Canon Drive creado hoy desde este archivo.

### Commits logrados

- `8975ea7` — hardening de auth hosted control plane.
- `ff2cb41`, `97b6fcc`, `a406fbd` — reposicionamiento docs/dashboard hacia Revenue Operator preservando OSS.
- `d99ad4f` — Convex `operatorLeads`.
- `cffa91e` — APIs de leads y schemas.
- `47d89ab` — dashboard lead queue.
- `76db5fd` — protección contra refresh stale en lead queue.
- `add9b88` — counters serializados en `workspaces.operatorLeadStatusCounts`.
- `522cdc8` — backfill lazy exacto de counters si faltan en workspaces existentes.

## Verificación observada

Última verificación después del fix de Lead-State v1:

- `npm --prefix apps/web run test` — 39 tests passed.
- `npm run web:lint` — passed.
- `npm run web:build` — passed.
- Reviewer final — approved, sin findings.

Verificación completa previa al bloque Lead-State:

- `npm test` — passed.
- `npm --prefix apps/web run test` — passed.
- `npm run web:build` — passed.
- `npm run build` — passed.
- `npm run lint` — passed.
- `npm run web:lint` — passed.

## Screenshots y assets subidos hoy

Drive folder de screenshots: https://drive.google.com/drive/folders/1GMzVmoZRJq-_SjgiTG8Lm_L5g_1sRef6

- Landing desktop actual: https://drive.google.com/file/d/1VUBtyPhyqsH7ucS6rk7AyYD9Q-LKXwEy/view?usp=drivesdk
- Landing mobile actual: https://drive.google.com/file/d/1qtgl8MUHf6A352eE1GGiIfpu_QI0jJ_g/view?usp=drivesdk
- Dashboard auth gate actual: https://drive.google.com/file/d/1YUvCGy7wWzhr2nEvWFyIhoiT82GHZDAl/view?usp=drivesdk

Notas de captura:

- Landing desktop/mobile se capturó desde el build estático con CSS inyectado porque el servidor local Next devolvió `Internal Server Error` en `/` por el proxy/Clerk durante la captura. El build productivo sí pasó.
- Dashboard auth gate se capturó desde ruta local `/dashboard`, redirigida a Clerk sign-in.
- No se encontraron imágenes generadas previas específicas de ManyChat en `/root/brand-assets`, `/root/.codex/generated_images` ni dentro del repo aparte de screenshots/iconos técnicos.

## Estado por capa

### Producto

DONE:

- Oferta central definida: Revenue Operator para evitar fuga de leads entre captura, routing y handoff humano.
- Lead-State v1 implementado: crear lead, listar leads, mover status, counters correctos, dashboard queue.
- Auth/control-plane endurecido.
- Vault, hosted token, usage/audit y dashboard base ya existen.

MISSING:

- Browser E2E real con sesión Clerk + Convex.
- Hosted MCP gateway E2E con token real emitido por dashboard.
- Decisión de beta: gratis/manual vs billing live.
- Playbooks v2: reminders, n8n sync, CRM sync, analytics de lead aging.
- Demo de 2 minutos y beta cohort.

### Repo

DONE:

- Runtime OSS preservado.
- Web build pasa.
- Lead-State v1 está committeado.
- Plan de continuidad local creado.

MISSING:

- Actualizar README/ROADMAP/CHANGELOG/BETA_READINESS_REPORT/control-plane contracts con Lead-State v1.
- Correr verificación completa final tras docs.
- Preparar PR body.
- Pedir approval antes de push.
- Codeowners/human review si aplica.

### Publicación

DONE:

- Drive root y subfolders existen.
- Screenshots actuales subidos.
- Canon de proyecto creado para Drive.

MISSING:

- Push branch y PR.
- Merge.
- Release tag `v0.1.0` si Ulises aprueba.
- Decidir npm publish vs GitHub release only.
- Deploy Vercel/Convex/gateway si Ulises aprueba.
- Publicar posts/demo solo después de approval explícito.

## Siguiente sesión recomendada

Objetivo: PR readiness sin deploy.

Pasos:

- Leer `docs/product/completion-handoff-2026-06-19.md`.
- Correr `git status --short`.
- Actualizar docs/changelog para Lead-State v1.
- Correr:
  - `npm test`
  - `npm --prefix apps/web run test`
  - `npm run lint`
  - `npm run build`
  - `npm run web:lint`
  - `npm run web:build`
- Preparar PR body.
- Detenerse antes de push y pedir approval.

## Prompt de continuación

Continue ManyChat MCP / Revenue Operator from `/root/manychat-mcp`.
Read `docs/product/completion-handoff-2026-06-19.md` and this Drive canon first.
Current branch should be `uiux/manychat-premium-control-plane`.
Do not push, deploy, publish, send outbound messages, change DNS, or touch live billing without explicit approval.
Start with repo PR readiness: update docs/changelog for Lead-State v1, run full verification, prepare the PR body, then stop before push.
