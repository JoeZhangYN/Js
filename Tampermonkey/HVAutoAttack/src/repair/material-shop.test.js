import { describe, it, expect } from "vitest";
import { MaterialShopEvent, runMaterialShopAutomation } from "./material-shop.js";

function doc(html) {
  return new DOMParser().parseFromString(html, "text/html");
}

/** 造商店页 document。itemPane/shopPane: [name, id, stock, price]。 */
function shopDoc({ networth = 10000, itemPane = [], shopPane = [] }) {
  const rows = (pane, arr) =>
    `<div id="${pane}"><table class="itemlist"><tbody>${arr
      .map(
        ([name, id, stock, price]) =>
          `<tr><td onclick="itemshop.set_item('${pane}',${id},${stock},${price})">${name}</td></tr>`
      )
      .join("")}</tbody></table></div>`;
  return doc(
    `<div id="networth">${networth.toLocaleString()}</div>
     <form id="shopform"><input name="storetoken" value="stok_1"></form>
     ${rows("item_pane", itemPane)}
     ${rows("shop_pane", shopPane)}`
  );
}

/** 注入式 post：GET(parm 为空) 返 shop 页；POST 返 buyDoc（默认无 messagebox=成功）。记录调用。 */
function makePost(shop, buyDoc) {
  const calls = [];
  const post = (href, func, parm) => {
    calls.push({ href, parm });
    func(parm === undefined ? shop : buyDoc || doc("<div></div>"));
  };
  return { post, calls };
}

function ensureMaterials(required, option, callback, post) {
  return runMaterialShopAutomation(
    { type: MaterialShopEvent.ENSURE_MATERIALS, required, option, callback },
    { post }
  );
}

describe("material shop entry", () => {
  const opt = { repairCreditCap: 50000 };

  it("rejects unknown material shop events without reading the shop page", () => {
    const { post, calls } = makePost(shopDoc({}));

    expect(runMaterialShopAutomation({ type: "unknown" }, { post })).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("rejects null material shop events without reading the shop page", () => {
    const { post, calls } = makePost(shopDoc({}));

    expect(runMaterialShopAutomation(null, { post })).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("持有充足 → 不买，ok bought:false", () => {
    const { post, calls } = makePost(
      shopDoc({
        itemPane: [["Repair Outfit", 50000, 5, 0]],
        shopPane: [["Repair Outfit", 50000, 99, 200]],
      })
    );
    let res;
    ensureMaterials(
      [{ matId: "50000", name: "Repair Outfit", count: 3 }],
      opt,
      (r) => (res = r),
      post
    );
    expect(res).toEqual({ ok: true, bought: false, spent: 0 });
    expect(calls.filter((c) => c.parm !== undefined)).toHaveLength(0); // 无买请求
  });

  it("缺料且在上限内 → 买齐，spent=缺口*售价，发正确 POST", () => {
    const { post, calls } = makePost(
      shopDoc({
        itemPane: [["Repair Outfit", 50000, 1, 0]],
        shopPane: [["Repair Outfit", 50000, 99, 200]],
      })
    );
    let res;
    ensureMaterials(
      [{ matId: "50000", name: "Repair Outfit", count: 3 }],
      opt,
      (r) => (res = r),
      post
    );
    expect(res).toEqual({ ok: true, bought: true, spent: 400 }); // 缺 2 * 200
    const buys = calls.filter((c) => c.parm !== undefined);
    expect(buys).toHaveLength(1);
    expect(buys[0].parm).toBe(
      "storetoken=stok_1&select_mode=shop_pane&select_item=50000&select_count=2"
    );
  });

  it("花费超单轮上限 → credit-cap，不发买请求", () => {
    const { post, calls } = makePost(
      shopDoc({
        itemPane: [["Repair Outfit", 50000, 0, 0]],
        shopPane: [["Repair Outfit", 50000, 99, 200]],
      })
    );
    let res;
    ensureMaterials(
      [{ name: "Repair Outfit", count: 3 }],
      { repairCreditCap: 100 },
      (r) => (res = r),
      post
    );
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("credit-cap");
    expect(calls.filter((c) => c.parm !== undefined)).toHaveLength(0);
  });

  it("花费超余额 → insufficient-credits", () => {
    const { post } = makePost(
      shopDoc({
        networth: 100,
        itemPane: [["Repair Outfit", 50000, 0, 0]],
        shopPane: [["Repair Outfit", 50000, 99, 200]],
      })
    );
    let res;
    ensureMaterials([{ name: "Repair Outfit", count: 3 }], opt, (r) => (res = r), post);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("insufficient-credits");
  });

  it("货架库存不足 → no-stock", () => {
    const { post } = makePost(
      shopDoc({
        itemPane: [["Repair Outfit", 50000, 0, 0]],
        shopPane: [["Repair Outfit", 50000, 1, 200]],
      })
    );
    let res;
    ensureMaterials([{ name: "Repair Outfit", count: 3 }], opt, (r) => (res = r), post);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("no-stock");
  });

  it("商店无此货架条目 → unknown-item", () => {
    const { post } = makePost(shopDoc({ itemPane: [], shopPane: [] }));
    let res;
    ensureMaterials([{ name: "Mystery Mat", count: 1 }], opt, (r) => (res = r), post);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("unknown-item");
    expect(res.detail).toBe("Mystery Mat");
  });

  it("买请求返回错误 messagebox → buy-error", () => {
    const buyDoc = doc('<div id="messagebox">You do not have enough credits.</div>');
    const { post } = makePost(
      shopDoc({
        itemPane: [["Repair Outfit", 50000, 0, 0]],
        shopPane: [["Repair Outfit", 50000, 99, 200]],
      }),
      buyDoc
    );
    let res;
    ensureMaterials([{ name: "Repair Outfit", count: 1 }], opt, (r) => (res = r), post);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("buy-error");
  });
});
