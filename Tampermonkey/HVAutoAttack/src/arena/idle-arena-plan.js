export function planIdleArenaBattle({ idleSeconds, nowMs, jitter }) {
  const boundedJitter = Math.max(0, Math.min(1, jitter));
  const delayMs = idleSeconds * (0.9 + boundedJitter * 0.2) * 1000;
  return Object.freeze({
    status: "planned",
    reason: "idleArenaDelay",
    delayMs,
    deadlineMs: nowMs + delayMs,
  });
}
