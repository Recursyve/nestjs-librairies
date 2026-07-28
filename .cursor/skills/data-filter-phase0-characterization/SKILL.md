---
name: data-filter-phase0-characterization
description: >-
  Implements Phase 0 characterization for @recursyve/nestjs-data-filter: test app
  fixtures, MySQL E2E, mutation testing, migration contract. Use when writing
  characterization/e2e tests, expanding the test app, classifying mutants, or
  when the user mentions Phase 0 / P0 / characterization / mutation testing.
disable-model-invocation: false
---

# Phase 0 — Characterization (data-filter)

Read `data-filter/ARCHITECTURE_DOCUMENT.md` (Phase 0) before coding.

**Goal:** lock **observed** public behavior on **MySQL** via the Nest public DX (same as Recursyve apps). The characterization suite describes the current library — it does not improve it.

## Checklist

```
P0 Progress:
- [ ] Nest test app exercises the public surface under test
- [ ] Testcontainers MySQL (real runtime — not SQLite as migration contract)
- [ ] Scenarios green in CI for the agreed scope
- [ ] Defects characterized descriptively — not fixed in lib/
- [ ] Mutation gaps investigated; valid classifications documented
- [ ] No production migration refactor merged yet
```

## Production is frozen

During Phase 0:

- do not change production behavior, fix defects, refactor implementation, or normalize legacy behavior;
- avoid modifying `lib/` except to expose an already-existing public capability (e.g. missing public export);
- temporary mutation probes in `lib/` are allowed only for characterization and must be reverted immediately.

## Test app

Treat the test app as a flexible playground for exercising the library's public behavior — not a realistic sample application.

Do not preserve its existing domain model for realism or consistency. Freely add resources, models, relationships, fields, decorators, modules, routes, and fixtures whenever they make a behavior easier to characterize.

New test concepts need not belong to one coherent real-world application. They may be completely unrelated to existing resources.

Prefer distinct, memorable domain concepts over generic `*Lab`, `*Test`, or `*Fixture` resources. For example:

- nested hierarchical relationships → kingdoms, guilds, star systems, dragons;
- unusual ordering rules → potion recipes, racing leagues, spell rankings, municipal parking permits;
- counts and aggregates → libraries and books, fleets and ships, taverns and patrons;
- complex permissions → vaults, classified archives, guild memberships, space stations.

These examples are illustrative, not naming conventions. Do not force fantasy or absurdity where a simple domain concept is clearer.

Realism is optional. A resource only needs enough internal coherence for a reader to understand what behavior is being tested. The goal is whatever test topology best exposes observable library behavior.

When a scenario needs a distinct public configuration, add a dedicated resource with a stable meaning across the suite — not a second meaning for the same resource via provider/config overrides.

Provider overrides are appropriate only when provider replacement itself is the public behavior being characterized (injectable adapters/deserializers).

## Entire public surface is in scope

If the package publicly exposes or supports a capability, it is part of the migration contract:

routes · filter types · operators · decorators · query options · search modes · translation search · JSON · nested paths/includes · order rules · grouping · pagination/count · downloads · adapters · deserializers · access control · validation · spatial · scanner/handler effects · module configuration.

If the test app cannot exercise it yet, **expand the test app**.

## Test level

- Prefer **E2E** when public HTTP/runtime behavior is observable there.
- Use **unit tests** when a public configuration contract cannot be reliably distinguished through HTTP alone.
- Do not force implementation-detail assertions into E2E merely to improve mutation score.

Assert **HTTP responses / observables**, not Sequelize AST or `WhereOptions` shape.

## Characterization style

Prefer adversarial fixtures over weak positive-only fixtures. Create data that distinguishes plausible wrong implementations:

- substring in the middle for `ends_with`;
- first-token-only and second-token-only search matches;
- insertion order opposite expected sort order;
- allowed/denied ACL quadrants;
- rows matching only one side of composed conditions;
- JSON values duplicated in the wrong path;
- values on both sides of inclusive boundaries.

Prefer exact identities/results over counts when practical.

Each scenario needs **dual proof**:

1. **Fidelity** — observed on real MySQL through the public API
2. **Sensitivity** — would fail if behavior changed

## Defects and classification

Existing defects are in scope. Characterize them descriptively; do not fix them during Phase 0.

If the public API exposes only a generic failure (e.g. HTTP 500), characterize the strongest stable public signal and document the observability limitation.

**Default:** unmarked scenarios = `known-behavior` (accepted preservation contract). Do not tag every `it()`.

Mark only when intention ≠ observation or the case is not obvious `known-behavior`:

| Tag | When |
|-----|------|
| `legacy-contract` | Preserved temporarily; not long-term product endorsement |
| `suspected-defect` | Observed behavior suspect; fix = explicit amendment after P0 |

Encode once as JSDoc `@p0` on the enclosing `describe` (or isolated `it`):

```ts
/**
 * @p0 suspected-defect
 * Observed: empty page.size → 500. Intended: 400 validation.
 */
describe("pagination when page.size is omitted", () => {
  it("currently responds with 500", async () => { /* … */ });
});
```

## Mutation policy

For public behavior:

- meaningful surviving mutants → test gaps;
- publicly reachable no-coverage mutants → test gaps;
- timeouts/errors → investigate.

Valid final classifications:

| Classification | Requirement |
|----------------|-------------|
| `KILLED` | Test distinguishes the mutant |
| `EQUIVALENT` | Real behavioral argument |
| `UNREACHABLE` | Proof through supported public runtime path |
| `ACCEPTED OBSERVABILITY LIMITATION` | Different internals, same public observable (e.g. indistinguishable HTTP 500) |

Do **not** use `OUTSIDE P0` or `DIMINISHING RETURN` to dismiss publicly supported behavior.

## Forbidden during P0

- Fixing product code so tests match intuition
- Skipping JSON/spatial/having/custom operators « for later »
- Declaring P0 done / starting P1 with partial coverage
- Using SQLite or `WhereOptions` shape as the migration contract
- Preserving weak tests merely because they already exist

## Exit criteria (P1 blocked until met)

Full agreed scope green on MySQL CI · mismatches classified where needed · reproducible Testcontainers · mutation gaps addressed or classified · **zero** production migration refactors merged.
