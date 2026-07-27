# data-filter — Plan de migration architecturale

Plan incrémental pour faire évoluer `@recursyve/nestjs-data-filter` **sans rewrite greenfield**, en préservant les consommateurs Recursyve existants.

Ce document est volontairement **anti-spéculatif** : aucune abstraction (adapter, compiler, IR, port, interface dialecte riche) n’est introduite tant que le code actuel et les tests de caractérisation n’ont pas démontré qu’elle est utile.

---

## Objectifs distincts (ne pas fusionner)

| Goal | Objectif | Ce que ce n’est **pas** |

|------|----------|-------------------------|

| **A** | Rendre l’implémentation Sequelize **utilisable / testable** hors MySQL accidentel (ex. PostgreSQL sur le cœur) | L’indépendance ORM |

| **B** | Clarifier les frontières internes / éventuellement découpler la persistence **là où les preuves l’exigent** | Ajouter Drizzle « pour l’architecture » |

| **C** | Ajouter un **autre** adapter de persistence | Remplacer Sequelize comme nouvelle source de vérité |

**Ordre :** caractériser (Phase 0) → enlever le couplage accidentel (Phase 1) → abstraire **seulement** ce qui reste structurellement couplé (Phase 2+) → features JSON/spatial / Goal C **uniquement** si le produit le demande.

**Première phase à implémenter :** Phase 0 (tests de caractérisation). **Aucun refactor de code de production avant que Phase 0 ait atteint son exit criteria complet.**

> **Phase 0 is a hard gate.**

> Its implementation may be incremental (test by test, domain by domain), but **Phase 1 does not begin** until the complete agreed characterization scope is implemented and green on MySQL.

> A partial corpus (« on a ~60 % des tests, on peut déjà nettoyer ») **n’est pas** une échappatoire acceptable.

---

## Principes de migration

### Preserve the outside, replace the inside

> **Préserver l’extérieur, remplacer l’intérieur.**

Le but n’est pas de redessiner `data-filter` from scratch.

Le but est de :

1. **verrouiller** le comportement observable actuel ;

2. **retirer** le couplage MySQL accidentel ;

3. **établir** des frontières internes plus claires **quand les preuves le justifient** ;

4. **préserver** la compatibilité consommateur ;

5. **apprendre** des échecs PostgreSQL réels **avant** de concevoir des abstractions pour eux.

### Compatibilité de l’API publique (early phases)

La DX développeur actuelle doit rester **stable** pendant les phases précoces.

En particulier, **ne pas** exiger que les consommateurs abandonnent immédiatement :

- les décorateurs existants (`@Data`, `@Path`, `@Attributes`, `@Include`, `@Where`, searchable, …) ;

- l’intégration controllers (`FilterController`, dynamic / OpenAPI mixins) ;

- la configuration class-based (`BaseFilter`, propriétés `TextFilter` / `NumberFilter` / …) ;

- l’usage reflection / metadata (`DATA_FILTER`, `ATTRIBUTES`, scanners) ;

- les déclarations de filtres actuelles (`forRoot` / `forFeature`, `@InjectFilter`).

Le modèle d’authoring metadata/reflection-driven **n’est peut‑être pas idéal**, mais le **remplacer n’est pas un objectif initial** de migration.

Le traiter comme une **frontière de compatibilité**. Les premiers refactors se font **sous** cette surface publique.

On ne reconsidère l’API d’authoring que plus tard, s’il existe une **raison concrète** (pas une préférence esthétique).

### Autres principes

1. **Phase 0 est un hard gate** — voir section Phase 0. L’incrémentalité s’applique à **la construction de P0**, pas au droit de démarrer P1 tôt.

2. **P0 est descriptif, pas normatif** — un vert encode la réalité actuelle (même mauvaise), pas l’intention produit. Voir « Nature du contrat P0 ».

3. **Le corpus de caractérisation est le contrat de migration.** Les refactors peuvent changer radicalement les internals ; le comportement **observé préservé** doit rester vert, sauf amendement explicite.

4. **Pas d’abstraction spéculative.** Pas d’adapter / compiler / IR / port / `DialectSql` riche « au cas où ».

5. **Capabilities, pas lowest-common-denominator.** JSON, spatial, matching case-insensitive : supportés, ou échec explicite — pas une façade qui ment.

