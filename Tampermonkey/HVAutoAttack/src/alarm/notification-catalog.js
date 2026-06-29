const NOTIFICATIONS = Object.freeze([
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
]);

export function getAlarmNotification(kind, lang) {
  return (NOTIFICATIONS[lang] || NOTIFICATIONS[2])[kind] || NOTIFICATIONS[2].Common;
}
