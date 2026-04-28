// 警报系统：屏幕弹窗 + 音频播放 + 浏览器 desktop notification。
import { gE, cE } from "../dom/query.js";
import { g } from "../state/store.js";
import { time } from "../core/time.js";

export function setAlarm(e) {
  e = e || "Common";
  if (g("option").notification) setNotification(e);
  if (
    g("option").alert &&
    g("option").audioEnable &&
    g("option").audioEnable[e]
  )
    setAudioAlarm(e);
}

export function setAudioAlarm(e) {
  let audio;
  if (gE(`#hvAAAlert-${e}`)) {
    audio = gE(`#hvAAAlert-${e}`);
  } else {
    audio = gE("body").appendChild(cE("audio"));
    audio.id = `hvAAAlert-${e}`;
    const fileType = ".ogg"; // var fileType = (/Chrome|Safari/.test(navigator.userAgent)) ? '.mp3' : '.wav';
    audio.src =
      g("option").audio && g("option").audio[e]
        ? g("option").audio[e]
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

export function setNotification(e) {
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