6. **Trois catégories de couplage, jamais collapsées** (voir ci-dessous).

7. **Préférer surpayer légèrement en characterization** que découvrir après plusieurs phases qu’un comportement implicite « magique » faisait tenir une app.

---

## Trois catégories de couplage (ne pas mélanger)

### 1. Couplage MySQL accidentel

Syntaxe ou conventions MySQL utilisées **là où une forme portable (ou le quoting Sequelize) suffirait**.

Exemples dans le code actuel :

- quoting hardcodé par backticks (`` `table`.`col` ``, `` `Parent->Child`.`col` ``) dans `SequelizeUtils.getLiteralFullName`, order-rules, search, `DISTINCT` pagination, etc. ;

- `IF(...)` dans `IfOrderRule` alors qu’un `CASE WHEN … THEN … ELSE … END` portable existe déjà dans `EnumOrderRule`.

**Traitement :** Phase 1 — corriger sous l’API publique, sans nouvelle usine dialecte.

### 2. Détails d’implémentation Sequelize

Le runtime actuel **est** Sequelize. Ce n’est pas « du MySQL » ; c’est l’ORM.

Exemples :

- `Op.*`, `WhereOptions`, `FindOptions`, `IncludeOptions` ;

- syntaxe nested where `$association.attribute$` (`getAttributeFullName`) ;

- conventions d’alias d’include (`Parent->Child`) ;

- `fn`, `col`, `where`, `literal`, `Utils.Literal` ;

- `getAssociations` / `rawAttributes` via sequelize-typescript.

**Traitement :** rester Sequelize tant qu’on n’a pas prouvé qu’une frontière sémantique interne est nécessaire (Phase 2+). Ne **pas** les cacher derrière une interface « dialecte ».

### 3. Capabilities backend / dialecte réelles

Comportements dont la sémantique **diffère** entre backends, ou qui reposent sur des APIs non portables.

Exemples :

- JSON (`JSON_EXTRACT`, `JSON_CONTAINS`, `JSON_UNQUOTE` vs opérateurs JSON/JSONB Postgres) ;

- spatial (`ST_Distance_Sphere`, `ST_Contains`, `Point`, `ST_SRID` vs PostGIS) ;

- différences de matching case-insensitive (`LIKE` + collation MySQL vs `LIKE` / `ILIKE` Postgres).

**Traitement :** capability explicite (supporté / unsupported / compiler de feature **plus tard** si la parité produit est requise). **Pas** des méthodes sur une interface dialecte fourre-tout.

---

## `DialectSql` — abstraction abandonnée

La proposition antérieure d’une interface large **`DialectSql`** (`jsonContains`, `spatialDistance`, `ifOrder`, `quoteNestedAssociation`, `distinctId`, …) est **explicitement abandonnée**.

Raisons :

- elle recrée `SequelizeUtils` derrière une interface ;

- elle collate accidentel / Sequelize / capabilities en un seul port ;

- elle pousse un lowest-common-denominator trompeur pour JSON et spatial ;

- elle est spéculative par rapport aux preuves actuelles.

**Autorisé en Phase 1 (si réellement utile) :**

- s’appuyer sur le quoting du dialecte Sequelize (`queryInterface.quoteIdentifier`, etc.), **ou**

- une abstraction **minimale** de quoting d’identifiants (quelques méthodes : `ident`, `qualify`, éventuellement alias d’association déjà résolu) — **rien d’autre**.

Ne **pas** remplacer `SequelizeUtils` en déplaçant toutes ses responsabilités derrière un port « dialecte ».

---

## Contexte (problèmes adressés)

D’après l’analyse du package actuel :

- Sequelize est à la fois source de vérité du schéma et DSL d’exécution.

- Les types Sequelize fuient dans des points d’extension publics (`CustomOperator`, `AccessControlAdapter`, `FilterDefinition`, `@Data(Model)`, …).

- Du SQL MySQL est injecté via `literal` / `fn` — **mélange** d’accidentel (backticks, `IF`) et de capabilities (JSON, spatial).

- Le changement de dialecte n’est pas prouvé par des tests d’exécution réalistes (la suite actuelle utilise surtout SQLite in-memory et des assertions de structure `WhereOptions`).

