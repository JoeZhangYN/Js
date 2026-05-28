// 答题图片增强助手（移植自 HV 彩虹小马 mlp v0.6，by ssnangua_cn, MIT）。
// 在 #riddleimage>img 旁注入旋转 / 对比度 / 锐化控制面板，并把 6 张参考图鉴叠在选项 label 上。
// 与 riddle.js 的 ANSWER_MAP 完全解耦：本模块只做视觉辅助，不触发 riddleSubmit。

import { gE, cE } from "../dom/query.js";
import { PONY_IMAGES, PONY_NAMES } from "../data/pony-images.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const STYLE = `
  #riddleimage *,#mlp_pane *{user-select:none;}
  #csp{height:800px;}
  #mainpane{height:800px;}
  #riddleimage{position:relative;z-index:0;}
  #riddlemid{position:relative;z-index:100;}
  #riddleimage>img{position:fixed;-webkit-user-drag:none;}
  #riddler1 label{height:initial;white-space:nowrap;}
  #mlp_pane{z-index:200;position:fixed;top:20px;left:20px;padding:20px;background:#dcd3b7;border:2px solid #5C0D11;border-radius:5px;cursor:move;}
  #mlp_box{width:200px;cursor:default;}
  #mlp_box .mlp_lab{display:inline-block;width:4.5em;}
`;

/**
 * 给 el 注册按下拖动 (沿用 mlp 原版语义：onmousedown 整体接管 window mousemove/up)。
 * @param {HTMLElement} el
 */
function makeDraggable(el) {
  el.onmousedown = (e) => {
    const drag = { ex: el.offsetLeft, ey: el.offsetTop, mx: e.x, my: e.y };
    window.onmousemove = (ev) => {
      el.style.left = drag.ex + ev.x - drag.mx + "px";
      el.style.top = drag.ey + ev.y - drag.my + "px";
    };
    window.onmouseup = () => {
      window.onmousemove = null;
      window.onmouseup = null;
    };
  };
}

/**
 * 注入 SVG `<filter id="unsharpy">`，并返回内部 feGaussianBlur 引用以便后续调 stdDeviation。
 * @param {number} initStdDeviation
 * @returns {SVGElement}
 */
function injectUnsharpFilter(initStdDeviation) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  svg.innerHTML = `
    <defs>
      <filter id="unsharpy">
        <feGaussianBlur result="blurOut" in="SourceGraphic" stdDeviation="${initStdDeviation}" />
        <feComposite operator="arithmetic" k1="0" k2="1.3" k3="-0.3" k4="0" in="SourceGraphic" in2="blurOut" />
      </filter>
    </defs>
  `;
  document.body.appendChild(svg);
  return svg.querySelector("feGaussianBlur");
}

/**
 * 在 #riddler1 6 个候选 label 末尾插入对应小马的 96px 缩略图。
 * label.innerText 是英文官方名（与 PONY_NAMES value 等同），按值反查 base64。
 */
function attachThumbnails() {
  const labels = gE("#riddler1 label", "all");
  if (!labels || labels.length === 0) return;
  const nameToImg = {};
  for (const key of Object.keys(PONY_NAMES)) nameToImg[PONY_NAMES[key]] = PONY_IMAGES[key];
  for (const el of labels) {
    const src = nameToImg[el.innerText.trim()];
    if (!src) continue;
    const wrap = cE("div");
    const thumb = cE("img");
    thumb.src = src;
    thumb.style.maxWidth = "96px";
    thumb.style.maxHeight = "96px";
    wrap.appendChild(thumb);
    el.appendChild(wrap);
  }
}

/**
 * 注入答题图片助手 UI。无 #riddleimage>img 时静默 return（非答题页）。
 * 异步等图片 onload 后定位 + 加面板 + 拖拽 + 滚轮缩放。
 * @returns {Promise<void>}
 */
export async function setupRiddleHelper() {
  const img = gE("#riddleimage>img");
  if (!img) return;
  if (!img.complete) await new Promise((resolve) => (img.onload = resolve));

  // 锁住原图位置：避免 position:fixed 后丢掉 layout 坐标
  const bound = img.getBoundingClientRect();
  img.style.width = bound.width + "px";
  img.style.height = bound.height + "px";
  img.style.left = bound.x + "px";
  img.style.top = bound.y + "px";

  // 注入 style（独立 hvAA-mlpStyle 标签，避免和 inject.js 全局样式打架）
  const style = cE("style");
  style.className = "hvAA-mlpStyle";
  style.textContent = STYLE;
  gE("head").appendChild(style);

  // 占位防 layout collapse
  const placeholder = cE("div");
  placeholder.style.cssText = `width:${img.offsetWidth}px;height:${img.offsetHeight}px`;
  img.parentNode.appendChild(placeholder);

  makeDraggable(img);

  const state = { scale: 1, rotate: 0, contrast: 1.2, unsharp: 10 };

  const pane = cE("div");
  pane.id = "mlp_pane";
  pane.innerHTML = `<div id="mlp_box">
    <div><span class="mlp_lab">旋转</span><input id="mlp_rotate" type="range" min="-180" max="180" step="1" value="${state.rotate}"></div>
    <div><span class="mlp_lab">对比度</span><input id="mlp_contrast" type="range" min="1" max="2" step="0.1" value="${state.contrast}"></div>
    <div><span class="mlp_lab">锐化</span><input id="mlp_unsharp" type="range" min="0" max="50" step="0.1" value="${state.unsharp}"></div>
    <div style="margin-top:10px">验证图按下可拖动 / 滚轮可缩放</div>
  </div>`;
  document.body.appendChild(pane);
  // 摆到 #csp 右边（沿用原版排版策略），同时夹紧 viewport 右边界
  const csp = gE("#csp");
  const cspW = csp ? csp.offsetWidth : 600;
  pane.style.left = Math.min(cspW + 20, window.innerWidth - pane.offsetWidth - 20) + "px";

  makeDraggable(pane);
  // 内框不参与面板拖拽（让 input 可点）
  const box = gE("#mlp_box");
  if (box) box.onmousedown = (e) => e.stopPropagation();

  const unsharpyBlur = injectUnsharpFilter(state.unsharp);

  const updateImg = () => {
    unsharpyBlur.setAttribute("stdDeviation", state.unsharp);
    img.style.filter = `contrast(${state.contrast}) url(#unsharpy)`;
    img.style.transform = `rotate(${state.rotate}deg) scale(${state.scale})`;
  };
  updateImg();

  const onWheel = (e) => {
    state.scale = Math.max(0.1, state.scale + (e.deltaY > 0 ? -0.1 : 0.1));
    updateImg();
    e.preventDefault();
  };
  // 用 wheel 事件（onmousewheel 在现代浏览器仍可用但标准是 wheel；wheel 需 passive:false 才能 preventDefault）
  pane.addEventListener("wheel", onWheel, { passive: false });
  img.addEventListener("wheel", onWheel, { passive: false });

  const bindInput = (id, key) => {
    const input = gE("#" + id);
    if (!input) return;
    input.oninput = function () {
      state[key] = parseFloat(this.value);
      updateImg();
    };
  };
  bindInput("mlp_rotate", "rotate");
  bindInput("mlp_contrast", "contrast");
  bindInput("mlp_unsharp", "unsharp");

  attachThumbnails();
}
