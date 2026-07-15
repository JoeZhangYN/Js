import { beforeEach, describe, expect, it, vi } from "vitest";
import { StorageWriteOutcome } from "./storage-io-policy.js";
import { STAMINA_LOSS_LOG_FAILURE_KEY } from "./stamina-loss-log-failure.js";
import { createStaminaLossStoreCapability, StaminaLossStoreEvent } from "./stamina-loss-store.js";

beforeEach(() => {
  sessionStorage.clear();
});

function failingCapability(method, message) {
  const adapter = {
    append: async () => ({ outcome: StorageWriteOutcome.WRITTEN }),
    list: async () => [],
    clear: async () => ({ outcome: StorageWriteOutcome.DELETED }),
  };
  adapter[method] = async () => {
    throw new Error(message);
  };
  return createStaminaLossStoreCapability(
    { dbName: "failure-test", sourceIdentity: "test:stamina" },
    { adapter, recordIo: () => undefined, now: () => 1 }
  );
}

describe("stamina loss log persistence failures", () => {
  it("returns a failed outcome and evidence when append fails", async () => {
    const capability = failingCapability("append", "stamina append blocked");

    expect(
      await capability.run({ type: StaminaLossStoreEvent.APPEND, amount: 7, stamp: "blocked" })
    ).toMatchObject({ outcome: StorageWriteOutcome.FAILED });
    expect(JSON.parse(sessionStorage.getItem(STAMINA_LOSS_LOG_FAILURE_KEY))).toMatchObject({
      capability: "staminaLossLog",
      stage: "append",
      failure: { kind: "storageWrite", error: "stamina append blocked" },
    });
  });

  it("returns a failed outcome and evidence when clear fails", async () => {
    const capability = failingCapability("clear", "stamina clear blocked");

    expect(await capability.run({ type: StaminaLossStoreEvent.CLEAR })).toMatchObject({
      outcome: StorageWriteOutcome.FAILED,
    });
    expect(JSON.parse(sessionStorage.getItem(STAMINA_LOSS_LOG_FAILURE_KEY))).toMatchObject({
      stage: "clear",
      failure: { error: "stamina clear blocked" },
    });
  });

  it("does not throw when diagnostic session storage is unavailable", async () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === STAMINA_LOSS_LOG_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    const capability = failingCapability("append", "stamina append blocked");

    await expect(
      capability.run({ type: StaminaLossStoreEvent.APPEND, amount: 7, stamp: "blocked" })
    ).resolves.toMatchObject({ outcome: StorageWriteOutcome.FAILED });
  });
});
