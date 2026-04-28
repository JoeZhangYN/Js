// 答题页面自动答题。
import { gE, cE } from "../dom/query.js";
import { g } from "../state/store.js";
import { time } from "../core/time.js";
import { setAlarm } from "../alarm/alarm.js";

export function riddleAlert() {
  // 答题警报
  setAlarm("Riddle");

  const answers = ["aj", "fs", "pp", "rd", "ts"];

  const checkTime = function () {
    let time;
    if (typeof g("time") === "undefined") {
      const timeDiv = gE("#riddlecounter>div>div", "all");
      if (timeDiv.length === 0) return;
      time = "";
      for (let j = 0; j < timeDiv.length; j++) {
        time =
          (
            timeDiv[j].style.backgroundPosition.match(/(\d+)px$/)[1] / 12
          ).toString() + time;
      }
      g("time", parseInt(time));
    } else {
      time = g("time");
      time--;
      g("time", time);
    }
    document.title = time;
    if (time <= g("option").riddleAnswerTime)
      riddleSubmit(answers[Math.floor(Math.random() * 5)]);
  };

  for (let i = 0; i < 30; i++) {
    setTimeout(checkTime, i * 1000);
  }

  function riddleSubmit(answer) {
    if (answer.includes("aj")) {
      document.getElementById(
        "riddler1"
      ).children[5].children[0].children[0].checked = true;
    }
    if (answer.includes("fs")) {
      document.getElementById(
        "riddler1"
      ).children[2].children[0].children[0].checked = true;
    }
    if (answer.includes("pp")) {
      document.getElementById(
        "riddler1"
      ).children[4].children[0].children[0].checked = true;
    }
    if (answer.includes("ra")) {
      document.getElementById(
        "riddler1"
      ).children[1].children[0].children[0].checked = true;
    }
    if (answer.includes("rd")) {
      document.getElementById(
        "riddler1"
      ).children[3].children[0].children[0].checked = true;
    }
    if (answer.includes("ts")) {
      document.getElementById(
        "riddler1"
      ).children[0].children[0].children[0].checked = true;
    }

    document.getElementById("riddlesubmit").click();
  }
}
