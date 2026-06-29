import { checkCondition } from "../../settings/condition-eval.js";

export function decideFlee(opt, snap) {
  if (!opt.autoFlee || !checkCondition(opt.fleeCondition, snap)) return { kind: "noop" };
  return { kind: "flee-command" };
}
