<!--
PR template estandarizado para repos WIZNEOAI.
Agentes (Claude Code, etc.) llenan este template automáticamente cuando hacen `gh pr create`.
-->

## Summary
<!-- 1-3 bullets de qué cambia y por qué -->
-
-
-

## Linear Issue
<!-- Usar "Closes GNO-XXX" para auto-close. Si es multi-issue, listarlas. -->
Closes GNO-

## Changes
<!-- Lista concreta de archivos/módulos tocados. Opcional si es obvio del diff. -->
-

## Test plan
<!-- Checklist de qué se verificó. AI reviewers chequean esto. -->
- [ ] Lint verde
- [ ] Typecheck verde
- [ ] Tests unitarios verdes
- [ ] Smoke test manual (si UI)
- [ ] Revisión de efectos secundarios en modulos dependientes

## Screenshots / Evidence
<!-- Para cambios UI. Deja en blanco si no aplica. -->

## Risk assessment
<!-- Alto / Medio / Bajo. Notas sobre por qué. -->
**Risk**: Bajo
**Rollback plan**: `git revert <sha>`

## Agent attribution
<!-- Qué agente(s) produjeron este PR. Para trazabilidad. -->
**Primary**: Claude Code (Opus 4.7)
**Subagents used**: planner, executor, reviewer
**Human in the loop**: Ulises Arellano (review final antes de merge)

---

🤖 Generated in part with Claude Code — [Linear GNO-XXX](https://linear.app/gnosix/issue/GNO-XXX)
