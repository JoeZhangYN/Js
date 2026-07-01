export const NavigationReloadReason = Object.freeze({
  ACTION_WATCHDOG: "actionWatchdog",
  BATTLE_API_CALLBACK_FALLBACK: "battleApiCallbackFallback",
  BATTLE_HASH_CLEANUP: "battleHashCleanup",
  BATTLE_API_RESPONSE: "battleApiResponse",
  BATTLE_VICTORY: "battleVictory",
  FLEE_CONFIRMATION: "fleeConfirmation",
  KILL_BUG_RECOVERY: "killBugRecovery",
  MONSTER_STATUS_REPAIR: "monsterStatusRepair",
  PAGE_REFRESH: "pageRefresh",
  RIDDLE_POST_RESULT: "riddlePostResult",
  SETTINGS_CHANGE: "settingsChange",
  STAMINA_RECOVERY: "staminaRecovery",
  UNKNOWN_PAGE_REFRESH: "unknownPageRefresh",
  HV_UTILS_ABILITY_UNLOCK: "hvUtilsAbilityUnlock",
  HV_UTILS_CONFIG_SAVE: "hvUtilsConfigSave",
  HV_UTILS_MAIL_LOG_RESET: "hvUtilsMailLogReset",
  HV_UTILS_MONSTER_LAB_FORCE_UPDATE: "hvUtilsMonsterLabForceUpdate",
  HV_UTILS_MONSTER_LAB_LOG_RESET: "hvUtilsMonsterLabLogReset",
  HV_UTILS_PERSONA_DYNJS: "hvUtilsPersonaDynjs",
  HV_UTILS_TRAINING_NOTIFICATION: "hvUtilsTrainingNotification",
});

export const NavigationRedirectReason = Object.freeze({
  CROSS_SITE_ENCOUNTER: "crossSiteEncounter",
  ENCOUNTER_ENTRY: "encounterEntry",
  HV_UTILS_CHARACTER_SETTINGS: "hvUtilsCharacterSettings",
  HV_UTILS_DISABLE: "hvUtilsDisable",
  HV_UTILS_EQUIP_POPUP: "hvUtilsEquipPopup",
  HV_UTILS_MAIL_PAGE: "hvUtilsMailPage",
});

export const NavigationWindowReason = Object.freeze({ RIDDLE_POPUP: "riddlePopup" });
