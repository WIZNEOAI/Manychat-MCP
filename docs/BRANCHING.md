# Branch strategy — Manychat-MCP

## Workflow: Trunk-based con release branches

Este es el modelo de desarrollo para Manychat-MCP a partir del beta launch.
Mantenemos `main` siempre deployable y usamos branches cortos para features y fixes.

```
main              ← siempre deployable, CI verde, protegido
  │
  ├── feat/<slug> ← features (short-lived, merge squash a main)
  │     ej: feat/two-factor-auth
  │
  ├── fix/<slug>  ← bug fixes (short-lived, merge squash a main)
  │     ej: fix/token-prefix-collision
  │
  ├── release/v*  ← release branches (estabilizacion pre-launch)
  │     ej: release/v0.1
  │
  └── hotfix/<slug> ← fixes criticos en prod (branch desde main, merge a main + release)
        ej: hotfix/vault-key-rotation
```

## Roles

| Rama | Proposito | Merge strategy | Protegida? |
|------|-----------|---------------|------------|
| `main` | Produccion | — | Si (no push directo, solo PR) |
| `feat/*` | Features nuevas | Squash merge a `main` | No |
| `fix/*` | Bug fixes | Squash merge a `main` | No |
| `release/*` | Estabilizacion pre-tag | Merge a `main` tras QA | Si (solo leads) |
| `hotfix/*` | Fixes urgentes en prod | Merge a `main` + cherry-pick a release | No |

## CI pipeline

Todos los branches corren CI al abrir PR contra `main`:

```yaml
checks:
  - root lint (tsc --noEmit)
  - root test (vitest)
  - root build (tsc)
  - web lint (eslint)
  - web test (vitest)
  - web build (next build --webpack)
```

Regla: **NO mergear sin CI verde** y sin review de al menos 1 persona.

## Desarrollo local (worktrees)

Para features no-triviales usamos git worktrees:

```bash
# Crear worktree aislado
git worktree add .worktrees/feat-<slug> -b feat/<slug>

# Trabajar ahi
cd .worktrees/feat-<slug>

# Al terminar y mergear, limpiar
git worktree remove .worktrees/feat-<slug>
```

## Tags y versionado

Seguimos semver (`v0.1.0`, `v0.2.0`, `v1.0.0`):

```bash
# Desde main, con CI verde
git tag -a v0.1.0 -m "Beta launch: hosted MCP gateway + dashboard + encrypted vault"
git push origin v0.1.0
```

Los tags disparan:
- GitHub Release con changelog
- Notificacion al canal #shipping en Discord/Slack

## Deploy environments

| Entorno | Web (Vercel) | Backend | MCP Gateway |
|---------|-------------|---------|-------------|
| Production | `main` branch | Convex prod deployment | Railway / VPS |
| Preview | PR branches (Vercel preview) | Convex preview deploy | N/A |

## Commit conventions

```
type(scope): mensaje en ingles, imperativo, lowercase

tipos: feat, fix, chore, docs, test, refactor, security
scope: cli, mcp, web, convex, gateway, vault, billing, docs

ejemplos:
  feat(web): add connection test button to dashboard
  fix(gateway): resolve session leak on transport close
  security(vault): rotate key now revokes all workspace tokens
  chore(deps): bump @modelcontextprotocol/sdk to 1.28
```

## Ship checklist

Antes de mergear un PR a `main`:

- [ ] CI verde
- [ ] 1+ review approval
- [ ] No secrets en diff
- [ ] Tests nuevos o actualizados
- [ ] CHANGELOG actualizado
- [ ] Breaking changes documentados en PR description
