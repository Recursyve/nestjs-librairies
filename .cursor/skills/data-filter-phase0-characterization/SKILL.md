---
name: data-filter-phase0-characterization
description: >-
  Implements Phase 0 characterization tests for @recursyve/nestjs-data-filter
  (MySQL Testcontainers, Nest public API, HTTP/E2E). Use when writing
  characterization/e2e tests, covering filter operators, pagination, JSON,
  spatial, or when the user mentions Phase 0 / P0 / contrat de migration.
disable-model-invocation: false
---

# Phase 0 — Characterization (data-filter)

Read `data-filter/ARCHITECTURE_DOCUMENT.md` (Phase 0) before coding. **Tests only** — no production refactors.

## Goal

Lock **observed** public behavior on **MySQL** via Nest public DX (same as Recursyve apps).

## Checklist

```
P0 Progress:
- [ ] Nest test app: forRoot/forFeature, BaseFilter, DTOs, FilterController
- [ ] Testcontainers MySQL
- [ ] Domain scenarios green in CI (see coverage table in ARCHITECTURE_DOCUMENT)
- [ ] Mismatches / ugly cases classified (see Classification below) — not every `it()`
- [ ] Intention ≠ observation → encode Y, `@p0` + note — do NOT fix product code
- [ ] No production migration refactor merged yet
```

## Domains to cover (gate)

Controller routes · config · operators · string · lists · null · order · pagination · nested includes · search · **JSON** · **spatial** · **custom/having** · validation · ugly edge cases.

Assert **HTTP responses / observables**, not Sequelize AST.

## Dual proof per scenario

1. **Fidelity** — observed on real MySQL through public API  
2. **Sensitivity** — would fail if behavior changed

## Classification (documentation, not a stamp on every test)

- **Unmarked = `known-behavior`.** Do not invent title prefixes like `[known-behavior] …`.
- Explicit tags only for `legacy-contract` / `suspected-defect` (or when intention ≠ observation needs a paper trail).
- **Encode once, as JSDoc `@p0 <tag>`** on the enclosing `describe` (or single `it`), plus a one-line Observed / Intended when useful:

```ts
/**
 * @p0 suspected-defect
 * Observed: …. Intended: ….
 */
describe("…", () => { /* … */ });
```

Do not invent alternate conventions (folder names, random comments, test-title brackets).

## Forbidden during P0

- Fixing product code so tests match intuition (X instead of Y)
- Skipping JSON/spatial/having « for later »
- Declaring P0 done / starting P1 with partial coverage
- Using SQLite/`WhereOptions` shape as the migration contract
- Mechanically tagging every scenario as `known-behavior`

## After a suspected defect

Document Y with `@p0 suspected-defect` or `@p0 legacy-contract`, defer fix to an **explicit behavior amendment** (ARCHITECTURE_DOCUMENT § Amendements).

## Exit criteria (P1 still blocked)

Full agreed scope green on MySQL CI + mismatches classified where needed + reproducible Testcontainers + **zero** production migration refactors merged.