- Des capacités génériques utiles existent (HTTP, `QueryModel`, opérateurs, pagination, Nest DX) et doivent être **préservées**.

Dépendances locales : `data-filter` n’importe **pas** `sequelize-utils`, `config-sequelize`, ni `access-control-sequelize` — seulement `@recursyve/nestjs-common` (utilitaires).

---

## Vue d’ensemble des phases

```

P0 Characterization (MySQL E2E)

→ P1 Remove accidental MySQL coupling (+ PG discovery)

→ P2 Internal semantic boundaries only where evidence justifies

→ P2b/P2c Optional feature compilers (JSON / spatial) if product needs parity

→ Later: packaging / second adapter only if justified

```

| Phase | Titre | Nature | Breaking pour apps MySQL ? |

|-------|-------|--------|----------------------------|

| **0** | Characterization tests (**hard gate**) | Contrat comportemental E2E MySQL | Non (tests only) |

| **1** | Remove accidental MySQL coupling | Fix sous l’API publique + discovery PG — **après P0 done** | Non (comportement MySQL préservé) |

| **2** | Internal semantic boundaries | Uniquement si P0+P1 l’exigent | Non (sous la surface) |

| **2b+** | JSON / spatial as capabilities | Optionnel, product-driven | Non si capability-gated |

| **Later** | Package split / 2ᵉ adapter | Optionnel | Meta-package / opt-in |

---

## Phase 0 — Characterization tests (obligatoire)

### Hard gate

> **Phase 0 is a hard gate.**

> Its implementation may be incremental, but **Phase 1 does not begin** until the complete agreed characterization scope is implemented and green on MySQL.

Conséquences non négociables :

- **P0 entier** avant le moindre refactor de production (quoting, `IF`→`CASE`, nettoyage d’utilities, « petit fix innocent », etc.).

- Livraison incrémentale **autorisée uniquement à l’intérieur de P0** : test par test, domaine par domaine, PR par PR de tests.

- **Interdit** : ouvrir Phase 1 (ou tout changement de code produit motivé par la migration) parce que « le core est assez couvert ».

- JSON, spatial, custom operators / having font partie du **périmètre convenu** même s’ils semblent loin du premier refactor : une utility commune touchée en P1 peut les casser par effet de bord ; le filet doit déjà les voir.

Cette librairie est considérée comme **magique, hackish et difficile à raisonner**. C’est précisément le cas où l’on paie le coût du safety net **avant** de déplacer des morceaux.

### Nature du contrat P0 — descriptif, pas normatif

> **Characterization is descriptive, not normative.**

> A green P0 test means “this is what the library currently does”, not necessarily “this is what the library should do”.

Le vrai contrat :

> **P0 encode ce que la lib fait réellement aujourd’hui, même quand c’est mauvais.**

Ce n’est **pas** « le comportement souhaité / idéal / documenté intuitivement ».

Un test P0 vert **ne prouve pas** que le comportement est correct — seulement qu’il est **capturé** et qu’il **échouerait** s’il changeait.

#### Deux preuves obligatoires par scénario

Un bon test de caractérisation doit établir :

1. **Fidélité** — le comportement actuel est capturé fidèlement (observé sur MySQL réel via l’API publique) ;

2. **Sensibilité** — le test **échouerait** si ce comportement changeait ou cassait réellement (pas un vert par accident / assertion trop large / setup qui ne traverse pas le chemin visé).

Sinon ce n’est pas un filet : c’est un test cosmétique.

#### Quand l’intuition diverge de l’observation

Scénario attendu (presque certain sur cette codebase) :

1. On s’attend intuitivement à **X**.

2. On écrit d’abord pour **X** → **red**.

3. Investigation → la lib retourne **Y** depuis toujours (ou depuis longtemps).

**En Phase 0, on ne « corrige » pas le code produit pour obtenir X.**

