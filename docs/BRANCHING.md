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
  - lint (tsc --noEmit)
  - test (vitest)
  - build (tsc)
```

El dashboard salio a su propio repositorio privado el 2026-07-29, asi que ya no hay checks
de `web` aca.

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

Despues del tag, a mano: crear el GitHub Release con el changelog y publicar en npm si la
version cambio. No hay workflow que lo dispare.

## Deploy environments

| Entorno | MCP Gateway |
|---------|-------------|
| Production | `main`, deployado al host de contenedores (ver `docs/deploy/`) |
| Preview | ninguno: se valida con el gate local y el smoke script |

El control plane hosted tiene sus propios entornos, en su repositorio.

## Commit conventions

```
type(scope): mensaje en ingles, imperativo, lowercase

tipos: feat, fix, chore, docs, test, refactor, security
scope: cli, mcp, gateway, policy, skills, deps, docs

ejemplos:
  feat(cli): add connect --open flag
  fix(gateway): stop a server key from satisfying token auth modes
  security(policy): block promotional content under a non-promotional tag
  chore(deps): bump @modelcontextprotocol/server to 2.0.0
```

## Ship checklist

Antes de mergear un PR a `main`:

- [ ] CI verde
- [ ] 1+ review approval
- [ ] No secrets en diff
- [ ] Tests nuevos o actualizados
- [ ] CHANGELOG actualizado
- [ ] Breaking changes documentados en PR description
