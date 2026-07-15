// Exactly-once submit gate: the first click is paused until optional sample persistence reaches a
// durable result (written/rejected/failed) or a classified bounded timeout, then one released click
// is allowed through.
export function createRiddleSubmitGate({
  persistAttempt,
  releaseSubmit,
  recordAttempt,
  onFailure,
  timeoutMs = 5000,
  setTimer = globalThis.setTimeout,
  clearTimer = globalThis.clearTimeout,
}) {
  let state = "idle";

  async function waitForPersistence() {
    let timeout;
    try {
      await Promise.race([
        Promise.resolve(persistAttempt()),
        new Promise((_, reject) => {
          timeout = setTimer(
            () => reject(new Error(`riddle sample persistence timed out after ${timeoutMs}ms`)),
            timeoutMs
          );
        }),
      ]);
    } finally {
      clearTimer(timeout);
    }
  }

  async function persistThenRelease() {
    try {
      await waitForPersistence();
    } catch (error) {
      onFailure?.(error);
    } finally {
      state = "releaseNext";
      try {
        releaseSubmit();
      } catch (error) {
        state = "completed";
        onFailure?.(error);
      }
    }
  }

  function handleClick(event) {
    if (state === "releaseNext") {
      state = "completed";
      return true;
    }
    if (state === "completed") return true;
    event?.preventDefault?.();
    event?.stopImmediatePropagation?.();
    if (state === "persisting") return false;
    state = "persisting";
    recordAttempt?.();
    void persistThenRelease();
    return false;
  }

  return Object.freeze({ handleClick, inspect: () => state });
}
