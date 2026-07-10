import { describe, expect, it, vi } from "vitest";
import {
  ArmoryPageKind,
  createArmoryPageReader,
  readArmoryCategories,
} from "./hvut-armory-page-reader.js";

function response(html, { status = 200, url = "https://hentaiverse.org/isekai/?ok" } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    url,
    text: vi.fn().mockResolvedValue(html),
  };
}

function reader(fetchImpl) {
  return createArmoryPageReader({
    fetchImpl,
    document,
    baseUrl: "https://hentaiverse.org/isekai/?s=Bazaar&ss=am&screen=sell&filter=all",
  });
}

const category = { key: "weapon_1handed" };

describe("HVUT Armory page reader", () => {
  it("derives the ordered category catalog from the authoritative filterbar", () => {
    const bar = document.createElement("div");
    bar.innerHTML = [
      '<a href="?s=Bazaar&ss=am&screen=sell&filter=armor_heavy">Heavy</a>',
      '<a href="?s=Bazaar&ss=am&screen=sell&filter=all">All</a>',
      '<a href="?s=Bazaar&ss=am&screen=sell&filter=weapon_1handed">One</a>',
    ].join("");

    expect(readArmoryCategories(bar, "https://hentaiverse.org/isekai/").map((item) => item.key)).toEqual([
      "weapon_1handed",
      "armor_heavy",
    ]);
  });

  it("reads a category through an absolute same-origin URL and returns its table", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      response('<div id="equiplist"><table><tbody><tr data-eid="1"></tr></tbody></table></div>')
    );

    const result = await reader(fetchImpl).read({ screen: "sell", category });

    expect(result.kind).toBe(ArmoryPageKind.TABLE);
    expect(result.table.querySelector("tr").dataset.eid).toBe("1");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://hentaiverse.org/isekai/?s=Bazaar&ss=am&screen=sell&filter=weapon_1handed",
      { credentials: "same-origin" }
    );
  });

  it("distinguishes empty Armory pages from unexpected 200 responses", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(response('<div id="equiplist"></div>'))
      .mockResolvedValueOnce(
        response('<title>Challenge</title><div id="messagebox_inner">Try again</div>', {
          url: "https://hentaiverse.org/isekai/challenge",
        })
      );
    const armoryReader = reader(fetchImpl);

    await expect(armoryReader.read({ screen: "sell", category })).resolves.toMatchObject({
      kind: ArmoryPageKind.EMPTY,
    });
    await expect(armoryReader.read({ screen: "sell", category })).resolves.toMatchObject({
      kind: ArmoryPageKind.UNEXPECTED_PAGE,
      detail: {
        finalUrl: "https://hentaiverse.org/isekai/challenge",
        hasEquiplist: false,
        message: "Try again",
      },
    });
  });

  it("classifies limiter, HTTP, and thrown request failures with evidence", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(response("state lock limiter in effect"))
      .mockResolvedValueOnce(response("busy", { status: 503 }))
      .mockRejectedValueOnce(new Error("offline"));
    const armoryReader = reader(fetchImpl);

    await expect(armoryReader.read({ screen: "sell", category })).resolves.toMatchObject({
      kind: ArmoryPageKind.LIMITED,
    });
    await expect(armoryReader.read({ screen: "sell", category })).resolves.toMatchObject({
      kind: ArmoryPageKind.LIMITED,
      detail: { status: 503 },
    });
    await expect(armoryReader.read({ screen: "sell", category })).resolves.toMatchObject({
      kind: ArmoryPageKind.REQUEST_FAILED,
      detail: { error: "offline" },
    });
  });
});
