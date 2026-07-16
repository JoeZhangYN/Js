export const BattleCompletionOutcome = Object.freeze({
  DEFEAT: "defeat",
  NEXT_ROUND: "nextRound",
  VICTORY: "victory",
  ONGOING: "ongoing",
});

export function classifyBattleCompletion(context) {
  if (context.monsterAlive > 0) return BattleCompletionOutcome.DEFEAT;
  if (context.roundNow !== context.roundAll) return BattleCompletionOutcome.NEXT_ROUND;
  if (context.roundNow === context.roundAll) return BattleCompletionOutcome.VICTORY;
  return BattleCompletionOutcome.ONGOING;
}
