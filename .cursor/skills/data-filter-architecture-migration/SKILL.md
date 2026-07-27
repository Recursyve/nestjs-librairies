---
name: data-filter-architecture-migration
description: >-
  Guides incremental migration of nestjs-data-filter per ARCHITECTURE_DOCUMENT
  (P0 hard gate → P1 accidental MySQL → evidence-based P2). Use when planning
  or implementing data-filter migration, dialect/portability work, quoting
  changes, DialectSql, Phase 1/2, or PostgreSQL discovery.
disable-model-invocation: false
---

# data-filter — architecture migration

**Canonical plan:** [ARCHITECTURE_DOCUMENT.md](../../../data-filter/ARCHITECTURE_DOCUMENT.md)

## Sequence (do not reorder)

```
P0 Characterization (MySQL E2E)  ← HARD GATE, implement first
 → P1 Remove accidental MySQL (+ PG discovery)
 → P2 Internal boundaries only where evidence justifies
 → Optional JSON/spatial compilers if product needs parity
 → Later packaging / 2nd adapter if justified
```

## Before any production change

1. Confirm current phase from ARCHITECTURE_DOCUMENT.
2. If P0 exit criteria incomplete → **only** characterization tests.
3. If proposing an abstraction → cite P0/P1/PG evidence or refuse.

## Goals (keep separate)

| Goal | Is | Is not |
|------|-----|--------|
| A | Sequelize usable beyond accidental MySQL (e.g. PG core) | ORM independence |
| B | Clear internals where proven | Drizzle « for architecture » |
| C | Optional second adapter | Replace Sequelize as SoT |

## Phase 1 (only after P0 done)

In scope: dialect-aware quoting (narrow), `IF`→`CASE`, explicit capability failures.  
Out of scope: JSON/spatial rewrite, new DX, IR, large `DialectSql`.

## Phase 2+

Add boundaries/compilers **only** with cited failures or type leaks. Resist speculative IR / SchemaPort / package split.

## Consumer compatibility

Early phases: freeze public authoring API. Behavior changes need a written **amendment** to the P0 contract.

## Quick anti-check

Refuse if the request is: greenfield rewrite, `DialectSql` kitchen-sink, P1 with partial P0, silent “fix” of characterized Y, or second ORM as new source of truth.
