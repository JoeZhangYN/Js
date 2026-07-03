function addCount(group, key, amount = 1) {
  group[key] = key in group ? group[key] + amount : amount;
}

function hasUsageLogClass(line, className) {
  if (line?.classList?.contains?.(className)) return true;
  return String(line?.className || "").split(/\s+/).includes(className);
}

function isUsageLogCutoff(line) {
  return hasUsageLogClass(line, "tls");
}

function recordRoundProgress(stats, context) {
  if (context.monsterAlive !== 0) return;
  stats.self._turn += context.turn;
  stats.self._round += 1;
  if (context.roundNow === context.roundAll) stats.self._battle += 1;
}

function recordSelectedAction(stats, usage) {
  if (usage.mode === "magic") {
    addCount(stats.magic, usage.magic);
    stats.hurt.mp += usage.mp;
    stats.hurt.oc += usage.oc;
    return;
  }
  if (usage.mode === "items") {
    addCount(stats.items, usage.item);
    return;
  }
  addCount(stats.self, usage.mode);
}

function recordIncomingDamage(stats, text) {
  const match = text.match(/you for (\d+) (\w+) damage/);
  if (!match) return false;
  const [, amount, kind] = match;
  const magic = kind.replace("ing", "");
  const point = Number(amount);
  addCount(stats.hurt, magic, point);
  stats.hurt._count++;
  stats.hurt._total += point;
  stats.hurt._avg = Math.round(stats.hurt._total / stats.hurt._count);
  if (magic.match(/pierc|crush|slash/)) {
    stats.hurt._pcount++;
    stats.hurt._ptotal += point;
    stats.hurt._pavg = Math.round(stats.hurt._ptotal / stats.hurt._pcount);
  } else {
    stats.hurt._mcount++;
    stats.hurt._mtotal += point;
    stats.hurt._mavg = Math.round(stats.hurt._mtotal / stats.hurt._mcount);
  }
  return true;
}

function recordOutgoingDamage(stats, text) {
  const amountMatch = text.match(/for (\d+)( .*)? damage/);
  if (!amountMatch) return false;
  const actorMatch = text.match(/^([\w ]+) [a-z]+s [\w+ -]+ for/);
  const selfMatch = text.match(/^You (\w+)/);
  const magic = actorMatch ? actorMatch[1].replace(/^Your /, "") : selfMatch?.[1];
  if (!magic) return false;
  const [, amount] = amountMatch;
  addCount(stats.damage, magic, Number(amount));
  return true;
}

function recordVitalTheftDamage(stats, text) {
  const match = text.match(/Vital Theft hits .*? for (\d+) damage/);
  if (!match) return false;
  const point = Number(match[1]);
  addCount(stats.damage, "Vital Theft", point);
  return true;
}

function recordRestore(stats, usage, text) {
  const pointMatch = text.match(/\d+/);
  if (!pointMatch) return false;
  const magic =
    usage.mode === "defend"
      ? "defend"
      : text.match(/You drain \d+ HP from/)
        ? "drain"
        : usage.magic || usage.item;
  addCount(stats.restore, magic, Number(pointMatch[0]));
  return true;
}

function recordExternalRestore(stats, text) {
  const match =
    text.match(/^(.*) restores (\d+) points of (\w+)/) ||
    text.match(/^You (drain) (\d+) points of (\w+)/);
  if (!match) return false;
  addCount(stats.restore, match[1], Number(match[2]));
  return true;
}

function recordAbsorbedDamage(stats, log, index, text) {
  const match = text.match(/(.*) absorbs (\d+) points of damage from the attack into (\d+) points of (\w+) damage/);
  if (!match) return false;
  const prevText = log[index - 1]?.textContent || "";
  const prevMatch = prevText.match(/you for (\d+) (\w+) damage/);
  const hurtKind = prevMatch ? prevMatch[2].replace("ing", "") : "unknown";
  addCount(stats.hurt, hurtKind, Number(match[2]));
  addCount(stats.hurt, `${match[1].replace("Your ", "")}_${match[4]}`, Number(match[3]));
  return true;
}

function recordProficiency(stats, text) {
  const match = text.match(/You gain ([\d.]+) points of (.*?) proficiency/);
  if (!match) return false;
  const [, amount, kind] = match;
  addCount(stats.proficiency, kind, Number(amount));
  stats.proficiency[kind] = stats.proficiency[kind].toFixed(3) * 1;
  return true;
}

function isIgnoredBattleLog(text) {
  return (
    text.trim() === "" ||
    text.match(/You (gain |cast |use |are Victorious|have reached Level|have obtained the title|do not have enough MP)/) ||
    text.match(/Cooldown|has expired|Spirit Stance|gains the effect|insufficient Spirit|Stop beating dead ponies| defeat |Clear Bonus|brink of defeat|Stop \w+ing|Spawned Monster| drop(ped|s) |defeated/)
  );
}

function recordBattleLogLine(stats, usage, log, index) {
  const text = log[index].textContent;
  if (text.match(/you for \d+ \w+ damage/)) return recordIncomingDamage(stats, text);
  else if (
    text.match(/^[\w ]+ [a-z]+s [\w+ -]+ for \d+( .*)? damage/) ||
    text.match(/^You .* for \d+ .* damage/)
  )
    return recordOutgoingDamage(stats, text);
  else if (text.match(/Vital Theft hits .*? for \d+ damage/)) return recordVitalTheftDamage(stats, text);
  else if (text.match(/You (evade|parry|block) the attack|misses the attack against you|(casts|uses) .* misses the attack/))
    stats.self.evade++;
  else if (text.match(/(resists your spell|Your spell is absorbed|(evades|parries) your (attack|spell))|Your attack misses its mark|Your spell fails to connect/))
    stats.self.miss++;
  else if (text.match(/You gain the effect Focusing/)) stats.self.focus++;
  else if (
    text.match(/^Recovered \d+ points of/) ||
    text.match(/You are healed for \d+ Health Points/) ||
    text.match(/You drain \d+ HP from/)
  )
    return recordRestore(stats, usage, text);
  else if (text.match(/(restores|drain) \d+ points of/)) return recordExternalRestore(stats, text);
  else if (text.match(/absorbs \d+ points of damage from the attack into \d+ points of \w+ damage/))
    return recordAbsorbedDamage(stats, log, index, text);
  else if (text.match(/You gain .* proficiency/)) return recordProficiency(stats, text);
  else if (!isIgnoredBattleLog(text)) return false;
  return true;
}

export function applyBattleActionUsageStats(stats, usage, context) {
  recordRoundProgress(stats, context);
  recordSelectedAction(stats, usage);
  for (let i = 0; i < usage.log.length; i++) {
    if (isUsageLogCutoff(usage.log[i])) break;
    recordBattleLogLine(stats, usage, usage.log, i);
  }
  return stats;
}
