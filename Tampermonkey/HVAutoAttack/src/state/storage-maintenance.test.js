import { describe, expect, it, vi } from "vitest";
import { PageKind } from "../pages/page-kind.js";
import { RiddleSampleMigrationEvent } from "./riddle-sample-migration.js";
import {
  createStorageMaintenanceCapability,
  StorageMaintenanceEvent,
} from "./storage-maintenance.js";

function harness(overrides = {}) {
  const migration = {
    preview: vi.fn(async () => ({ count: 2, bytes: 200, records: [] })),
    run: vi.fn(async () => ({ count: 2, completed: [] })),
  };
  const runRiddle = vi.fn(async (event) =>
    event.type === RiddleSampleMigrationEvent.PREVIEW
      ? { count: 1, bytes: 100, records: [] }
      : { count: 1, completed: [] }
  );
  const feedback = vi.fn((event) => event.type === "confirm");
  const view = { show: vi.fn() };
  const registerMenu = vi.fn();
  const capability = createStorageMaintenanceCapability({
    authority: {
      policy: { auditIdentity: "hv:persistent" },
      sources: [],
      receipts: {},
    },
    migration,
    runRiddle,
    feedback,
    view,
    registerMenu,
    detectPage: () => ({ kind: PageKind.LOBBY }),
    ...overrides,
  });
  return { capability, migration, runRiddle, feedback, view, registerMenu };
}

describe("storage maintenance operational entry", () => {
  it("previews both authorities and requires one confirmation before side effects", async () => {
    const { capability, migration, runRiddle, feedback } = harness();
    const result = await capability.run({ type: StorageMaintenanceEvent.CONFIRM_AND_RUN });

    expect(result).toMatchObject({ confirmed: true, count: 3 });
    expect(feedback).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "confirm",
        copy: expect.objectContaining({ l2: expect.stringContaining("Maximum 8 items or 8 MiB") }),
      })
    );
    expect(migration.run).toHaveBeenCalledOnce();
    expect(runRiddle).toHaveBeenLastCalledWith({
      type: RiddleSampleMigrationEvent.RUN_CONFIRMED,
      preview: expect.objectContaining({ count: 1 }),
    });
  });

  it("refuses battle pages before reading migration sources", async () => {
    const { capability, migration } = harness({
      detectPage: () => ({ kind: PageKind.BATTLE }),
    });

    await expect(capability.run({ type: StorageMaintenanceEvent.PREVIEW })).rejects.toMatchObject({
      recovery: "openLobbyAndRetry",
    });
    expect(migration.preview).not.toHaveBeenCalled();
  });

  it("registers migration and Edge acceptance commands exactly once", () => {
    const { capability, registerMenu } = harness();
    expect(capability.run({ type: StorageMaintenanceEvent.REGISTER_MENU })).toBe(true);
    expect(capability.run({ type: StorageMaintenanceEvent.REGISTER_MENU })).toBe(false);
    expect(registerMenu.mock.calls.map(([label]) => label)).toEqual([
      "存储维护：预览并迁移旧数据",
      "开始 Edge 存储 IO 验收（清零应用指标）",
      "查看 Edge 存储 IO 验收报告（可复制）",
    ]);
  });
});
