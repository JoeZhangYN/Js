# HVAutoAttack — Project-Level Codex Rules

> Global workflow rules live in `~/.codex/AGENTS.md` (meta-principle, operating priority order, cross-cutting constraints, L3 reference). This file holds only HVAutoAttack-specific goals and constraints. Migrated from the global file on 2026-07-02 (project-specific content does not belong in the global file).

## Current Corrected Working Goal (battle pipeline)

For HVAutoAttack battle pipeline work, the current corrected working goal is:

`鲁棒化 HVAutoAttack battle action pipeline：以 2026 agentic fast-flow 收敛为目标，入口先完成 Main/Isekai 等业务身份分流和 authority 选择，再对齐动作决策、执行、API 响应、导航恢复阶段；同一业务问题必须合并到唯一入口，保留 typed segment context、真实 acted 语义、结构化失败证据、重复失败熔断、fitness-function 回归守卫，并删除旧散落路径。`

Treat this as the corrected working goal per global §1 (Correct The Working Goal First): execute against it, keep it visible in status updates, and update it here when the user corrects direction again.

## Project Notes

- Segment identities for this codebase: Main / Isekai (and any future world/mode variants). The ingress classifier owns endpoint base, storage namespace, recovery route, DOM surface, and audit identity per segment — downstream steps consume typed segment context only (global §Identity Segmentation And Convergence Loop applies).
- Business flow map and vocabulary: see `BUSINESS-MAP.md`. Open handoffs: `HANDOFF-abstraction.md`, `HANDOFF-dedup-refactor.md`, `HANDOFF-i18n.md`.

## Core Direction

- Organize code by business identity, business question, and decision ownership, not by technical folders, duplicated code shape, helper shape, table/API/storage names, transport, or file location.
- A valid abstraction is one named business decision point with typed inputs, typed outputs, live consumers, and old decision paths removed, hidden, replaced, or mechanically blocked.
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
- If later correction, recovery, audit, UI, or statistics need to explain why a ruling happened, preserve that reason in a decision type, evidence value, audit value, persisted decision, or behavior test.

## Abstraction Rules

- Judge the abstraction axis before editing.
- Repetition axis: prefer helper, derivation, internalization, or smart constructor.
- Dependency-direction axis: use trait-like ports or adapters only for real IO boundaries, multiple adapters/drivers, replaceable implementations, or independent evolution.
- Same-business-question axis: converge to one business query, command, or orchestration entry even when code is not textually duplicated.
- Do not create single-implementation fake ports, fake hexagonal folders, or uncalled public abstractions.
- Helper extraction is not L3 progress if it only wraps repeated string/field/selector filtering while callers still decide what the result means.
- Every new abstraction needs a live consumer and bridge removal: delete, hide, replace, deprecate with a failing guard, or block old direct reads, old predicates, old decision dialects, bypass flags, and implementation-detail calls.

## Defensive And Offensive Gates

- Prevent fake cohesion: split a module that welds different bounded contexts, lifecycles, IO rhythms, evolution reasons, or business questions.
- Prevent fake decoupling: a separated helper/port/adapter is not a real boundary if runtime replacement would still require consumer awareness.
- Prevent hard abstraction islands: abstractions must map to a real business concept and consumed business flow.
- Prevent forced migration: same names, fields, or flow shape are only recall signals; prove the same business question before merging.
- Converge business capability queries when multiple implementations, readings, decision dialects, or exits answer the same question.
- Converge business orchestration so a reader can understand the business flow through one entry, with decision order and capability composition visible there.

## Visibility, Entries, And Naming

- Outside a capability, consumers should see only the unique business entry and event/decision types required to call it.
- Inside a capability, implementation defaults to private or module-local unless it is itself a lower-level capability entry.
- One orchestration entry must stay thin. Split internals into small step files or pure helpers inside the same capability before creating new top-level capabilities.
- Escalate a step into a separate capability only at a real boundary: independent IO, multiple adapters or drivers, separate business identity, separate lifecycle, or independent cross-module evolution.
- Names, events, decisions, tests, help text, comments, and guard messages must match actual business behavior.

## Failure Evidence And Recovery

- Success/failure semantics are part of the business contract. Do not return, persist, log, or propagate success unless the authoritative side effect actually happened.
- Classify command results and external responses at the earliest stable boundary, then pass typed decisions downstream.
- Any reload, redirect, retry, pause, fallback, state discard, or user-visible recovery must route through one recovery orchestration entry for that business capability.
- Naked recovery calls are forbidden. Do not call `reload`, `redirect`, `continue`, `return true`, or `catch {}` as generic escape hatches without a typed reason, stage, source identity, action/request shape, response classification, and recovery decision.
- Repeated same-cause recovery must stop, pause, or escalate with evidence instead of looping indefinitely.
- Diagnostic evidence needed after navigation, reload, process restart, or database rebuild must be persisted or handed off structurally before the recovery action.
- `outside`, `unknown`, `external`, and similar fallback reasons are temporary containment signals only. Treat them as boundary failures to converge into typed reasons with evidence.

