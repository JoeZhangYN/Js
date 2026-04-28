// 闲置自动挑战 Arena/RoB/GrindFest。
import { gE } from "../dom/query.js";
import { setValue, getValue } from "../state/storage.js";
import { g } from "../state/store.js";
import { _alert } from "../core/lang.js";
import { post } from "../dom/http.js";
import { goto } from "../core/navigate.js";
import { isIsekai } from "../env.js";

export function idleArena() {
  let arena = getValue("arena", true) || {};
  if (arena.date !== g("dateNow")) {
    arena = {
      date: g("dateNow"),
      gr: g("option").idleArenaGrTime,
      done: [],
      token: {
        length: 0,
      },
    };
    // iframe打开四个网站，设定四个判断值，同时true才继续
    const getToken = function (data, e) {
      if (isIsekai) {
        const postokenInput = gE('input[name="postoken"]', data);
        if (postokenInput) arena.token.postoken = postokenInput.value;
      }
      if (e.target.responseURL.match(/ss=gr$/)) {
        const grImg = gE('img[src*="startgrindfest.png"]', data);
        if (grImg) {
          const match = grImg.getAttribute("onclick")?.match(/init_battle\(\d+,\s*'(.*?)'\)/);
          arena.token.gr = match ? match[1] : true;
        }
      } else {
        gE('img[src*="startchallenge.png"]', "all", data).forEach((_) => {
          const match = _.getAttribute("onclick")?.match(
            /init_battle\((\d+)(?:,\s*\d+(?:,\s*'(.*?)')?)?\)/
          );
          if (match) arena.token[match[1]] = match[2] || true;
        });
      }
      arena.token.length++;
    };
    post("?s=Battle&ss=gr", getToken);
    post("?s=Battle&ss=ar", getToken);
    post("?s=Battle&ss=ar&page=2", getToken);
    post("?s=Battle&ss=rb", getToken);
    const checkOnload = function () {
      if (arena.token.length < 4) {
        setTimeout(checkOnload, 200);
      } else {
        setValue("arena", arena);
        setTimeout(idleArena, 200);
      }
    };
    checkOnload();
    return;
  }
  arena.done = arena.done || [];
  arena.array = g("option").idleArenaValue.split(",").filter((id) =>
    id === "gr" || isNaN(id * 1) ? arena.gr > 0 : !arena.done.includes(id)
  );
  if (arena.array.length === 0) return;
  if (
    g("option").restoreStamina &&
    gE("#stamina_readout .fc4.far>div").textContent.match(/\d+/)[0] * 1 <=
      g("option").staminaLow &&
    gE("#stamina_readout .fc4.far>div").textContent.match(/\d+/)[0] * 1 < 85
  ) {
    post(window.location.href, goto, "recover=stamina");
    return;
  }
  let href;
  let id;
  while (arena.array.length > 0) {
    id = arena.array[0] * 1;
    if (isNaN(id)) {
      href = "gr";
      id = "gr";
    } else if (id >= 105) {
      href = "rb";
    } else if (id >= 19) {
      href = "ar&page=2";
    } else {
      href = "ar";
    }
    if (!(id in arena.token)) {
      arena.array.splice(0, 1);
    } else {
      break;
    }
  }
  if (arena.array.length === 0) {
    setValue("arena", arena);
    return;
  }
  document.title = _alert(
    -1,
    "闲置竞技场",
    "閒置競技場開始",
    "Idle Arena start"
  );
  if (arena.array[0] === "gr" && arena.gr <= 0) {
    arena.array.splice(0, 1);
    setValue("arena", arena);
    idleArena();
    return;
  }
  if (arena.array[0] === "gr" && arena.gr > 0) {
    arena.gr--;
  } else {
    arena.done.push(arena.array[0]);
    arena.array.splice(0, 1);
  }
  setValue("arena", arena);
  const token = arena.token[id];
  if (id === "gr") id = 1;
  post(
    `?s=Battle&ss=${href}`,
    goto,
    isIsekai
      ? `initid=${String(id)}&postoken=${arena.token.postoken}`
      : `initid=${String(id)}&inittoken=${token}`
  );
}
