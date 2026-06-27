import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RiddleSubmissionTimingEvent,
  runRiddleSubmissionTiming,
} from "./riddle-submission-timing.js";

beforeEach(() => {
  document.body.innerHTML = "";
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("riddle submission timing", () => {
  it("reads M:SS countdown text", () => {
    document.body.innerHTML = '<div id="riddlecounter">2:30</div>';

    expect(
      runRiddleSubmissionTiming({ type: RiddleSubmissionTimingEvent.READ_REMAINING })
    ).toBe(150);
  });

  it("submits ML answers after the humanized delay without waiting for the end", async () => {
    const submit = vi.fn();
    runRiddleSubmissionTiming({
      type: RiddleSubmissionTimingEvent.START,
      beforeEnd: 3,
      mlAnswers: ["ts"],
      mlDelayMs: 3000,
      fallbackAnswers: () => ["ra"],
      readRemaining: () => 120,
      submit,
    });

    await vi.advanceTimersByTimeAsync(2999);
    expect(submit).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(submit).toHaveBeenCalledWith(["ts"], "ML");
  });

  it("falls back when countdown is unreadable five times", async () => {
    const submit = vi.fn();
    runRiddleSubmissionTiming({
      type: RiddleSubmissionTimingEvent.START,
      fallbackAnswers: () => ["pp"],
      readRemaining: () => NaN,
      submit,
    });

    await vi.advanceTimersByTimeAsync(5000);
    expect(submit).toHaveBeenCalledWith(["pp"], "兜底·读不到倒计时");
  });

  it("uses ML answers at the countdown end if available", async () => {
    const submit = vi.fn();
    let mlAnswer = null;
    runRiddleSubmissionTiming({
      type: RiddleSubmissionTimingEvent.START,
      beforeEnd: 3,
      fallbackAnswers: () => ["aj"],
      getMlAnswers: () => mlAnswer,
      readRemaining: () => 3,
      submit,
    });
    mlAnswer = ["rd"];

    await vi.advanceTimersByTimeAsync(1000);
    expect(submit).toHaveBeenCalledWith(["rd"], "末端兜底");
  });

  it("cancels automatic submissions after an external manual submit", async () => {
    const submit = vi.fn();
    runRiddleSubmissionTiming({
      type: RiddleSubmissionTimingEvent.START,
      beforeEnd: 3,
      mlAnswers: ["ts"],
      mlDelayMs: 3000,
      fallbackAnswers: () => ["ra"],
      readRemaining: () => 2,
      submit,
    });

    expect(
      runRiddleSubmissionTiming({ type: RiddleSubmissionTimingEvent.EXTERNAL_SUBMITTED })
    ).toBe(true);

    await vi.advanceTimersByTimeAsync(5000);
    expect(submit).not.toHaveBeenCalled();
    expect(
      runRiddleSubmissionTiming({ type: RiddleSubmissionTimingEvent.EXTERNAL_SUBMITTED })
    ).toBe(false);
  });

  it("schedules ML submit through the same timing entry after start", async () => {
    const submit = vi.fn();
    runRiddleSubmissionTiming({
      type: RiddleSubmissionTimingEvent.START,
      fallbackAnswers: () => ["ra"],
      readRemaining: () => 120,
      submit,
    });

    expect(
      runRiddleSubmissionTiming({
        type: RiddleSubmissionTimingEvent.ML_ANSWERS_READY,
        mlAnswers: ["fs"],
        mlDelayMs: 2000,
      })
    ).toBe(true);

    await vi.advanceTimersByTimeAsync(1999);
    expect(submit).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(submit).toHaveBeenCalledWith(["fs"], "ML");
  });
});
