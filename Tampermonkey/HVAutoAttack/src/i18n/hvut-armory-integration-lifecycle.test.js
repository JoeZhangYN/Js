import { describe, expect, it, vi } from "vitest";
import {
  ArmoryCategoryStatus,
  ArmoryIntegrationEvent,
  createArmoryIntegrationCapability,
} from "./hvut-armory-integration.js";
import { ArmoryPageKind } from "./hvut-armory-page-reader.js";

const categories = [{ key: "weapon_1handed" }, { key: "armor_heavy" }];

function table(category) {
  return {
    kind: ArmoryPageKind.TABLE,
    category,
    table: {},
    facts: { dynjs_eqstore: { [category.key]: {} }, eqitems: {}, itemdata: {} },
    detail: { category: category.key },
  };
}

function setup(overrides = {}) {
  const deps = {
    readCategories: vi.fn(() => categories),
    pageReader: { read: vi.fn(async ({ category }) => table(category)) },
    stageCategory: vi.fn(async (page) => ({
      kind: "table",
      category: page.category.key,
      equiplist: [page.category.key],
      facts: page.facts,
    })),
    commit: vi.fn(),
    beginLoading: vi.fn(),
    reportCategory: vi.fn(),
    restoreLoading: vi.fn(),
    completeLoading: vi.fn(),
    preserve: vi.fn(),
    retranslate: vi.fn(),
    recordFailure: vi.fn(),
    wait: vi.fn(),
    ...overrides,
  };
  return { deps, capability: createArmoryIntegrationCapability(deps) };
}

describe("HVUT Armory integration loading lifecycle", () => {
  it("retries transient failures once and stops after the same cause repeats", async () => {
    const oneCategory = [categories[0]];
    const pageReader = {
      read: vi.fn().mockResolvedValue({
        kind: ArmoryPageKind.LIMITED,
        category: oneCategory[0],
        detail: { category: oneCategory[0].key },
      }),
    };
    const { deps, capability } = setup({
      readCategories: vi.fn(() => oneCategory),
      pageReader,
    });

    const result = await capability.run({
      type: ArmoryIntegrationEvent.INTEGRATE_ALL,
      screen: "sell",
    });

    expect(pageReader.read).toHaveBeenCalledTimes(2);
    expect(deps.wait).toHaveBeenCalledWith(1200);
    expect(result.outcome).toBe("failed");
    expect(deps.preserve).toHaveBeenCalledOnce();
  });

  it("retryFailed only reloads categories that failed previously", async () => {
    const { deps, capability } = setup();
    deps.pageReader.read
      .mockResolvedValueOnce(table(categories[0]))
      .mockResolvedValueOnce({
        kind: ArmoryPageKind.UNEXPECTED_PAGE,
        category: categories[1],
        detail: { category: categories[1].key },
      })
      .mockResolvedValueOnce(table(categories[1]));
    await capability.run({ type: ArmoryIntegrationEvent.INTEGRATE_ALL, screen: "sell" });
    deps.pageReader.read.mockClear();

    const result = await capability.run({
      type: ArmoryIntegrationEvent.RETRY_FAILED,
      screen: "sell",
    });

    expect(deps.pageReader.read).toHaveBeenCalledOnce();
    expect(deps.pageReader.read.mock.calls[0][0].category.key).toBe("armor_heavy");
    expect(deps.beginLoading).toHaveBeenLastCalledWith({
      screen: "sell",
      categories: [categories[1]],
      retrying: true,
    });
    expect(result).toMatchObject({ outcome: "complete", retrying: true });
  });

  it("keeps the async loop alive when one category stage throws", async () => {
    const { deps, capability } = setup();
    deps.stageCategory.mockRejectedValueOnce(new Error("detached row failed"));

    const result = await capability.run({
      type: ArmoryIntegrationEvent.INTEGRATE_ALL,
      screen: "sell",
    });

    expect(deps.pageReader.read).toHaveBeenCalledTimes(2);
    expect(deps.reportCategory.mock.calls.map(([progress]) => progress.status)).toEqual([
      ArmoryCategoryStatus.FAILED,
      ArmoryCategoryStatus.STAGED,
    ]);
    expect(result).toMatchObject({
      outcome: "partial",
      failures: [{ category: "weapon_1handed", reason: "categoryExecutionFailed" }],
    });
    expect(deps.commit).toHaveBeenCalledOnce();
  });

  it("restores the original table when final commit throws", async () => {
    const { deps, capability } = setup({
      commit: vi.fn().mockRejectedValue(new Error("commit failed")),
    });

    await expect(
      capability.run({ type: ArmoryIntegrationEvent.INTEGRATE_ALL, screen: "sell" })
    ).rejects.toThrow("commit failed");

    expect(deps.restoreLoading).toHaveBeenCalledWith({ outcome: "aborted", retrying: false });
    expect(deps.completeLoading).not.toHaveBeenCalled();
  });
});
