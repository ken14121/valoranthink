// 数えられること・決まっていることはコードで決める。
// ここで決着がつく場面は Jev に聞かない（クレジット節約と結果の安定のため）。

import type { RoundMoment } from "./types.ts";

export type RuleResult =
  | { decided: true; verdict: string; reason: string }
  | { decided: false; facts: Record<string, string | number | boolean> };

export function applyRules(m: RoundMoment): RuleResult {
  if (!m.me.alive) {
    return { decided: true, verdict: "対象外", reason: "自分が死んでいる場面" };
  }
  if (m.side === "defense" && m.spike.state === "planted") {
    return {
      decided: true,
      verdict: `${m.spike.site ?? "設置先"} へリテイク`,
      reason: "設置後の守備は寄る以外の選択肢がない",
    };
  }
  if (m.alive.enemies === 0) {
    return { decided: true, verdict: "対象外", reason: "敵が全滅している" };
  }

  // Jev に渡す前に、迷いの材料になる数字をまとめておく
  const latest = [...m.enemiesSeen].sort((a, b) => a.secondsAgo - b.secondsAgo)[0];
  return {
    decided: false,
    facts: {
      manAdvantage: m.alive.allies - m.alive.enemies,
      timeLeft: m.timeLeft,
      enemiesSeenCount: m.enemiesSeen.length,
      latestSighting: latest ? `${latest.position}（${latest.secondsAgo} 秒前）` : "なし",
      alliesNearRotateTarget: m.allies.filter((a) => a.position.includes(m.rotateTo)).length,
    },
  };
}
