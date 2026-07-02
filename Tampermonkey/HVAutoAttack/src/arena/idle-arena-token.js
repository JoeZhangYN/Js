import { gE } from "../dom/query.js";

export const IDLE_ARENA_TOKEN_URLS = Object.freeze([
  "?s=Battle&ss=gr",
  "?s=Battle&ss=ar",
  "?s=Battle&ss=ar&page=2",
  "?s=Battle&ss=rb",
]);

export function collectIdleArenaToken(arena, data, e) {
  const postokenInput = gE('input[name="postoken"]', data);
  if (postokenInput) arena.token.postoken = postokenInput.value;
  if (e.target.responseURL.match(/ss=gr$/)) {
    const grImg = gE('img[src*="startgrindfest.png"]', data);
    if (grImg) {
      const match = grImg.getAttribute("onclick")?.match(/init_battle\(\d+,\s*'(.*?)'\)/);
      arena.token.gr = match ? match[1] : true;
    }
  } else {
    gE('img[src*="startchallenge.png"]', "all", data).forEach((img) => {
      const match = img
        .getAttribute("onclick")
        ?.match(/init_battle\((\d+)(?:,\s*\d+(?:,\s*'(.*?)')?)?\)/);
      if (match) arena.token[match[1]] = match[2] || true;
    });
  }
  arena.token.length++;
}
