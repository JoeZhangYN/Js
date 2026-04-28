// IDE-only type hints for HV game globals injected via unsafeWindow.
// 不参与构建。

declare interface HvBattleInfo {
  mode: "magic" | "items" | "attack" | string;
  skill: string;
  [key: string]: unknown;
}

declare interface HvBattle {
  set_infopane_effect: (name: string, desc: string, turns: number) => void;
  [key: string]: unknown;
}

declare interface HvUnsafeWindow extends Window {
  info: HvBattleInfo;
  battle: HvBattle;
  Battle: new () => HvBattle;
}

declare const unsafeWindow: HvUnsafeWindow;
