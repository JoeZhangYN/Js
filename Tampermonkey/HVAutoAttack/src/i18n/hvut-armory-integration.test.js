import { describe, expect, it, vi } from "vitest";
import {
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
    preserve: vi.fn(),
    retranslate: vi.fn(),
    recordFailure: vi.fn(),
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
  it("loads categories serially, stages off-DOM, then commits once", async () => {
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
    expect(deps.wait).toHaveBeenCalledWith(300);
    expect(deps.commit).toHaveBeenCalledOnce();
    expect(deps.commit.mock.calls[0][0].stages).toHaveLength(2);
    expect(deps.commit.mock.calls[0][0].stages.map((stage) => stage.facts)).toEqual([
      table(categories[0]).facts,
      table(categories[1]).facts,
    ]);
    expect(deps.preserve).not.toHaveBeenCalled();
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
    expect(deps.preserve).toHaveBeenCalledWith(expect.objectContaining({ outcome: "failed" }));
    expect(deps.retranslate).not.toHaveBeenCalled();
  });

  it("retries transient failures once and stops after the same cause repeats", async () => {
    const oneCategory = [categories[0]];
    const { deps, capability } = setup({ readCategories: vi.fn(() => oneCategory) });
    deps.pageReader.read.mockResolvedValue({
      kind: ArmoryPageKind.LIMITED,
      category: oneCategory[0],
      detail: { category: oneCategory[0].key },
    });

    const result = await capability.run({
      type: ArmoryIntegrationEvent.INTEGRATE_ALL,
      screen: "sell",
    });

    expect(deps.pageReader.read).toHaveBeenCalledTimes(2);
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
    expect(result).toMatchObject({ outcome: "complete", retrying: true });
  });
});