## Regression Locks And Tests

- Every boundary fix, entry convergence, old-path removal, or invariant internalization must answer what prevents reintroduction in three months.
- Prefer module visibility, typed events/decisions, exhaustive dispatch, smart constructors, and behavior tests first; then lint/verify scripts; then docs.
- Tests belong in external `*.test.js` files or dedicated test modules, not piled into production implementation.
- Unit tests cover pure core. Entry tests cover orchestration contracts. Guard scripts cover dependency direction, visibility, forbidden direct calls, storage ownership, old-path removal, and multi-exit consistency.
- Multiple exits for the same business question, such as UI, statistics, scheduler, monitor, battle routing, and write routing, must share one decision point and have consistency coverage.

## Execution Rhythm

- Start substantial work with zoom-out: module graph, imports/exports, entry points, callers, callees, storage/DOM/API reads and writes, business vocabulary, and drift evidence.
- State the selected boundary before editing: business abstraction, old-path retirement, public-surface reduction, type invariant, regression guard, or mechanical hygiene.
- Run project-framework self-maintenance before and after the boundary edit: identify whether the current framework let this bug class happen, whether ingress classification / segment authority / recovery evidence / guard placement should move, and which same-business-question or repeated-flow candidates became visible.
- When project rules, architecture prompts, or corrected working goals change, update the callback reference in `BUSINESS-MAP.md` in the same boundary so future turns can resume from a business-map anchor instead of rediscovering intent from chat history.
- Treat mechanical hygiene as batch work only. If the work becomes a low-value file-by-file loop, stop and reselect a higher-level business boundary.
- Converge the business entry first, then hide implementation, remove old paths, and add regression locks.
- Preserve existing business capability explicitly: every fix must state which old behaviors remain authoritative, add or keep behavior tests for them, and avoid claiming completion from compile/build success alone.
- Use narrow verification first, then full build when the boundary is ready.
- Do not touch unrelated dirty worktree files. Leave untracked `BUSINESS-MAP.md` alone unless explicitly asked.
- Each clear business boundary gets an independent commit. After committing, attempt `git push backup main` and verify `HEAD`, `main`, `backup/main`, and `refs/remotes/backup/main`; if the `backup` remote is absent, report that explicitly.

## Project-Framework Self-Maintenance

Every non-trivial business fix must maintain the framework that makes future fixes safer:

- Classify the failure as framework drift when the bug came from a missing ingress identity, mixed segment authority, duplicated decision dialect, untyped recovery, missing persisted evidence, or a guard that still anchors to an old path.
- Update the framework in the same boundary when possible: page/world classifier, capability entry, typed context, recovery entry, diagnostic evidence, verify script, business map, or project rule.
- Keep framework artifacts synchronized: any change to `AGENTS.md` project rules, corrected goals, or architecture prompts must either update `BUSINESS-MAP.md` `Framework Drift Callback Index` or explicitly state in the commit/final why no business-map callback changed.
- Self-discover abstraction candidates exposed by the fix: repeated page-type checks, parallel storage namespaces, duplicated endpoint derivation, multiple exits for one business question, or repeated recovery loops must be recorded as the next boundary or converged immediately if narrow.
- Do not regress original business capability during convergence. Tests or guards must cover both the new failure path and the previously working behavior that the abstraction could accidentally erase.
- Completion evidence must separate layers: current files changed, old path blocked, behavior tests, guard/build result, runtime diagnostic evidence if relevant, commit and backup ref verification.

## Current Review Guardrails

- Explicit unknown events on side-effecting entries should reject or no-op with typed evidence. Do not default explicit unknown events to lobby ticks, battle starts, riddle answering, navigation, reload, or POST effects.
- HTTP/transport wrappers must classify non-2xx responses and final network failures; callers must not report continuation success without callback/effect evidence.
- Encounter unavailable UI must require typed `unavailableReason === "equipmentInventoryFull"` before showing equipment-capacity prompts.
- Encounter countdown/count writes must require authoritative encounter entry or battle-start evidence; page refresh, root page load, news-key probing, unsupported isekai entry, and failed navigation must not advance encounter state.
- HVUT evidence-backed failures must surface through copyable diagnostics, not naked alert or console-only reporting.

## Goal Hygiene

- Keep persistent goals as single-line objectives. Detailed refactoring rules live in this file, not in goal text.
