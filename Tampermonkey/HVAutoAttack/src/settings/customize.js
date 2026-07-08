// 配置面板的 condition 编辑器（嵌入式弹出 UI）。
// 体量大、混 DOM/state，Phase 5 会进一步纯函数化拆分。
// file-size-gate: exempt phase-3-monolith

import { gE, cE } from "../dom/query.js";
import { g } from "../state/store.js";

function hasCustomizeInspectClass(target, className) {
  if (target?.classList?.contains?.(className)) return true;
  return String(target?.className || "")
    .split(/\s+/)
    .includes(className);
}

export function readCustomizeInspectTarget(target) {
  const onmouseover = target?.getAttribute?.("onmouseover");
  if (hasCustomizeInspectClass(target, "btsd")) return `Skill Id: ${target.id}`;
  if (onmouseover && onmouseover.match("common.show_itemc_box")) {
    const match = onmouseover.match(/(\d+)\)/);
    return match ? `Item Id: ${match[1]}` : undefined;
  }
  if (onmouseover && onmouseover.match("equips.set")) {
    const match = onmouseover.match(/(\d+)/);
    return match ? `Equip Id: ${match[1]}` : undefined;
  }
  if (onmouseover && onmouseover.match("battle.set_infopane_effect")) {
    const match = target.src?.match(/\/e\/(.*?).png/);
    return match ? `Buff Img: ${match[1]}` : undefined;
  }
  return undefined;
}

