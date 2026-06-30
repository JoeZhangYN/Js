import { decideSurvivalAction } from "./decide-survival-action.js";

export function survivalActionRules() {
  return [
    {
      name: "handleSurvival",
      decide: (snap, opt) => decideSurvivalAction(snap, opt),
    },
  ];
}
