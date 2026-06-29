import { checkCondition } from "../../settings/condition-eval.js";

export function decideAutoPause(opt, snap) {
  if (!opt.autoPause || !checkCondition(opt.pauseCondition, snap)) return { kind: "noop" };
  return { kind: "pause" };
}