export function customizeBox() {
  const customizeBox = gE("body").appendChild(cE("div"));
  customizeBox.className = "customizeBox";
  // 状态下拉：显示中文 label 更直观，value 保持逻辑键（condition-eval 按 value 求值，不受 label 影响）。
  const statusOption = [
    '<option value="hp">生命(hp)</option>',
    '<option value="mp">魔法(mp)</option>',
    '<option value="sp">灵力(sp)</option>',
    '<option value="oc">超载(oc)</option>',
    '<option value="">- - - -</option>',
    '<option value="monsterAll">怪物总数</option>',
    '<option value="monsterAlive">存活怪数</option>',
    '<option value="bossAll">Boss总数</option>',
    '<option value="bossAlive">存活Boss数</option>',
    '<option value="soloMonsterHpPercent">独怪血量%</option>',
    '<option value="lowestMonsterHpPercent">最低怪血%</option>',
    '<option value="firstMonsterHpPercent">首怪血量%</option>',
    '<option value="">- - - -</option>',
    '<option value="roundNow">当前轮</option>',
    '<option value="roundAll">总轮数</option>',
    '<option value="roundLeft">剩余轮</option>',
    '<option value="roundType">轮次类型</option>',
    '<option value="attackStatus">攻击属性</option>',
    '<option value="turn">回合数</option>',
    '<option value="">- - - -</option>',
    '<option value="_isCd_">技能CD</option>',
    '<option value="_buffTurn_">Buff回合</option>',
    '<option value=""></option>',
  ].join("");
  customizeBox.innerHTML = [
    '<span class="hvAACondHelp" title="条件/非门语法帮助" style="cursor:pointer;font-weight:bold;">?</span>',
    `<span class="hvAAInspect" title="off">${String.fromCharCode(0x21f1)}</span>`,
    '<select name="groupChoose"></select>',
    '<select name="rowType" title="行类型:串=AND/并=OR"><option value="and">串</option><option value="or">并</option></select>',
    '<label title="非门:满足则排除(等价子句前缀!)"><input type="checkbox" class="customizeNeg">非</label>',
    `<select name="statusA">${statusOption}</select>`,
    '<select name="compareAB"><option value="1">＞</option><option value="2">＜</option><option value="3">≥</option><option value="4">≤</option><option value="5">＝</option><option value="6">≠</option></select>',
    `<select name="statusB">${statusOption}</select>`,
    '<button class="groupAdd">添加</button>',
    // 内联条件/非门帮助（替换原 dodying 外链；点 "?" 切换显示）
    '<div class="hvAACondHelpBox" style="display:none;max-width:540px;margin-top:4px;padding:6px;border:1px solid #888;font-size:small;line-height:1.5;">' +
      "<b>语法</b>: 变量,比较符,值（如 <code>mp,4,45</code>=mp≤45）。比较符 1=&gt; 2=&lt; 3=≥ 4=≤ 5== 6≠。<br>" +
      "<b>多行</b>=并联(OR,任一行成立即可)；<b>行内多子句</b>默认<b>串</b>(AND)，行类型选<b>并</b>则该行内 OR。<br>" +
      '<b>非门</b>(勾"非"或前缀 <code>!</code>)=「满足就排除」：<br>' +
      "　·<b>纯非门行</b>=全局前置守卫，任一触发→整条件不成立(顺延)；<br>" +
      "　·<b>混合行</b>(非门+正向)：非门仅局部作用于本行。<br>" +
      "<b>例·带状</b>：行1 <code>非 mp,4,25</code> + 行2 <code>mp,4,45</code> → 仅 mp∈(25,45] 用药（≤25 让给更大的瓶，不再拖到浪费）。<br>" +
      "<b>新变量</b>: soloMonsterHpPercent / lowestMonsterHpPercent / firstMonsterHpPercent（单怪血条%）。<b>例</b> Drain 不打濒死独怪：混合行加 <code>!soloMonsterHpPercent,4,25</code>。" +
      "</div>",
  ].join(" ");
  // "?" 切换内联帮助
  gE(".hvAACondHelp", customizeBox).onclick = function () {
    const box = gE(".hvAACondHelpBox", customizeBox);
    box.style.display = box.style.display === "none" ? "block" : "none";
  };
  const funcSelect = function (e) {
    let box;
    if (gE("#hvAAInspectBox")) {
      box = gE("#hvAAInspectBox");
    } else {
      box = gE("body").appendChild(cE("div"));
      box.id = "hvAAInspectBox";
    }
    let { target } = e;
    let find = readCustomizeInspectTarget(target);
    while (!find) {
      target = target.parentNode;
      if (target.id === "csp" || target.tagName === "BODY") {
        box.style.display = "none";
        return;
      }
      find = readCustomizeInspectTarget(target);
    }
    box.textContent = find;
    box.style.display = "block";
    box.style.left = `${e.pageX - e.offsetX + target.offsetWidth}px`;
    box.style.top = `${e.pageY - e.offsetY + target.offsetHeight}px`;
  };
  gE(".hvAAInspect", customizeBox).onclick = function () {
    if (this.title === "on") {
      this.title = "off";
      gE("#csp").removeEventListener("mousemove", funcSelect);
    } else {
      this.title = "on";
      gE("#csp").addEventListener("mousemove", funcSelect);
    }
  };
  gE(".groupAdd", customizeBox).onclick = function () {
    const target = g("customizeTarget");
    // 按 name 取 select（新增 rowType/非门控件后索引会变，故不再用 selects[i]）
    const sel = (name) => gE(`select[name="${name}"]`, customizeBox);
    const neg = gE(".customizeNeg", customizeBox).checked;
    const rowOr = sel("rowType").value === "or";
    const mkInput = (g0, value, marker) => {
      const input = g0.appendChild(cE("input"));
      input.type = "text";
      input.className = "customizeInput";
      input.value = value;
      if (marker) {
        input.readOnly = true;
        input.style.width = "2em";
      }
      return input;
    };
    let groupChoose = sel("groupChoose").value;
    let group;
    let isNew = false;
    if (groupChoose === "new") {
      groupChoose = gE("option", "all", sel("groupChoose")).length;
      group = target.appendChild(cE("div"));
      group.className = "customizeGroup";
      group.innerHTML = `${groupChoose}. `;
      isNew = true;
      sel("groupChoose").click();
    } else {
      group = gE(".customizeGroup", "all", target)[groupChoose - 1];
    }
    const inputName = `${target.getAttribute("name")}_${groupChoose - 1}`;
    // 并联(OR)行：新建该组时注入 "||" 哨兵作为首个子句（checkCondition 识别）
    if (isNew && rowOr) {
      const marker = mkInput(group, "||", true);
      marker.name = inputName;
    }
    const input = mkInput(
      group,
      `${neg ? "!" : ""}${sel("statusA").value},${sel("compareAB").value},${sel("statusB").value}`
    );
    input.name = inputName;
  };
}
