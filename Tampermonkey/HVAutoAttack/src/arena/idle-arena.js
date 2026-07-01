// 闲置自动挑战 Arena/RoB/GrindFest：唯一入口 runIdleArenaAutomation(event)。
import { gE } from "../dom/query.js";
import { setValue, getValue, delValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { _alert } from "../core/lang.js";
import { post } from "../dom/http.js";
import {
  NavigationEvent,
  NavigationReloadReason,
  runNavigationAutomation,
} from "../core/navigate.js";
import { pollUntil } from "../core/poll.js";
import { isIsekai } from "../env.js";
import { StaminaEvent, runStaminaAutomation } from "../state/stamina.js";
import { DayRecordEvent, runDayRecordAutomation } from "../state/day-record.js";

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
    // iframe打开四个网站，设定四个判断值，同时true才继续
    const getToken = function (data, e) {
      {
        // postoken: both main-world and isekai read it (HV main-world arena uses postoken, verified 2026-06-09)
        const postokenInput = gE('input[name="postoken"]', data);
        if (postokenInput) arena.token.postoken = postokenInput.value;
      }
      if (e.target.responseURL.match(/ss=gr$/)) {
        const grImg = gE('img[src*="startgrindfest.png"]', data);
        if (grImg) {
          const match = grImg.getAttribute("onclick")?.match(/init_battle\(\d+,\s*'(.*?)'\)/);
          arena.token.gr = match ? match[1] : true;
        }
      } else {
        gE('img[src*="startchallenge.png"]', "all", data).forEach((_) => {
          const match = _.getAttribute("onclick")?.match(
            /init_battle\((\d+)(?:,\s*\d+(?:,\s*'(.*?)')?)?\)/
          );
          if (match) arena.token[match[1]] = match[2] || true;
        });
      }
      arena.token.length++;
    };
    post("?s=Battle&ss=gr", getToken);
    post("?s=Battle&ss=ar", getToken);
    post("?s=Battle&ss=ar&page=2", getToken);
    post("?s=Battle&ss=rb", getToken);
    // 轮询至 4 个 token POST 全部返回 → 存档 + 重入 idleArena
    pollUntil(() => arena.token.length >= 4).then(() => {
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
  if (arena.array[0] === "gr" && arena.gr > 0) {
    arena.gr--;
  } else {
    arena.done.push(arena.array[0]);
    arena.array.splice(0, 1);
  }
  setValue(STORAGE_KEYS.ARENA, arena);
  // token deprecated: main-world unified to postoken (same as isekai)
  if (id === "gr") id = 1;
  post(
    `?s=Battle&ss=${href}`,
    reloadCurrentPage,
    isIsekai
      ? `initid=${String(id)}&postoken=${arena.token.postoken}`
      : `initid=${String(id)}&postoken=${arena.token.postoken}`
  );
}

export function runIdleArenaAutomation(event = { type: EVENT_START_NEXT_BATTLE }) {
  const handler = idleArenaEventHandlers[event.type] || idleArenaEventHandlers[EVENT_START_NEXT_BATTLE];
  return handler(event);
}
