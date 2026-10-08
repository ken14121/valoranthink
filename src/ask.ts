// 迷う判断だけを Jev に、はい/いいえ（Noul）の質問として聞く。
// 外れ方を見て、自分の判断基準を言葉にして質問文に書き足していく。

import { noul, TypeSafeClient } from "@typesafe-ai/sdk";
import type { RoundMoment } from "./types.ts";

export const CONFIDENT = 0.7;

export function buildRequest(m: RoundMoment, facts: Record<string, string | number | boolean>) {
  const state = {
    map: m.map,
    side: m.side === "attack" ? "攻め" : "守り",
    timeLeftSeconds: m.timeLeft,
    me: m.me,
    alive: m.alive,
    allies: m.allies,
    enemiesSeen: m.enemiesSeen,
    spike: m.spike,
    economy: m.economy,
    facts,
  };
  const target = m.rotateTo;
  return {
    rotate: {
      state,
      questions: {
        rotate: noul(
          `VALORANT の上位ランクやプロの立ち回りを基準にして答えてください。この場面で、自分は ${target} に寄るべきでしたか？`,
          {
            true: `${target} に寄るのが有利。見えた敵の情報や人数差から、${target} での人数有利・リテイクが狙える`,
            false: `今の位置で待つ（情報を取る・持ち場を守る）方が有利。フェイクの可能性や、寄ると逆サイトが空く危険が大きい`,
          },
        ),
      },
    },
    early: {
      state,
      questions: {
        early: noul(`${target} に寄るなら、この場面より 10 秒以上早く動き始めるべきでしたか？`, {
          true: "もっと早い時点で寄る判断ができる材料があった",
          false: "この時点で寄るので間に合う、またはこれより早いと情報が足りない",
        }),
      },
    },
  };
}

export interface Answer {
  rotate: number;
  early?: number;
  /** 判断の道筋で一番低い確かさ */
  confidence: number;
}

/** はい/いいえの確率から、その答えの確かさ（0.5〜1）を出す */
const certainty = (p: number) => Math.max(p, 1 - p);

export async function ask(
  client: TypeSafeClient,
  req: ReturnType<typeof buildRequest>,
): Promise<Answer> {
  const r = await client.systemOne(req.rotate);
  const rotate = r.answers.rotate.noul;
  // 「寄るべき」でなければ、早さは聞かない
  if (rotate < 0.5) return { rotate, confidence: certainty(rotate) };

  const e = await client.systemOne(req.early);
  const early = e.answers.early.noul;
  return { rotate, early, confidence: Math.min(certainty(rotate), certainty(early)) };
}
