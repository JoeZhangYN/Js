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
    '<span><l01><a href="https://github.com/dodying/UserJs/blob/master/HentaiVerse/hvAutoAttack/README.md#自定义判断条件" target="_blank">?</a></l01><l2><a href="https://github.com/dodying/UserJs/blob/master/HentaiVerse/hvAutoAttack/README_en.md#customize-condition" target="_blank">?</a></l2></span>',
    `<span class="hvAAInspect" title="off">${String.fromCharCode(0x21f1)}</span>`,
    '<select name="groupChoose"></select>',
    `<select name="statusA">${statusOption}</select>`,
    '<select name="compareAB"><option value="1">＞</option><option value="2">＜</option><option value="3">≥</option><option value="4">≤</option><option value="5">＝</option><option value="6">≠</option></select>',
    `<select name="statusB">${statusOption}</select>`,
    '<button class="groupAdd">ADD</button>',
  ].join(" ");
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
    const selects = gE("select", "all", customizeBox);
    let groupChoose = selects[0].value;
    let group;
    if (groupChoose === "new") {
      groupChoose = gE("option", "all", selects[0]).length;
      group = target.appendChild(cE("div"));
      group.className = "customizeGroup";
      group.innerHTML = `${groupChoose}. `;
      selects[0].click();
    } else {
      group = gE(".customizeGroup", "all", target)[groupChoose - 1];
    }
    const input = group.appendChild(cE("input"));
    input.type = "text";
    input.className = "customizeInput";
    input.name = `${target.getAttribute("name")}_${groupChoose - 1}`;
    input.value = `${selects[1].value},${selects[2].value},${selects[3].value}`;
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
