// 配置面板的 condition 编辑器（嵌入式弹出 UI）。
// 体量大、混 DOM/state，Phase 5 会进一步纯函数化拆分。
// file-size-gate: exempt phase-3-monolith
/* eslint-disable camelcase */
import { gE, cE } from "../dom/query.js";
import { g } from "../state/store.js";

export function customizeBox() {
  const customizeBox = gE("body").appendChild(cE("div"));
  customizeBox.className = "customizeBox";
  const statusOption = [
    '<option value="hp">hp</option>',
    '<option value="mp">mp</option>',
    '<option value="sp">sp</option>',
    '<option value="oc">oc</option>',
    '<option value="">- - - -</option>',
    '<option value="monsterAll">monsterAll</option>',
    '<option value="monsterAlive">monsterAlive</option>',
    '<option value="bossAll">bossAll</option>',
    '<option value="bossAlive">bossAlive</option>',
    '<option value="soloMonsterHp">soloMonsterHp</option>',
    '<option value="lowestMonsterHp">lowestMonsterHp</option>',
    '<option value="firstMonsterHp">firstMonsterHp</option>',
    '<option value="">- - - -</option>',
    '<option value="roundNow">roundNow</option>',
    '<option value="roundAll">roundAll</option>',
    '<option value="roundLeft">roundLeft</option>',
    '<option value="roundType">roundType</option>',
    '<option value="attackStatus">attackStatus</option>',
    '<option value="turn">turn</option>',
    '<option value="">- - - -</option>',
    '<option value="_isCd_">isCd</option>',
    '<option value="_buffTurn_">buffTurn</option>',
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
    '<button class="groupAdd">ADD</button>',
    // 内联条件/非门帮助（替换原 dodying 外链；点 "?" 切换显示）
    '<div class="hvAACondHelpBox" style="display:none;max-width:540px;margin-top:4px;padding:6px;border:1px solid #888;font-size:small;line-height:1.5;">' +
      '<b>语法</b>: 变量,比较符,值（如 <code>mp,4,45</code>=mp≤45）。比较符 1=&gt; 2=&lt; 3=≥ 4=≤ 5== 6≠。<br>' +
      '<b>多行</b>=并联(OR,任一行成立即可)；<b>行内多子句</b>默认<b>串</b>(AND)，行类型选<b>并</b>则该行内 OR。<br>' +
      '<b>非门</b>(勾"非"或前缀 <code>!</code>)=「满足就排除」：<br>' +
      '　·<b>纯非门行</b>=全局前置守卫，任一触发→整条件不成立(顺延)；<br>' +
      '　·<b>混合行</b>(非门+正向)：非门仅局部作用于本行。<br>' +
      '<b>例·带状</b>：行1 <code>非 mp,4,25</code> + 行2 <code>mp,4,45</code> → 仅 mp∈(25,45] 用药（≤25 让给更大的瓶，不再拖到浪费）。<br>' +
      '<b>新变量</b>: soloMonsterHp / lowestMonsterHp / firstMonsterHp（单怪 HP%）。<b>例</b> Drain 不打濒死独怪：混合行加 <code>!soloMonsterHp,4,25</code>。' +
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
    let find = attr(target);
    while (!find) {
      target = target.parentNode;
      if (target.id === "csp" || target.tagName === "BODY") {
        box.style.display = "none";
        return;
      }
      find = attr(target);
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
    const input = mkInput(group, `${neg ? "!" : ""}${sel("statusA").value},${sel("compareAB").value},${sel("statusB").value}`);
    input.name = inputName;
  };

  function attr(target) {
    const onmouseover = target.getAttribute("onmouseover");
    if (target.className === "btsd") {
      return `Skill Id: ${target.id}`;
    }
    if (onmouseover && onmouseover.match("common.show_itemc_box")) {
      return `Item Id: ${onmouseover.match(/(\d+)\)/)[1]}`;
    }
    if (onmouseover && onmouseover.match("equips.set")) {
      return `Equip Id: ${onmouseover.match(/(\d+)/)[1]}`;
    }
    if (onmouseover && onmouseover.match("battle.set_infopane_effect")) {
      return `Buff Img: ${target.src.match(/\/e\/(.*?).png/)[1]}`;
    }
  }
}
