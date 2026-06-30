# HVAutoAttack Business-Capability Refactoring Rules

These project rules apply when continuing JS/Tampermonkey business-capability refactoring in this directory.

## Core Direction

- Organize code by business identity, business question, and decision ownership, not by technical folders, duplicated code shape, helper shape, table/API/storage names, transport, or file location.
- A valid L3 abstraction is not shared code. It is one named business decision point with typed inputs, typed outputs, live consumers, and old decision paths removed, hidden, replaced, or mechanically blocked.
- Each business capability exposes exactly one external orchestration entry. Callers receive business decisions, commands, candidates, or evidence; they must not assemble fields, thresholds, IO, raw storage, DOM state, or business rulings themselves.
- App, init, page routing, and composition roots only wire entries and report business events. They must not contain business decisions, threshold checks, storage interpretation, DOM-derived rulings, or bypass downstream entries.

## Identity-First Boundary Selection

Before extracting, merging, moving, naming, or splitting any module, entry, helper, adapter, state owner, monitor, page flow, or battle flow:

- Define the parent business identity first: source, target, lifecycle, SSOT/authority, cache/mirror/log role, write authority, failure semantics, and typed sub-identities.
- Identify the business decision that is drifting. Start from business language such as readiness ruling, eligibility decision, recovery candidate, runtime fact, action command, log record, option value, or UI reset confirmation.
- Same storage key, DOM selector, endpoint, repository, object shape, or repeated `if` block does not prove same capability. Merge only when one named decision point can answer the same business question without losing identity or sub-identity distinctions.
- Technical capabilities are valid only when they answer their own business question, such as API command protocol, DOM surface parsing, storage write authority, UI recovery workflow, runtime cache freshness, or log persistence. Compose them through orchestration; do not confuse them with the record identity itself.

## Structured Pipeline

- Classify or normalize once at the earliest stable boundary, then distribute typed identities, slices, decisions, candidates, commands, or evidence downstream.
- Downstream consumers must not repeatedly infer the same meaning from raw markers, fields, thresholds, source flags, timestamps, DOM selectors, storage keys, or transport metadata.
- IO belongs to adapter or implementation side. Business decisions belong to the capability core or orchestration entry. Business rulings belong at the entry point.
- Do not expose low-level read facades that return tables, fields, thresholds, raw DOM, raw storage, or state fragments for consumers to assemble their own decision.
- If later correction, recovery, audit, UI, or statistics need to explain why a ruling happened, preserve that reason in a decision type, evidence value, audit value, persisted decision, or behavior test. Do not leave the rationale only in comments or docs.

## Abstraction Rules

- Judge the abstraction axis before editing.
- Repetition axis: prefer helper, derivation, internalization, or smart constructor.
- Dependency-direction axis: use trait-like ports or adapters only for real IO boundaries, multiple adapters/drivers, replaceable implementations, or independent evolution.
- Same-business-question axis: converge to one business query, command, or orchestration entry even when code is not textually duplicated.
- Do not create single-implementation fake ports, fake hexagonal folders, or uncalled public abstractions.
- Helper extraction is not L3 progress if it only wraps repeated SQL/string/field/selector filtering while callers still decide what the result means.
- Every new abstraction needs a live consumer and bridge removal: delete, hide, replace, deprecate with a failing guard, or block old direct reads, old predicates, old decision dialects, bypass flags, and implementation-detail calls.

## Defensive And Offensive Gates

Run every candidate boundary through these gates:

- Prevent fake cohesion: split a module that welds different bounded contexts, lifecycles, IO rhythms, evolution reasons, or business questions.
- Prevent fake decoupling: a separated helper/port/adapter is not a real boundary if runtime replacement would still require consumer awareness.
- Prevent hard abstraction islands: abstractions must map to a real business concept and consumed business flow.
- Prevent forced migration: same names, fields, or flow shape are only recall signals; prove the same business question before merging.
- Converge business capability queries when multiple implementations, readings, decision dialects, or exits answer the same question.
- Converge business orchestration so a reader can understand the business flow through one entry, with decision order and capability composition visible there.

## Visibility, Entries, And Naming

- Outside a capability, consumers should see only the unique business entry and event/decision types required to call it.
- Inside a capability, implementation defaults to private or module-local unless it is a lower-level capability entry.
- One orchestration entry must stay thin. Split internals into small step files or pure helpers inside the same capability before creating new top-level capabilities.
- Escalate a step into a separate capability only at a real boundary: independent IO, multiple adapters or drivers, separate business identity, separate lifecycle, or independent cross-module evolution.
- Names, events, decisions, tests, help text, comments, and guard messages must match actual business behavior.

## Regression Locks And Tests

- Every boundary fix, entry convergence, old-path removal, or invariant internalization must answer what prevents reintroduction in three months.
- Prefer module visibility, typed events/decisions, exhaustive dispatch, smart constructors, and behavior tests first; then lint/verify scripts; then docs.
- Tests belong in external `*.test.js` files or dedicated test modules, not piled into production implementation.
- Unit tests cover pure core. Entry tests cover orchestration contracts. Guard scripts cover dependency direction, visibility, forbidden direct calls, storage ownership, old-path removal, and multi-exit consistency.
- Multiple exits for the same business question, such as UI, statistics, scheduler, monitor, battle routing, and write routing, must share one decision point and have consistency coverage.

## Execution Rhythm

- Start substantial work with zoom-out: module graph, imports/exports, entry points, callers, callees, storage/DOM/API reads and writes, business vocabulary, and drift evidence.
- State the selected boundary before editing: business abstraction, old-path retirement, public-surface reduction, type invariant, regression guard, or mechanical hygiene.
- Treat mechanical hygiene as batch work only. If the work becomes a low-value file-by-file loop, stop and reselect a higher-level business boundary.
- Converge the business entry first, then hide implementation, remove old paths, and add regression locks.
- Use narrow verification first, then full build when the boundary is ready.
- Do not touch unrelated dirty worktree files. In this project, leave untracked `BUSINESS-MAP.md` alone unless explicitly asked.
- Each clear business boundary gets an independent commit. After committing, attempt `git push backup main` and verify `HEAD`, `main`, `backup/main`, and `refs/remotes/backup/main`; if the `backup` remote is absent, report that explicitly.

## Goal Hygiene

- Keep the persistent goal as a single-line objective. Detailed refactoring rules live in this file, not in the goal text.
