import { describe, expect, it } from "vitest";
import { MaterialShopEvent, runMaterialShopAutomation } from "./material-shop.js";

function doc(html) {
  return new DOMParser().parseFromString(html, "text/html");
}

function shopDocWithoutStoretoken() {
  return doc(
    `<div id="networth">10,000</div>
     <form id="shopform"></form>
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

describe("material shop token failures", () => {
  it("缺料但商店页缺少 storetoken → missing-storetoken，不发买请求", () => {
    const calls = [];
    const post = (_href, func, parm) => {
      calls.push({ parm });
      func(shopDocWithoutStoretoken());
    };
    let res;

    runEnsureMaterials((r) => (res = r), post);

    expect(res.ok).toBe(false);
    expect(res.reason).toBe("missing-storetoken");
    expect(calls.filter((c) => c.parm !== undefined)).toHaveLength(0);
  });
});
