// 警报系统：屏幕弹窗 + 音频播放 + 浏览器 desktop notification。
import { gE, cE } from "../dom/query.js";
import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { getAlarmNotification } from "./notification-catalog.js";

const EVENT_TRIGGER = "trigger";
const EVENT_AUDIO = "audio";
const EVENT_NOTIFICATION = "notification";
const EVENT_PREVIEW_AUDIO_URL = "previewAudioUrl";

export const AlarmEvent = Object.freeze({
  TRIGGER: EVENT_TRIGGER,
  AUDIO: EVENT_AUDIO,
  NOTIFICATION: EVENT_NOTIFICATION,
  PREVIEW_AUDIO_URL: EVENT_PREVIEW_AUDIO_URL,
});

const AUDIO_URL_PREFIX = /^http(s)?:|^ftp:|^data:audio/;
const AUDIO_URL_ERROR_MESSAGE = Object.freeze({
  l0: '地址必须以"http:","https:","ftp:","data:audio"开头',
  l1: '地址必須以"http:","https:","ftp:","data:audio"開頭',
  l2: 'The address must start with "http:", "https:", "ftp:", and "data:audio"',
});
const AUDIO_PREVIEW_MESSAGE = Object.freeze({
  l0: "接下来将测试该音频\n如果该音频无法播放或无法载入，请变更\n请测试完成后再键入另一个音频",
  l1: "接下來將測試該音頻\n如果該音頻無法播放或無法載入，請變更\n請測試完成後再鍵入另一個音頻",
  l2: "The audio will be tested after you close this prompt\nIf the audio doesn't load or play, change the url",
});
const ALARM_KINDS = Object.freeze(["Common", "Error", "Defeat", "Riddle", "Victory", "Test"]);

function normalizeAlarmKind(kind) {
  return ALARM_KINDS.includes(kind) ? kind : "Common";
}

function setAlarm(e) {
  e = normalizeAlarmKind(e);
  if (readOptionField("notification", false)) setNotification(e);
  const audioEnable = readOptionField("audioEnable", {});
  if (readOptionField("alert", false) && audioEnable?.[e]) setAudioAlarm(e);
}

function readOptionField(key, fallback) {
  return runOptionAutomation({ type: OptionEvent.READ_FIELD, key, fallback });
}

function setAudioAlarm(e) {
  e = normalizeAlarmKind(e);
  let audio;
  if (gE(`#hvAAAlert-${e}`)) {
    audio = gE(`#hvAAAlert-${e}`);
  } else {
    audio = gE("body").appendChild(cE("audio"));
    audio.id = `hvAAAlert-${e}`;
    const fileType = ".ogg"; // var fileType = (/Chrome|Safari/.test(navigator.userAgent)) ? '.mp3' : '.wav';
    const audioOption = readOptionField("audio", {});
    audio.src =
      audioOption && audioOption[e]
        ? audioOption[e]
        : `https://gitee.com/dodying/userJs/raw/master/HentaiVerse/hvAutoAttack/${e}${fileType}`;

    audio.controls = true;
    audio.loop = e === "Riddle";
  }
  audio.play();

  function pauseAudio(e) {
    audio.pause();
    document.removeEventListener(e.type, pauseAudio, true);
  }
  document.addEventListener("mousemove", pauseAudio, true);
}

function setNotification(e) {
  e = normalizeAlarmKind(e);
  const notification = getAlarmNotification(e, g("lang"));
  const options = {
    body: notification.text,
    icon: `${window.location.origin}/y/hentaiverse.png`,
    tag: "hvNotification",
    requireInteraction: true,
  };

  if (typeof GM_notification !== "undefined") {
    GM_notification({
      text: notification.text,
      title: "HentaiVerse Notification",
      image: options.icon,
      highlight: true,
      timeout: notification.time * 1000,
    });
  }

  if ("Notification" in window && Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        const n = new Notification("HentaiVerse Notification", options);

        setTimeout(() => n.close(), notification.time * 1000);

        const closeNotification = () => {
          n.close();
          document.removeEventListener("mousemove", closeNotification);
        };

        document.addEventListener("mousemove", closeNotification);
      }
    });
  }
}

function previewAudioUrl(url) {
  if (!url) return { ok: false };
  if (!AUDIO_URL_PREFIX.test(url)) return { ok: false, message: AUDIO_URL_ERROR_MESSAGE };
  const box = gE("#hvAATab-Alarm").appendChild(cE("div"));
  box.textContent = url;
  const audio = box.appendChild(cE("audio"));
  audio.controls = true;
  audio.src = url;
  audio.play();
  return { ok: true, message: AUDIO_PREVIEW_MESSAGE };
}

export function runAlarmAutomation(event = { type: EVENT_TRIGGER }) {
  if (event.type === EVENT_TRIGGER) return setAlarm(event.kind);
  if (event.type === EVENT_AUDIO) return setAudioAlarm(event.kind);
  if (event.type === EVENT_NOTIFICATION) return setNotification(event.kind);
  if (event.type === EVENT_PREVIEW_AUDIO_URL) return previewAudioUrl(event.url);
  return undefined;
}
