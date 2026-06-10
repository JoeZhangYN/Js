// 物品商店买料端口（联动商店「无需人为介入」）。世界无关——两世界商店端点相同（`?s=Bazaar&ss=is`）。
//
// 抽文件不抽 trait：商店端点单实现，造多态接口零收益；但 storetoken 生命周期 / 货架解析 / cap+余额+库存
// 校验是独立外部契约，混进编排器会让其同时背维修+商店两套契约 → 文件级拆分是内聚非过度抽象（铁律 1d 复杂度下沉）。
//
// 持有量(`#item_pane`)+ 售价/库存(`#shop_pane`)+ 信用点(`#networth`)+ storetoken 全从商店页一次取——
// 故维修页解析层(parse-repair-state)无需取持有数，两世界买料统一走此端口（减少业务孤岛）。
//
// ensureMaterials(required, opt, cb)：required=本件维修需求材料 → 算缺料(需求-持有) → 缺料为空即 ok（不买）；
// 否则 cap(单轮花费上限) / 余额 / 库存 三道闸 → 逐件 POST 买 → 结果回调。任一闸不过即不发买请求、回报 reason。
import { post as realPost } from "../dom/http.js";

/** @typedef {import("./parse-repair-state.js").RepairMaterial} RepairMaterial */
/**
 * @typedef {{ ok: true, bought: boolean, spent: number }
 *   | { ok: false, reason: "credit-cap"|"insufficient-credits"|"no-stock"|"unknown-item"|"buy-error", detail?: any }} BuyResult
 */

const SHOP_URL = "?s=Bazaar&ss=is";
const SET_ITEM_RE = /set_item\(\s*'(\w+)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/;

/**
 * 解析商店页（PURE）→ { storetoken, networth, held, shop }。
 * held: 你的库存(item_pane) name→数量；shop: 可购货架(shop_pane) name→{id,stock,price}。
 * @param {Document} doc `?s=Bazaar&ss=is` 页 document
 */
export function parseShopPage(doc) {
  const form = doc?.querySelector("#shopform");
  const storetoken = form?.elements?.storetoken?.value || null;
  const networthText = doc?.querySelector("#networth")?.textContent || "";
  const networth = Number(networthText.replace(/\D/g, "")) || 0;

  const held = {};
  const shop = {};
  const rows = (paneSel, sink) => {
    doc?.querySelectorAll(`${paneSel} .itemlist tr`).forEach((tr) => {
      const node = tr.querySelector("[onclick]");
      const m = node?.getAttribute("onclick")?.match(SET_ITEM_RE);
      const name = tr.cells?.[0]?.textContent?.trim();
      if (!m || !name) return;
      sink(name, { id: m[2], stock: Number(m[3]), price: Number(m[4]) });
    });
  };
  rows("#item_pane", (name, v) => {
    held[name] = v.stock;
  });
  rows("#shop_pane", (name, v) => {
    shop[name] = { id: v.id, stock: v.stock, price: v.price };
  });
  return { storetoken, networth, held, shop };
}

/**
 * 缺料 = 需求 - 持有（持有由商店页取，两世界统一）。
 * @param {RepairMaterial[]} required
 * @param {Record<string, number>} held
 * @returns {RepairMaterial[]} 仍需购买的清单（count = 缺口）
 */
function computeShortfall(required, held) {
  const out = [];
  for (const r of required || []) {
    const have = held[r.name] || 0;
    const need = r.count - have;
    if (need > 0) out.push({ matId: r.matId, name: r.name, count: need });
  }
  return out;
}

/** #messagebox 错误文本检测（买后）。无 box / 非错误样式文本 → null。 */
function buyError(doc) {
  const box = doc?.querySelector("#messagebox");
  const text = box?.textContent?.trim();
  if (text && /enough|insufficient|error|cannot|invalid|fail|denied/i.test(text)) {
    return text;
  }
  return null;
}

/**
 * 确保 required 材料齐备：缺则在 cap/余额/库存范围内从商店买齐。无需购买也回 ok（bought:false）。
 * @param {RepairMaterial[]} required 本件维修需求材料
 * @param {{ repairCreditCap?: number }} opt
 * @param {(res: BuyResult) => void} cb
 * @param {(href:string, func:Function, parm?:string, type?:string)=>void} [_post] 测试注入（默认真实 post）
 */
export function ensureMaterials(required, opt, cb, _post) {
  const post = _post || realPost;
  post(SHOP_URL, (doc) => {
    const { storetoken, networth, held, shop } = parseShopPage(doc);
    const shortfall = computeShortfall(required, held);

    if (shortfall.length === 0) {
      cb({ ok: true, bought: false, spent: 0 });
      return;
    }

    // 解析每项到货架（按名）；缺货架条目 → 未知物品（无法自动买）。
    let cost = 0;
    for (const item of shortfall) {
      const entry = shop[item.name];
      if (!entry) {
        cb({ ok: false, reason: "unknown-item", detail: item.name });
        return;
      }
      if (item.count > entry.stock) {
        cb({ ok: false, reason: "no-stock", detail: item.name });
        return;
      }
      item.id = entry.matId || entry.id;
      cost += item.count * entry.price;
    }

    const cap = Number(opt?.repairCreditCap) || 0;
    if (cost > cap) {
      cb({ ok: false, reason: "credit-cap", detail: { cost, cap } });
      return;
    }
    if (cost > networth) {
      cb({ ok: false, reason: "insufficient-credits", detail: { cost, networth } });
      return;
    }

    // 逐件买（顺序回调链，避免 storetoken 竞态）。任一件出错即停。
    let i = 0;
    const buyNext = () => {
      if (i >= shortfall.length) {
        cb({ ok: true, bought: true, spent: cost });
        return;
      }
      const item = shortfall[i];
      i += 1;
      post(
        SHOP_URL,
        (resDoc) => {
          const err = buyError(resDoc);
          if (err) {
            cb({ ok: false, reason: "buy-error", detail: err });
            return;
          }
          buyNext();
        },
        `storetoken=${storetoken}&select_mode=shop_pane&select_item=${item.id}&select_count=${item.count}`
      );
    };
    buyNext();
  });
}
