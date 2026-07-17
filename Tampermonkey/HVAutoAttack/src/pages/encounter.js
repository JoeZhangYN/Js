import { EncounterCheckMode } from "./encounter-check-mode.js";
import {
  completeRandomEncounter,
  recognizeRandomEncounterStarted,
} from "./encounter-battle-lifecycle.js";
import { showEncounterGenerationBlock } from "./encounter-generation-block.js";
import { classifyEncounterGenerationResult } from "./encounter-generation-result.js";
import { runEncounterLobbyFlow } from "./encounter-lobby-flow.js";
import { rejectUnknownEncounterEvent } from "./encounter-rejection.js";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";
import { runEncounterWidgetFlow } from "./encounter-widget-flow.js";

const EVENT_LOBBY_TICK = "lobbyTick";
const EVENT_BATTLE_SESSION_STARTED = "battleSessionStarted";
const EVENT_BATTLE_SESSION_TERMINAL = "battleSessionTerminal";
const EVENT_GENERATION_PAGE_READY = "generationPageReady";
const EVENT_WIDGET_TICK = "widgetTick";
const EVENT_WIDGET_LINK_FOUND = "widgetLinkFound";
const EVENT_WIDGET_RESET_DAY = "widgetResetDay";
const EVENT_WIDGET_CLICKED = "widgetClicked";
const EVENT_WIDGET_NEWS_LOADED = "widgetNewsLoaded";
const EVENT_WIDGET_GENERATION_FAILED = "widgetGenerationFailed";

export const EncounterEvent = Object.freeze({
  LOBBY_TICK: EVENT_LOBBY_TICK,
  BATTLE_SESSION_STARTED: EVENT_BATTLE_SESSION_STARTED,
  BATTLE_SESSION_TERMINAL: EVENT_BATTLE_SESSION_TERMINAL,
  GENERATION_PAGE_READY: EVENT_GENERATION_PAGE_READY,
  WIDGET_TICK: EVENT_WIDGET_TICK,
  WIDGET_LINK_FOUND: EVENT_WIDGET_LINK_FOUND,
  WIDGET_RESET_DAY: EVENT_WIDGET_RESET_DAY,
  WIDGET_CLICKED: EVENT_WIDGET_CLICKED,
  WIDGET_NEWS_LOADED: EVENT_WIDGET_NEWS_LOADED,
  WIDGET_GENERATION_FAILED: EVENT_WIDGET_GENERATION_FAILED,
});

export { EncounterLobbyStatus } from "./encounter-lobby-outcome.js";

function handleGenerationPageReady(event) {
  const generation = runEncounterStateAutomation({
    type: EncounterStateEvent.RECORD_GENERATION_RESULT,
    result: classifyEncounterGenerationResult(event),
    request: event.request,
    source: event.source,
    checkMode: EncounterCheckMode.AUTOMATIC,
    nowMs: event.nowMs,
  });
  return { ...showEncounterGenerationBlock(generation, event.source), generation };
}

const encounterEventHandlers = Object.freeze({
  [EVENT_LOBBY_TICK]: runEncounterLobbyFlow,
  [EVENT_BATTLE_SESSION_STARTED]: recognizeRandomEncounterStarted,
  [EVENT_BATTLE_SESSION_TERMINAL]: completeRandomEncounter,
  [EVENT_GENERATION_PAGE_READY]: handleGenerationPageReady,
  [EVENT_WIDGET_TICK]: runEncounterWidgetFlow,
  [EVENT_WIDGET_LINK_FOUND]: runEncounterWidgetFlow,
  [EVENT_WIDGET_RESET_DAY]: runEncounterWidgetFlow,
  [EVENT_WIDGET_CLICKED]: runEncounterWidgetFlow,
  [EVENT_WIDGET_NEWS_LOADED]: runEncounterWidgetFlow,
  [EVENT_WIDGET_GENERATION_FAILED]: runEncounterWidgetFlow,
});

export function runEncounterAutomation(event = { type: EVENT_LOBBY_TICK }) {
  const handler = encounterEventHandlers[event?.type];
  if (!handler) return rejectUnknownEncounterEvent(event);
  return handler(event);
}
