import { describe, expect, it, vi } from "vitest";
import {
  ArmoryCategoryStatus,
  ArmoryIntegrationEvent,
  createArmoryIntegrationCapability,
} from "./hvut-armory-integration.js";
import { ArmoryPageKind } from "./hvut-armory-page-reader.js";

const categories = [{ key: "weapon_1handed" }, { key: "armor_heavy" }];

function setup(overrides = {}) {
  const deps = {
    readCategories: vi.fn(() => categories),
    pageReader: { read: vi.fn() },
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
    schedule: vi.fn((task) => task()),
    wait: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return { deps, capability: createArmoryIntegrationCapability(deps) };
}

function table(category) {
  return {
    kind: ArmoryPageKind.TABLE,
    category,
    table: {},
    facts: { dynjs_eqstore: { [category.key]: {} }, eqitems: {}, itemdata: {} },
    detail: { category: category.key },
  };
}

describe("HVUT Armory integration capability", () => {
  it("arranges category reads asynchronously, stages off-DOM, then commits once", async () => {
    const { deps, capability } = setup();
    deps.pageReader.read.mockImplementation(async ({ category }) => table(category));

    const result = await capability.run({
      type: ArmoryIntegrationEvent.INTEGRATE_ALL,
      screen: "sell",
    });

    expect(result.outcome).toBe("complete");
    expect(deps.pageReader.read.mock.calls.map(([event]) => event.category.key)).toEqual([
      "weapon_1handed",
      "armor_heavy",
    ]);
    expect(deps.schedule.mock.calls.map(([, delay]) => delay)).toEqual([0, 300]);
    expect(deps.beginLoading).toHaveBeenCalledWith({
      screen: "sell",
      categories,
      retrying: false,
    });
    expect(deps.beginLoading.mock.invocationCallOrder[0]).toBeLessThan(
      deps.pageReader.read.mock.invocationCallOrder[0]
    );
    expect(deps.reportCategory.mock.calls.map(([progress]) => progress.status)).toEqual([
      ArmoryCategoryStatus.STAGED,
      ArmoryCategoryStatus.STAGED,
    ]);
    expect(deps.commit).toHaveBeenCalledOnce();
    expect(deps.commit.mock.calls[0][0].stages).toHaveLength(2);
    expect(deps.commit.mock.calls[0][0].stages.map((stage) => stage.facts)).toEqual([
      table(categories[0]).facts,
      table(categories[1]).facts,
    ]);
    expect(deps.preserve).not.toHaveBeenCalled();
    expect(deps.completeLoading).toHaveBeenCalledOnce();
    expect(deps.retranslate).toHaveBeenCalledOnce();
  });

  it("keeps successful categories visible and reports a partial outcome", async () => {
    const { deps, capability } = setup();
    deps.pageReader.read
      .mockResolvedValueOnce(table(categories[0]))
      .mockResolvedValueOnce({
        kind: ArmoryPageKind.UNEXPECTED_PAGE,
        category: categories[1],
        detail: { category: categories[1].key, finalUrl: "https://example.invalid/" },
      });

    const result = await capability.run({
      type: ArmoryIntegrationEvent.INTEGRATE_ALL,
      screen: "sell",
    });

    expect(result).toMatchObject({
      outcome: "partial",
      failures: [{ category: "armor_heavy", reason: ArmoryPageKind.UNEXPECTED_PAGE }],
    });
    expect(deps.commit).toHaveBeenCalledWith(expect.objectContaining({ outcome: "partial" }));
    expect(deps.preserve).not.toHaveBeenCalled();
  });

  it("preserves the existing table when every response is unexpected", async () => {
    const { deps, capability } = setup();
    deps.pageReader.read.mockImplementation(async ({ category }) => ({
      kind: ArmoryPageKind.UNEXPECTED_PAGE,
      category,
      detail: { category: category.key },
    }));

    const result = await capability.run({
      type: ArmoryIntegrationEvent.INTEGRATE_ALL,
      screen: "sell",
    });

    expect(result.outcome).toBe("failed");
    expect(deps.commit).not.toHaveBeenCalled();
    expect(deps.restoreLoading).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "failed" })
    );
    expect(deps.preserve).toHaveBeenCalledWith(expect.objectContaining({ outcome: "failed" }));
    expect(deps.restoreLoading.mock.invocationCallOrder[0]).toBeLessThan(
      deps.preserve.mock.invocationCallOrder[0]
    );
    expect(deps.retranslate).not.toHaveBeenCalled();
  });

});
