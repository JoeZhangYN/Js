import { describe, expect, it } from "vitest";
import { MaterialShopEvent, runMaterialShopAutomation } from "./material-shop.js";

function doc(html) {
  return new DOMParser().parseFromString(html, "text/html");
}

function shopDoc() {
  return doc(
    `<div id="networth">10,000</div>
     <form id="shopform"><input name="storetoken" value="stok_1"></form>
     <div id="item_pane"><table class="itemlist"><tbody>
       <tr><td onclick="itemshop.set_item('item_pane',50000,0,0)">Repair Outfit</td></tr>
     </tbody></table></div>
     <div id="shop_pane"><table class="itemlist"><tbody>
       <tr><td onclick="itemshop.set_item('shop_pane',50000,99,200)">Repair Outfit</td></tr>
     </tbody></table></div>`
  );
}

function runEnsureMaterials(callback, post) {
  return runMaterialShopAutomation(
    {
      type: MaterialShopEvent.ENSURE_MATERIALS,
      required: [{ name: "Repair Outfit", count: 1 }],
      option: { repairCreditCap: 50000 },
      callback,
    },
    { post }
  );
}

describe("material shop HTTP failures", () => {
  it("初始商店页读取失败 → buy-error with failure detail", () => {
    const failure = { kind: "networkError", href: "?s=Bazaar&ss=is", retries: 4 };
    const post = (_href, _func, _parm, _type, onFailure) => onFailure(failure);
    let res;

    runEnsureMaterials((r) => (res = r), post);

    expect(res).toEqual({ ok: false, reason: "buy-error", detail: failure });
  });

  it("买请求 POST 失败 → buy-error with failure detail", () => {
    const failure = { kind: "httpStatus", href: "?s=Bazaar&ss=is", status: 500 };
    const post = (_href, func, parm, _type, onFailure) => {
      if (parm === undefined) {
        func(shopDoc());
        return;
      }
      onFailure(failure);
    };
    let res;

    runEnsureMaterials((r) => (res = r), post);

    expect(res).toEqual({ ok: false, reason: "buy-error", detail: failure });
  });
});
