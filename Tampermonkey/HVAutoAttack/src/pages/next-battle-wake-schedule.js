export function createNextBattleWakeSchedule({ onWake, onFailure }) {
  let scheduledWake = null;

  function cancel() {
    if (scheduledWake?.timer === undefined) return true;
    try {
      clearTimeout(scheduledWake.timer);
      scheduledWake = null;
      return true;
    } catch (error) {
      onFailure("cancelWake", error);
      return false;
    }
  }

  function arm(candidate, nowMs) {
    if (!candidate) return cancel();
    if (
      scheduledWake?.deadlineMs === candidate.deadlineMs &&
      scheduledWake?.owner === candidate.owner
    ) {
      return true;
    }
    if (!cancel()) return false;
    try {
      const timer = setTimeout(
        () => {
          scheduledWake = null;
          Promise.resolve(onWake()).catch((error) => onFailure("timerWake", error));
        },
        Math.max(1, candidate.deadlineMs - nowMs)
      );
      scheduledWake = { ...candidate, timer };
      return true;
    } catch (error) {
      onFailure("scheduleWake", error);
      scheduledWake = null;
      return false;
    }
  }

  return Object.freeze({ arm, cancel });
}
