import { checkCondition } from "../../settings/condition-eval.js";

export function decideDefend(opt, snap) {
  if (!opt.defend || !checkCondition(opt.defendCondition, snap)) return { kind: "noop" };
  return { kind: "click", selector: "#ckey_defend" };
}
