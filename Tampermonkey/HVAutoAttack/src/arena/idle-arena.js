// 闲置自动挑战 Arena/RoB/GrindFest：唯一入口 runIdleArenaAutomation(event)。
import { getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { _alert } from "../core/lang.js";
import { post } from "../dom/http.js";
import { pollUntil } from "../core/poll.js";
import { StaminaEvent, runStaminaAutomation } from "../state/stamina.js";
import { DayRecordEvent, runDayRecordAutomation } from "../state/day-record.js";
import { IDLE_ARENA_TOKEN_URLS, collectIdleArenaToken } from "./idle-arena-token.js";
import * as idleArenaFailure from "./idle-arena-failure.js";
import { planIdleArenaBattle } from "./idle-arena-plan.js";
import { IdleArenaStartStatus } from "./idle-arena-outcome.js";
import { reloadAfterIdleArenaBattle } from "./idle-arena-navigation.js";

const EVENT_PLAN_NEXT_BATTLE = "planNextBattle";
const EVENT_START_NEXT_BATTLE = "startNextBattle";
const EVENT_RESET_PROGRESS = "resetProgress";

export const IdleArenaEvent = Object.freeze({
  PLAN_NEXT_BATTLE: EVENT_PLAN_NEXT_BATTLE,
  START_NEXT_BATTLE: EVENT_START_NEXT_BATTLE,
  RESET_PROGRESS: EVENT_RESET_PROGRESS,
});

const idleArenaEventHandlers = Object.freeze({
  [EVENT_PLAN_NEXT_BATTLE]: (event) => planNextBattle(event),
  [EVENT_START_NEXT_BATTLE]: () => startNextBattle(),
  [EVENT_RESET_PROGRESS]: () => resetProgress(),
});

function readIdleArenaOption(key, fallback) {
  return runOptionAutomation({ type: OptionEvent.READ_FIELD, key, fallback });
}

function planNextBattle(event = {}) {
  const nowMs = event.nowMs ?? Date.now();
  const idleSeconds = Number(readIdleArenaOption("idleArenaTime", 0)) || 0;
  const jitter = Math.max(0, Math.min(1, event.jitter ?? Math.random()));
  return planIdleArenaBattle({ idleSeconds, nowMs, jitter });
}

function resetProgress() {
  return idleArenaFailure.clearPersistedIdleArenaProgress();
}

function startNextBattle() {
  let arena = getValue(STORAGE_KEYS.ARENA, true) || {};
  const dateNow = runDayRecordAutomation({ type: DayRecordEvent.SYNC_UTC_DATE });
  if (arena.date !== dateNow) {
    arena = {
      date: dateNow,
      gr: readIdleArenaOption("idleArenaGrTime", 0),
      done: [],
      token: {
        length: 0,
      },
    };
    let tokenFailed = false;
    const failTokenFetch = (failure) => {
      tokenFailed = true;
      idleArenaFailure.recordIdleArenaRequestFailure("token-fetch", arena, failure);
    };
    IDLE_ARENA_TOKEN_URLS.forEach((href) =>
      post(
        href,
        (data, e) => collectIdleArenaToken(arena, data, e),
        undefined,
        undefined,
        failTokenFetch
      )
    );
    // 轮询至 4 个 token POST 全部返回 → 存档，并交回下一战仲裁器复检。
    return pollUntil(() => arena.token.length >= 4 || tokenFailed).then(() => {
      if (tokenFailed) {
        return { status: IdleArenaStartStatus.FAILED, reason: "tokenFetchFailed" };
      }
      if (!idleArenaFailure.persistIdleArenaProgress("token-persist", arena)) {
        return { status: IdleArenaStartStatus.FAILED, reason: "tokenPersistenceFailed" };
      }
      return { status: IdleArenaStartStatus.PREPARED, reason: "tokensReady" };
    });
  }
  arena.done = arena.done || [];
  arena.array = String(readIdleArenaOption("idleArenaValue", ""))
    .split(",")
    .filter((id) => (id === "gr" || isNaN(id * 1) ? arena.gr > 0 : !arena.done.includes(id)));
  if (arena.array.length === 0) {
    return { status: IdleArenaStartStatus.UNAVAILABLE, reason: "noCandidate" };
  }
  if (runStaminaAutomation({ type: StaminaEvent.SHOULD_RESTORE_FOR_IDLE_ARENA })) {
    runStaminaAutomation({ type: StaminaEvent.CLAIM_RECOVERY });
    return { status: IdleArenaStartStatus.RECOVERY_REQUESTED, reason: "staminaRecovery" };
  }
  let href;
  let id;
  while (arena.array.length > 0) {
    id = arena.array[0] * 1;
    if (isNaN(id)) {
      href = "gr";
      id = "gr";
    } else if (id >= 105) {
      href = "rb";
    } else if (id >= 19) {
      href = "ar&page=2";
    } else {
      href = "ar";
    }
    if (!(id in arena.token)) {
      arena.array.splice(0, 1);
    } else {
      break;
    }
  }
  if (arena.array.length === 0) {
    idleArenaFailure.persistIdleArenaProgress("progress-persist", arena);
    return { status: IdleArenaStartStatus.UNAVAILABLE, reason: "noUsableToken" };
  }
  document.title = _alert(-1, "闲置竞技场", "閒置競技場開始", "Idle Arena start");
  if (arena.array[0] === "gr" && arena.gr <= 0) {
    arena.array.splice(0, 1);
    if (!idleArenaFailure.persistIdleArenaProgress("progress-persist", arena)) return;
    return startNextBattle();
  }
  const arenaBeforeStart = arena;
  if (arena.array[0] === "gr" && arena.gr > 0) {
    arena = { ...arena, gr: arena.gr - 1 };
  } else {
    arena = {
      ...arena,
      done: [...arena.done, arena.array[0]],
      array: arena.array.slice(1),
    };
  }
  // token deprecated: main-world unified to postoken (same as isekai)
  if (id === "gr") id = 1;
  post(
    `?s=Battle&ss=${href}`,
    () => {
      if (!idleArenaFailure.persistIdleArenaProgress("battle-start-persist", arena)) return;
      reloadAfterIdleArenaBattle();
    },
    `initid=${String(id)}&postoken=${arena.token.postoken}`,
    undefined,
    (failure) =>
      idleArenaFailure.recordIdleArenaRequestFailure("battle-start", arenaBeforeStart, failure)
  );
  return { status: IdleArenaStartStatus.BATTLE_REQUESTED, reason: "battleRequest", battleId: id };
}

export function runIdleArenaAutomation(event) {
  return idleArenaEventHandlers[event?.type]?.(event) ?? false;
}