On encode **Y** (réalité actuelle), on marque le scénario, et on **diffère** toute correction à un **amendement de comportement explicite** après que la caractérisation soit complete (voir [Amendements](#amendements-au-contrat-comportemental)).

Exemple d’esprit (pas une convention de framework imposée) :

```ts
it("currently returns Y when …", async () => {
    // characterization of existing behavior (observed on MySQL)

    expect(response).toEqual(Y);
});

// TODO(data-filter): expected behavior should likely be X.

// Current behavior is preserved for characterization only.

// Revisit explicitly in a behavior-change amendment after P0.
```

#### Classification des scénarios P0

Sans sur-ingénierie : chaque scénario (titre, tag, dossier, ou commentaire de suite) doit pouvoir être rangé dans l’une des catégories suivantes :

| Tag | Signification | Vert signifie |

|-----|---------------|---------------|

| `known-behavior` | Comportement actuel **accepté comme contrat de préservation** pour la migration (consommateurs s’y appuient ou on choisit de le garder) | On veut le **garder** sauf amendement |

| `legacy-contract` | Comportement actuel **préservé temporairement** pour ne pas casser pendant la migration ; pas une endorsement produit long terme | On le **préserve** ; révision possible plus tard |

| `suspected-defect` | Comportement actuel **suspect / probablement incorrect** ; encodé tel quel pour ne pas le changer en silence pendant P0/P1 | On **documente Y** ; correction = amendement dédié, **pas** un fix furtif en P0 |

Règle associée :

> When expected/intended behavior differs from observed behavior, encode the **observed** behavior in P0, mark the scenario as a known/suspected defect (`suspected-defect` or `legacy-contract` as appropriate), and **defer correction** to an explicit behavior-change amendment after characterization is complete.

Sinon, dans six mois un test vert sera lu comme :

> « ah, donc c’est le comportement voulu »

alors que ce n’était peut‑être que de la **réalité figée**.

La valeur de P0 est précisément de forcer la séparation :

- **réalité actuelle** (ce que la lib fait) ;

- **comportement souhaité** (intention historique / intuition / ce que les apps croient) ;

- **contrat de préservation migration** (ce qu’on refuse de casser pendant les refactors).

Ces trois choses ne coïncident pas toujours — surtout avec reflection, Sequelize, littéraux bruts, nested paths, JSON/spatial, etc.

### 1. Goal

Caractériser le **comportement public actuel** de `data-filter` tel que les consommateurs l’utilisent — **y compris quand il est mauvais, surprenant ou implicite**.

Ce n’est **pas** :

- tester des helpers internes ;

- figer l’implémentation actuelle comme « bonne » ;

- valider la structure de `WhereOptions` / `fn(...)` générés ;

- rédiger une spec normative du comportement idéal ;

- « corriger » au passage les défauts découverts pendant l’écriture des tests.

C’est :

- créer un **filet de sécurité comportemental** autour de la surface d’intégration publique ;

- établir le **contrat de migration descriptif** : les refactors restent verts tant que le comportement **observé préservé** n’a pas été explicitement amendé ;

- séparer réalité actuelle / intention / contrat de préservation.

### 2. Concrete changes (tests only — pas de refactor produit)

- Application NestJS de test **réaliste** qui branche `data-filter` comme une app Recursyve le ferait :

- `DataFilterModule.forRoot` / `forFeature` ;

- `BaseFilter` + DTO décorés ;

- controller dérivé de `FilterController` (ou équivalent public) ;

- modèles sequelize-typescript représentatifs (associations, searchable, JSON, geo si présents).

- **Testcontainers** + instance **MySQL** réelle (baseline actuellement supportée / attendue).

- Suite E2E / HTTP : requêtes réelles, assertions sur réponses et effets observables.

### 3. Public API impact

Aucun. Phase de tests uniquement.

### 4. Couverture comportementale attendue

Couvrir les comportements **externement observables** importants, notamment selon applicability :

| Domaine | Exemples d’assertions observables |

|---------|----------------------------------|

| Controller / décorateurs | Routes `filter`, `filter-count`, `filter/config`, download ; wiring `@InjectFilter` |

| Filter configuration | `GET filter/config` reflète opérateurs / types exposés |

| Opérateurs | equal / not\_equal / comparisons numériques / dates |

| String | contains / begins\_with / ends\_with / … |

| Listes | IN / NOT IN |

| NULL | is\_null / is\_not\_null |

| Tri | `order` asc/desc ; order-rules (enum / is-null / if→comportement) |

| Pagination | `page.number` / `page.size` ; garde max page ; total cohérent |

| Includes / associations | filtres sur chemins nested ; résultats joints attendus |

| Search | `search.value` multi-tokens si applicable |

| JSON | filtres / search sur colonnes JSON **tels qu’aujourd’hui** — **inclus dans le gate**, pas reporté |

| Spatial | geo distance / bounds / distance attribute **tels qu’aujourd’hui** — **inclus dans le gate**, pas reporté |

| Custom operators / having | opérateurs custom documentés par les usages (ex. having count) — **inclus dans le gate** |

| Validation | champs invalides, page size manquante / trop grande |

| Erreurs / edge cases | comportements que les apps peuvent déjà subir (y compris « laids ») |

Les tests assertent des **résultats HTTP / query / payload**, pas des détails d’implémentation.

Le périmètre volontairement **large** (y compris JSON / spatial / custom operators) est un choix conscient : mieux vaut surpayer légèrement en characterization que découvrir après trois phases qu’un monstre implicite faisait tenir une app.

### 5. Contrat de migration

- **Après** exit criteria P0 complet : refactor interne radical **autorisé** si la suite de caractérisation préservée reste verte.

- **Avant** exit criteria P0 complet : **aucun** refactor de production motivé par cette migration — y compris « fixer » un `suspected-defect` découvert en écrivant un test.

- Un scénario P0 vert = **comportement actuel capturé**, pas une validation produit.

- Les tags `known-behavior` / `legacy-contract` / `suspected-defect` doivent rester lisibles pour éviter qu’un vert soit relu plus tard comme intention officielle.

- Tout changement de comportement observable doit être **documenté explicitement** (dans ce fichier ou un amendement versionné) : comportement retiré, modifié, ou capability désormais unsupported.

- Les specs unitaires existantes (structure `WhereOptions`, SQLite) restent utiles en complément, mais **ne remplacent pas** ce corpus E2E MySQL.

### 6. Cible d’exécution secondaire (plus tard)

Le **même corpus comportemental** pourra être rejoué contre une seconde cible (ex. **PostgreSQL**) pour classer chaque scénario :

| Résultat sur PG | Interprétation |

|-----------------|----------------|

| Vert | Portable (ou coincidence acceptable) |

| Rouge à cause de backticks / `IF` / quoting | Couplage **accidentel** → candidat Phase 1 |

| Rouge à cause de JSON / spatial / collation | **Capability** réelle → gate ou compiler dédié plus tard |

| Rouge à cause de `Op` / includes / `$path$` | Souci **Sequelize** / config dialecte, pas « DialectSql » |

Phase 0 elle-même commence sur **MySQL seulement**.

### 7. Exit criteria (complets — prérequis absolu de Phase 1)

Phase 0 n’est **terminée** que lorsque **tout** ce qui suit est vrai :

- Application Nest publique + **Testcontainers** + **MySQL** réel en place.

- **Périmètre convenu documenté** : liste des domaines / scénarios (table de couverture ci-dessus, éventuellement raffinée) — y compris JSON, spatial, custom operators / having, pas seulement le « core » opérateurs / pagination.

- **Chaque domaine du périmètre convenu** a au moins les scénarios E2E HTTP convenus, **verts en CI** sur MySQL (verts = réalité actuelle encodée, y compris `suspected-defect` / `legacy-contract`).

- Les scénarios où intention ≠ observation sont **marqués** (pas « corrigés » en silence dans le code produit).

- Le corpus est exécutable de façon reproductible (CI) sans dépendance à une DB locale manuelle.

- **Aucun** commit de refactor de production lié à la migration n’a encore été fusionné.

Tant qu’un domaine convenu manque ou est rouge, **Phase 0 n’est pas done** — même si le cœur (equal / contains / pagination) est déjà vert.

### 8. Risk

Sous-caractériser (omettre nested / having / JSON / spatial « pour aller plus vite ») → faux sentiment de sécurité et échappatoire vers P1 trop tôt. Sur-caractériser des détails non observables → fragilité. Viser le **contrat consommateur**, pas la couverture ligne à ligne des internals. La tentation « 60 % suffisent pour commencer le cleanup » est le **risque process** principal de cette phase.

Risques spécifiques au contrat descriptif :

- **Faux positifs** — tests verts qui ne traversent pas le chemin réel / assertions trop faibles → filet illusoire.

- **Normativité accidentelle** — encoder X (souhaité) au lieu de Y (observé), ou « fixer » le code en P0 pour faire passer X → on perd la réalité et on casse éventuellement des apps qui dépendent de Y.

- **Amnésie** — `suspected-defect` non marqué → dans six mois le vert est lu comme comportement voulu.

---

## Phase 1 — Remove accidental MySQL coupling

### Prérequis (hard gate)

Phase 1 **ne commence pas** avant que l’exit criteria **complet** de Phase 0 soit atteint (section Phase 0 §7).

Explicitement **insuffisant** comme déclencheur de P1 :

- « le core (equal / contains / pagination / includes) est vert » ;

- « on a une app Nest + Testcontainers MySQL qui tourne » ;

- « on caractérisera JSON / spatial / having en parallèle du cleanup ».

### 1. Goal

Sous l’API publique inchangée, éliminer le couplage MySQL **accidentel**, puis **découvrir** (via le corpus P0 **complet** rejoué) quelle part de la dépendance MySQL disparaît.

Ce n’est **pas** « rendre tout portable ».

Ce n’est **pas** introduire `DialectSql` / IR / adapters.

### 2. Concrete changes (sous la surface)

Exemples attendus (ajustés par ce que P0 + essais PG révèlent) :

- remplacer le quoting backticks hardcodé par le quoting **dialect-aware** Sequelize, ou une **très petite** abstraction de quoting si elle s’avère réellement utile ;

- remplacer `IF()` (`IfOrderRule`) par un `CASE` portable (même famille que `EnumOrderRule`) ;

- corriger toute autre syntaxe MySQL brute **accidentelle** exposée par la caractérisation ;

- pour les features **réellement** non supportées ailleurs : **échecs de capability explicites** plutôt que de prétendre à la portabilité.

**Hors scope Phase 1 :** réécrire JSON / spatial en abstraction générique ; changer décorateurs / BaseFilter / controllers ; introduire une IR complète.

### 3. Public API impact

| | |

|--|--|

| **Compatible** | Décorateurs, controllers, `BaseFilter`, reflection, `forFeature`, opérateurs publics |

| **Comportement MySQL** | Doit rester vert sur le corpus P0 |

| **Migration consommateur** | Aucune pour les apps MySQL |

### 4. Discovery PostgreSQL

Après les corrects accidentels (et uniquement avec le corpus P0 **complet** comme filet MySQL) :

- rejouer le corpus P0 contre PostgreSQL (Testcontainers) — y compris les domaines « capability » pour les classer, pas seulement un sous-ensemble core ;

- classer chaque échec (accidentel restant / Sequelize / capability) ;

- documenter une **matrice de résultats** (portable / accidentel corrigé / capability / bloqué Sequelize).

Le but de la phase est autant **épistémique** que technique : mesurer combien de MySQL était du bruit.

### 5. Tests

- Corpus P0 MySQL **complet** toujours vert (contrat).

- Même corpus (ou exécution complète avec skip/échec classifié par capability) sur Postgres : résultats enregistrés.

- Tests ciblés sur quoting + `IfOrderRule`→`CASE` si utiles, **sans** remplacer le contrat E2E.

### 6. Migration strategy

Ship derrière le même package ; défaut = comportement MySQL préservé. Postgres = cible de discovery / opt-in, pas promesse marketing avant matrice.

### 7. Exit criteria

- Plus de backticks / `IF(` accidentels dans les chemins couverts par P0 (ou liste résiduelle justifiée).

- Corpus P0 MySQL vert.

- Matrice PG publiée pour le corpus (classification par domaine, y compris JSON/spatial).

- Décision documentée : quoi abstraire en Phase 2 (s’il reste un couplage **structurel**), quoi laisser en capability.

### 8. Risk

Corriger le quoting peut révéler des dépendances subtiles aux alias Sequelize ; les apps MySQL doivent rester bit-compatibles au niveau **résultats**, pas au niveau SQL textuel. Ne pas « fixer » JSON/spatial en Phase 1 sous prétexte de dialecte.

---

## Phase 2 — Internal semantic boundaries (seulement si les preuves l’exigent)

### 1. Goal

Après P0 + P1 et les résultats PostgreSQL, identifier le **couplage structurel restant**.

N’introduire des représentations normalisées (filtre / order / query) **que** là où elles résolvent un couplage **démontré**.

**Ne pas** assumer qu’une IR/DSL complète est automatiquement requise.

### 2. Concrete changes (conditionnels)

Exemples de frontières **possibles** (à valider par preuves, pas par checklist) :

- représentation interne stable pour opérateurs standards avant compilation Sequelize ;

- séparation claire « sémantique d’ordre » vs `literal()` SQL ;

- point d’extension pour CustomOperator qui n’oblige pas immédiatement à retirer l’escape hatch Sequelize.

Toujours : **garder** décorateurs / configuration class-based / reflection ; mapper vers l’interne si besoin.

### 3. Public API impact

Surface publique préservée. Toute deprecation d’extension Sequelize (`CustomOperator.where`, etc.) est **hors** de cette phase sauf preuve + plan de shim — et de préférence plus tard.

### 4. Exit criteria

- Chaque nouvelle abstraction cite : échec P0/P1/PG ou fuite de type concrète qu’elle élimine.

- Corpus P0 MySQL vert.

- Pas d’interface « fourre-tout » dialecte.

### 5. Risk

Réintroduire le plan spéculatif (IR globale, SchemaPort, split packages) sans preuve. **Résister.**

---

## Phases ultérieures optionnelles — capabilities JSON / spatial

JSON et spatial sont des **capabilities / compilers de feature**, pas le premier chantier générique.

| Condition | Action |

|-----------|--------|

| La parité PostgreSQL JSON **n’est pas** un besoin produit | Rester MySQL (ou unsupported explicite sur PG) ; pas d’abstraction |

| Besoin produit JSON sur PG | Introduire un compiler / mapping de feature JSON **dédié**, guidé par les scénarios P0 JSON |

| Idem spatial / PostGIS | Idem, module spatial dédié — **pas** une méthode sur un port dialecte global |

Ne pas forcer JSON/spatial dans la première abstraction générique (Phase 1 ou 2).

---

## Plus tard (non prioritaire, evidence-gated)

Ces sujets restent valides comme **horizons**, pas comme prochaines étapes automatiques :

| Sujet | Condition pour l’ouvrir |

|-------|-------------------------|

| Décontamination des points d’extension publics (`CustomOperator`, AC adapter) | Apps prêtes + shims ; après frontières internes utiles |

| Split packages `core` / `sequelize` | Frontières déjà réelles dans le code ; meta-package BC |

| Goal **C** — second adapter (ex. Drizzle) | Besoin produit réel **et** frontières internes prouvées ; Drizzle ne devient pas la nouvelle SoT |

| Changer l’API d’authoring (décorateurs / reflection) | Raison concrète ; **pas** un objectif early-phase |

---

## Architecture cible (provisoire, non prescriptive)

Tant que P0–P1 n’ont pas parlé, la cible **opérationnelle** est :

```

[Public DX inchangée]

Controllers · BaseFilter · Decorators · QueryModel · forFeature

↓

[Implémentation Sequelize]

Quoting dialect-aware (étroit) · Op / Include / $path$ …

Capabilities: JSON / spatial (MySQL ou unsupported explicite)

↓

[MySQL baseline + PG discovery]

```

Toute couche supplémentaire (IR, SchemaPort, feature compilers, package split) s’ajoute **seulement** si P0/P1/PG le justifient, et reste **sous** la DX publique.

### Direction des dépendances (quand des packages apparaîtront éventuellement)

```

apps → @recursyve/nestjs-data-filter (surface stable)

↓ internals

sequelize runtime + quoting étroit + capabilities

```

Pas de dépendance inversée « core abstrait » imposée avant preuve.

---

## Ce qui reste / bouge (état d’esprit)

| Catégorie | Exemples | Early phases |

|-----------|----------|--------------|

| **API publique à préserver** | Controllers, `FilterQueryModel` / `QueryModel`, `BaseFilter`, décorateurs, `InjectFilter`, `forRoot`/`forFeature` | Gelée (compat) |

| **MySQL accidentel** | Backticks, `IF()` | Phase 1 : retirer |

| **Sequelize** | `Op`, `$path$`, includes, `fn`/`literal` | Reste ; frontières plus tard si preuve |

| **Capabilities** | JSON, spatial, case-insensitive | Gates / compilers optionnels plus tard |

| **Abandonné** | Large `DialectSql`, rewrite DX, IR spéculative Day 1 | — |

---

## Première phase à implémenter

**Phase 0 — Characterization tests (MySQL + Testcontainers + app Nest publique).**

> **P0 entier. MySQL réel. Testcontainers. Public API. HTTP/E2E. Ensuite seulement on touche au code.**

Pourquoi :

1. Sans contrat comportemental **complet**, tout refactor (même « petit » quoting) est un risque non mesurable pour les apps Recursyve, y compris sur des chemins JSON / spatial / having touchés par effet de bord.

2. La suite actuelle ne caractérise pas le comportement HTTP réel sur MySQL.

3. Phase 1 (quoting / `CASE`) et la discovery PostgreSQL **dépendent** de ce filet **entier**, pas d’un sous-ensemble « core ».

4. Aucun changement d’API publique, aucun pari d’abstraction.

5. Pour une librairie opaque / hackish, on **accepte** de surpayer légèrement en characterization plutôt que de découvrir trop tard un comportement implicite.

**Incrémentalité :** livrer P0 domaine par domaine.

**Séquencement :** **P1 bloqué** jusqu’à exit criteria P0 complet.

Ensuite seulement : **Phase 1** (couplage accidentel), avec le corpus P0 comme garde-fou, puis discovery PostgreSQL.

---

## Effort / risque relatif (indicatif)

| Phase | Effort | Risque | Ship incremental ? |

|-------|--------|--------|--------------------|

| 0 Characterization | Moyen–élevé (setup + large scope) | Faible sur le produit (tests only) ; risque process = démarrer P1 trop tôt | Oui **pour les tests** — **non** pour débloquer P1 avant exit criteria complet |

| 1 Accidental MySQL | Moyen | Moyen (quoting / alias) ; filet P0 complet requis | Oui — API publique stable ; **après** P0 done |

| 2 Semantic boundaries | Variable | Moyen–élevé si trop large | Oui — seulement evidence-based |

| JSON/spatial compilers | Élevé | Élevé (sémantique) | Opt-in produit |

| Package split / 2ᵉ adapter | Élevé | Élevé | Opt-in / plus tard |

---

## Anti-patterns (ne pas faire)

- Rewrite greenfield ou nouvelle DX d’authoring en early phase

- Large interface `DialectSql` / « SequelizeUtils as interface »

- Collapser accidentel + Sequelize + capabilities en un seul port

- **Commencer Phase 1 (ou tout refactor de production) avec un corpus P0 partiel** (« le core suffit », « JSON/spatial plus tard en parallèle »)

- Omettre JSON / spatial / custom operators du périmètre P0 parce qu’ils semblent hors du premier cleanup

- Introduire IR / adapter / SchemaPort / split packages **avant** P0 **complet** vert et preuves P1/PG

- Forcer la parité JSON/spatial PostgreSQL dans la première abstraction générique

- Remplacer Sequelize par un autre ORM comme nouvelle source de vérité

- Faire échouer silencieusement des features non portables au lieu de capability errors explicites

- Traiter un test P0 vert comme preuve que le comportement est **souhaité** / correct produit

- « Corriger » le code de production en Phase 0 pour aligner le comportement sur l’intuition (X) au lieu d’encoder l’observation (Y) + tag `suspected-defect` / `legacy-contract`

- Écrire des assertions trop larges qui restent vertes même si le comportement réel change (faux positifs de caractérisation)

- Traiter les assertions de structure `WhereOptions` comme substitut au contrat E2E consommateur

---

## Amendements au contrat comportemental

Le corpus P0 est **descriptif**. Le rendre **normatif** (changer ce que la lib doit faire) exige un amendement explicite — pas un fix furtif pendant P0 ou un cleanup P1.

Quand un comportement caractérisé en Phase 0 doit changer (y compris corriger un `suspected-defect`) :

1. Documenter l’amendement (comportement **observé avant** / **souhaité après** / raison / impact consommateurs).

2. Mettre à jour le scénario P0 : retirer ou retagger (`suspected-defect` → nouveau `known-behavior`), et faire passer le test sur le **nouveau** comportement seulement avec le changement de code associé.

3. Communiquer le breaking (même soft) aux consommateurs Recursyve.

Sans amendement écrit, le corpus P0 **gagne** — y compris quand il encode un comportement « laid » ou suspect.
