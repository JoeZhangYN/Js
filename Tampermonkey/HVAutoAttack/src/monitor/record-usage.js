// 每回合技能/物品使用统计 + 战斗结束聚合。
// file-size-gate: exempt phase-4-monolith
import { setValue, getValue, delValue } from "../state/storage.js";
import { g } from "../state/store.js";
import { time } from "../core/time.js";
import { setAudioAlarm } from "../alarm/alarm.js";
import {
  BattlePauseEvent,
  runBattlePauseAutomation,
} from "../battle/pause-automation.js";

export function recordUsage(parm) {
  const stats = getValue("stats", true) || {
    self: {
      _startTime: time(3),
      _turn: 0,
      _round: 0,
      _battle: 0,
      _monster: 0,
      _boss: 0,
      evade: 0,
      miss: 0,
      focus: 0,
    },
    restore: {
      // 回复量
    },
    items: {
      // 物品使用次数
    },
    magic: {
      // 技能使用次数
    },
    damage: {
      // 技能攻击造成的伤害
    },
    hurt: {
      // 受到攻击造成的伤害
      mp: 0,
      oc: 0,
      _avg: 0,
      _count: 0,
      _total: 0,
      _mavg: 0,
      _mcount: 0,
      _mtotal: 0,
      _pavg: 0,
      _pcount: 0,
      _ptotal: 0,
    },
    proficiency: {
      // 熟练度
    },
  };
  let text;
  let magic;
  let point;
  let reg;
  if (g("monsterAlive") === 0) {
    stats.self._turn += g("turn");
    stats.self._round += 1;
    if (g("roundNow") === g("roundAll")) stats.self._battle += 1;
  }
  if (parm.mode === "magic") {
    magic = parm.magic;
    stats.magic[magic] = magic in stats.magic ? stats.magic[magic] + 1 : 1;
    stats.hurt.mp += parm.mp;
    stats.hurt.oc += parm.oc;
  } else if (parm.mode === "items") {
    stats.items[parm.item] =
      parm.item in stats.items ? stats.items[parm.item] + 1 : 1;
  } else {
    stats.self[parm.mode] =
      parm.mode in stats.self ? stats.self[parm.mode] + 1 : 1;
  }
  const debug = false;
  let log = false;
  for (let i = 0; i < parm.log.length; i++) {
    if (parm.log[i].className === "tls") break;
    text = parm.log[i].textContent;
    if (debug) console.log(text);
    if (text.match(/you for \d+ \w+ damage/)) {
      reg = text.match(/you for (\d+) (\w+) damage/);
      magic = reg[2].replace("ing", "");
      point = reg[1] * 1;
      stats.hurt[magic] =
        magic in stats.hurt ? stats.hurt[magic] + point : point;
      stats.hurt._count++;
      stats.hurt._total += point;
      stats.hurt._avg = Math.round(stats.hurt._total / stats.hurt._count);
      if (magic.match(/pierc|crush|slash/)) {
        stats.hurt._pcount++;
        stats.hurt._ptotal += point;
        stats.hurt._pavg = Math.round(
          stats.hurt._ptotal / stats.hurt._pcount
        );
      } else {
        stats.hurt._mcount++;
        stats.hurt._mtotal += point;
        stats.hurt._mavg = Math.round(
          stats.hurt._mtotal / stats.hurt._mcount
        );
      }
    } else if (
      text.match(/^[\w ]+ [a-z]+s [\w+ -]+ for \d+( .*)? damage/) ||
      text.match(/^You .* for \d+ .* damage/)
    ) {
      // text.match(/for \d+ .* damage/)
      reg = text.match(/for (\d+)( .*)? damage/);
      magic = text.match(/^[\w ]+ [a-z]+s [\w+ -]+ for/)
        ? text
            .match(/^([\w ]+) [a-z]+s [\w+ -]+ for/)[1]
            .replace(/^Your /, "")
        : text.match(/^You (\w+)/)[1];
      point = reg[1] * 1;
      stats.damage[magic] =
        magic in stats.damage ? stats.damage[magic] + point : point;
    } else if (text.match(/Vital Theft hits .*? for \d+ damage/)) {
      magic = "Vital Theft";
      point = text.match(/Vital Theft hits .*? for (\d+) damage/)[1] * 1;
      stats.damage[magic] =
        magic in stats.damage ? stats.damage[magic] + point : point;
    } else if (
      text.match(
        /You (evade|parry|block) the attack|misses the attack against you|(casts|uses) .* misses the attack/
      )
    ) {
      stats.self.evade++;
    } else if (
      text.match(
        /(resists your spell|Your spell is absorbed|(evades|parries) your (attack|spell))|Your attack misses its mark|Your spell fails to connect/
      )
    ) {
      stats.self.miss++;
    } else if (text.match(/You gain the effect Focusing/)) {
      stats.self.focus++;
    } else if (
      text.match(/^Recovered \d+ points of/) ||
      text.match(/You are healed for \d+ Health Points/) ||
      text.match(/You drain \d+ HP from/)
    ) {
      magic =
        parm.mode === "defend"
          ? "defend"
          : text.match(/You drain \d+ HP from/)
          ? "drain"
          : parm.magic || parm.item;
      point = text.match(/\d+/)[0] * 1;
      stats.restore[magic] =
        magic in stats.restore ? stats.restore[magic] + point : point;
    } else if (text.match(/(restores|drain) \d+ points of/)) {
      reg =
        text.match(/^(.*) restores (\d+) points of (\w+)/) ||
        text.match(/^You (drain) (\d+) points of (\w+)/);
      magic = reg[1];
      point = reg[2] * 1;
      stats.restore[magic] =
        magic in stats.restore ? stats.restore[magic] + point : point;
    } else if (
      text.match(
        /absorbs \d+ points of damage from the attack into \d+ points of \w+ damage/
      )
    ) {
      reg = text.match(
        /(.*) absorbs (\d+) points of damage from the attack into (\d+) points of (\w+) damage/
      );
      point = reg[2] * 1;
      const prevText = parm.log[i - 1]?.textContent || "";
      const prevMatch = prevText.match(/you for (\d+) (\w+) damage/);
      magic = prevMatch ? prevMatch[2].replace("ing", "") : "unknown";
      stats.hurt[magic] =
        magic in stats.hurt ? stats.hurt[magic] + point : point;
      point = reg[3] * 1;
      magic = `${reg[1].replace("Your ", "")}_${reg[4]}`;
      stats.hurt[magic] =
        magic in stats.hurt ? stats.hurt[magic] + point : point;
    } else if (text.match(/You gain .* proficiency/)) {
      reg = text.match(/You gain ([\d.]+) points of (.*?) proficiency/);
      magic = reg[2];
      point = reg[1] * 1;
      stats.proficiency[magic] =
        magic in stats.proficiency ? stats.proficiency[magic] + point : point;
      stats.proficiency[magic] = stats.proficiency[magic].toFixed(3) * 1;
    } else if (
      text.trim() === "" ||
      text.match(
        /You (gain |cast |use |are Victorious|have reached Level|have obtained the title|do not have enough MP)/
      ) ||
      text.match(
        /Cooldown|has expired|Spirit Stance|gains the effect|insufficient Spirit|Stop beating dead ponies| defeat |Clear Bonus|brink of defeat|Stop \w+ing|Spawned Monster| drop(ped|s) |defeated/
      )
    ) {
      // nothing;
    } else if (debug) {
      log = true;
      setAudioAlarm("Error");
      console.log(text);
    }
  }
  if (debug && log) {
    console.table(stats);
    runBattlePauseAutomation({ type: BattlePauseEvent.PAUSE });
  }
  setValue("stats", stats);
}

export function recordUsage2() {
  const stats = getValue("stats", true);
  stats.self._monster += g("monsterAll");
  stats.self._boss += g("bossAll");

  if (g("option").recordEach && g("roundNow") === g("roundAll")) {
    const old = getValue("statsOld", true) || [];
    stats.__name = getValue("battleCode");
    stats.self._endTime = time(3);
    old.push(stats);
    setValue("statsOld", old);
    delValue("stats");
  } else {
    setValue("stats", stats);
  }
}
