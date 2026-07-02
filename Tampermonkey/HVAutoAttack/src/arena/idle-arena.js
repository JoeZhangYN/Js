// 闲置自动挑战 Arena/RoB/GrindFest：唯一入口 runIdleArenaAutomation(event)。
import { setValue, getValue, delValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { _alert } from "../core/lang.js";
import { post } from "../dom/http.js";
import { NavigationEvent, NavigationReloadReason, runNavigationAutomation } from "../core/navigate.js";
import { pollUntil } from "../core/poll.js";
import { isIsekai } from "../env.js";
import { StaminaEvent, runStaminaAutomation } from "../state/stamina.js";
import { DayRecordEvent, runDayRecordAutomation } from "../state/day-record.js";
import { IDLE_ARENA_TOKEN_URLS, collectIdleArenaToken } from "./idle-arena-token.js";
import { recordIdleArenaFailure } from "./idle-arena-failure.js";

const EVENT_SCHEDULE_NEXT_BATTLE = "scheduleNextBattle";
const EVENT_START_NEXT_BATTLE = "startNextBattle";
const EVENT_RESET_PROGRESS = "resetProgress";

export const IdleArenaEvent = Object.freeze({
  SCHEDULE_NEXT_BATTLE: EVENT_SCHEDULE_NEXT_BATTLE,
  START_NEXT_BATTLE: EVENT_START_NEXT_BATTLE,
  RESET_PROGRESS: EVENT_RESET_PROGRESS,
});

const idleArenaEventHandlers = Object.freeze({
  [EVENT_SCHEDULE_NEXT_BATTLE]: () => scheduleNextBattle(),
  [EVENT_START_NEXT_BATTLE]: () => startNextBattle(),
  [EVENT_RESET_PROGRESS]: () => resetProgress(),
});

function reloadCurrentPage() {
  runNavigationAutomation({
    type: NavigationEvent.RELOAD_NOW,
    reason: NavigationReloadReason.PAGE_REFRESH,
  });
}

function readIdleArenaOption(key, fallback) {
  return runOptionAutomation({ type: OptionEvent.READ_FIELD, key, fallback });
}

function scheduleNextBattle() {
  const idleSeconds = Number(readIdleArenaOption("idleArenaTime", 0)) || 0;
  setTimeout(
    () => runIdleArenaAutomation({ type: EVENT_START_NEXT_BATTLE }),
    ((idleSeconds * (Math.random() * 20 + 90)) / 100) * 1000
  );
}

function resetProgress() {
  delValue(STORAGE_KEYS.ARENA);
}

function recordIdleArenaRequestFailure(stage, arena, failure) {
  const evidence = { capability: "idleArena", source: "idleArena", stage, failure };
  recordIdleArenaFailure(evidence);
  setValue(STORAGE_KEYS.ARENA, { ...arena, requestFailure: evidence });
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
      recordIdleArenaRequestFailure("token-fetch", arena, failure);
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
    // 轮询至 4 个 token POST 全部返回 → 存档 + 重入 idleArena
    pollUntil(() => arena.token.length >= 4 || tokenFailed).then(() => {
      if (tokenFailed) return;
      setValue(STORAGE_KEYS.ARENA, arena);
      setTimeout(startNextBattle, 200);
    });
    return;
  }
  arena.done = arena.done || [];
  arena.array = String(readIdleArenaOption("idleArenaValue", ""))
    .split(",")
    .filter((id) => (id === "gr" || isNaN(id * 1) ? arena.gr > 0 : !arena.done.includes(id)));
  if (arena.array.length === 0) return;
  if (runStaminaAutomation({ type: StaminaEvent.SHOULD_RESTORE_FOR_IDLE_ARENA })) {
    runStaminaAutomation({ type: StaminaEvent.CLAIM_RECOVERY });
    return;
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
    setValue(STORAGE_KEYS.ARENA, arena);
    return;
  }
  document.title = _alert(-1, "闲置竞技场", "閒置競技場開始", "Idle Arena start");
  if (arena.array[0] === "gr" && arena.gr <= 0) {
    arena.array.splice(0, 1);
    setValue(STORAGE_KEYS.ARENA, arena);
    startNextBattle();
    return;
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
      setValue(STORAGE_KEYS.ARENA, arena);
      reloadCurrentPage();
    },
    isIsekai
      ? `initid=${String(id)}&postoken=${arena.token.postoken}`
      : `initid=${String(id)}&postoken=${arena.token.postoken}`,
    undefined,
    (failure) => recordIdleArenaRequestFailure("battle-start", arenaBeforeStart, failure)
  );
}

export function runIdleArenaAutomation(event = { type: EVENT_START_NEXT_BATTLE }) {
  return idleArenaEventHandlers[event?.type]?.(event) ?? false;
}
