// 装备耐久检查 + 自动修理触发。
import { gE } from "../dom/query.js";
import { g } from "../state/store.js";
import { post } from "../dom/http.js";
import { idleArena } from "./idle-arena.js";

export function repairCheck() {
  let json;
  let checkOnload;
  let checkLength;
  let len = 0;
  let lastID;
  const eqps = [];
  checkOnload = function () {
    if (json) {
      setTimeout(checkOnload, 200);
      return;
    }
    post("?s=Forge&ss=re", (data) => {
      post(
        gE("#mainpane>script[src]", data).src,
        (data1) => {
          json = JSON.parse(data1.match(/{.*}/)[0]);
          gE(".eqp>[id]", "all", data).forEach((i) => {
            eqps.push(i.id.match(/\d+/)[0]);
          });
          len = 0;
          if (eqps.length === 0) {
            checkLength();
            return;
          }
          for (const id of eqps) {
            if (
              json[id].d.match(/Condition: \d+ \/ \d+ \((\d+)%\)/)[1] <=
              g("option").repairValue
            ) {
              if (id === lastID) {
                return;
              }
              lastID = id; // 记录最后一次需要修理的装备id，然后再次检测是否修理成功
              post("?s=Forge&ss=re", checkOnload, `select_item=${id}`);
            } else {
              checkLength();
            }
          }
        },
        null,
        "text"
      );
    });
  };
  checkLength = function () {
    len++;
    if (len >= eqps.length && g("option").idleArena)
      setTimeout(
        idleArena,
        ((g("option").idleArenaTime * (Math.random() * 20 + 90)) / 100) * 1000
      );
  };
  checkOnload();
}
