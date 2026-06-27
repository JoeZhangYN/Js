// 警报系统：屏幕弹窗 + 音频播放 + 浏览器 desktop notification。
import { gE, cE } from "../dom/query.js";
import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";

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

function setAlarm(e) {
  e = e || "Common";
  if (readOptionField("notification", false)) setNotification(e);
  const audioEnable = readOptionField("audioEnable", {});
  if (readOptionField("alert", false) && audioEnable?.[e]) setAudioAlarm(e);
}

function readOptionField(key, fallback) {
  return runOptionAutomation({ type: OptionEvent.READ_FIELD, key, fallback });
}

function setAudioAlarm(e) {
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
  const notifications = [
    {
      Common: { text: "未知", time: 5 },
      Error: { text: "某些错误发生了", time: 10 },
      Defeat: {
        text: "游戏失败\n玩家可自行查看战斗Log寻找失败原因",
        time: 5,
      },
      Riddle: { text: "小马答题\n紧急！\n紧急！\n紧急！", time: 30 },
      Victory: { text: "游戏胜利\n页面将在3秒后刷新", time: 3 },
      Test: { text: "测试文本", time: 3 },
    },
    {
      Common: { text: "未知", time: 5 },
      Error: { text: "某些錯誤發生了", time: 10 },
      Defeat: {
        text: "遊戲失敗\n玩家可自行查看戰鬥Log尋找失敗原因",
        time: 5,
      },
      Riddle: { text: "小馬答題\n緊急！\n緊急！\n緊急！", time: 30 },
      Victory: { text: "遊戲勝利\n頁面將在3秒後刷新", time: 3 },
      Test: { text: "測試文本", time: 3 },
    },
    {
      Common: { text: "unknown", time: 5 },
      Error: { text: "Some errors have occurred", time: 10 },
      Defeat: {
        text: "You have been defeated.\nYou can check the battle log.",
        time: 5,
      },
      Riddle: { text: "Riddle\nURGENT\nURGENT\nURGENT", time: 30 },
      Victory: {
        text: "You're victorious.\nThis page will refresh in 3 seconds.",
        time: 3,
      },
      Test: { text: "testText", time: 3 },
    },
  ];

  const notification = notifications[g("lang")][e];
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
