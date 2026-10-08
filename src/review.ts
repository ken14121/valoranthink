// 試合後の振り返り：ラウンドごとの場面を読み、「寄るべきだったか」を一覧で返す。
//
//   npm run review -- data/sample-match.json            # Jev に聞く（TYPESAFE_API_KEY が必要）
//   npm run review -- data/sample-match.json --dry-run  # Jev に送る内容を表示するだけ（クレジットを使わない）

import { readFile } from "node:fs/promises";
import { TypeSafeClient } from "@typesafe-ai/sdk";
import { ask, buildRequest, CONFIDENT, type Answer } from "./ask.ts";
import { applyRules } from "./rules.ts";
import type { RoundMoment } from "./types.ts";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run") || !process.env.TYPESAFE_API_KEY;

if (!file) {
  console.error("使い方: npm run review -- <試合ファイル.json> [--dry-run]");
  process.exit(1);
}

const moments: RoundMoment[] = JSON.parse(await readFile(file, "utf8"));
const client = dryRun ? null : new TypeSafeClient();
if (dryRun) console.log("[dry-run] Jev には送りません。送る予定の内容を表示します。\n");

const pct = (p: number) => `${Math.round(p * 100)}%`;
const checked: { round: number; jev: boolean; mine: boolean; p: number }[] = [];

for (const m of moments) {
  const head = `R${m.round}（${m.side === "attack" ? "攻め" : "守り"}・残り ${m.timeLeft} 秒）${m.whatIDid} → ${m.outcome === "won" ? "勝ち" : "負け"}`;
  const rule = applyRules(m);
  if (rule.decided) {
    console.log(`${head}\n  ${rule.verdict}（コードで判定: ${rule.reason}）\n`);
    continue;
  }

  const req = buildRequest(m, rule.facts);
  if (!client) {
    console.log(`${head}\n  送る状況: ${JSON.stringify(req.rotate.state)}\n`);
    continue;
  }

  const a: Answer = await ask(client, req);
  const verdict =
    a.rotate >= 0.5
      ? `${m.rotateTo} 寄り推奨（${pct(a.rotate)}）` +
        (a.early !== undefined && a.early >= 0.5 ? `、10 秒以上早く動けた（${pct(a.early)}）` : "")
      : `待ちが正解（寄る ${pct(a.rotate)}）`;
  const flag = a.confidence < CONFIDENT ? " ⚠ 要確認" : "";
  console.log(`${head}\n  ${verdict}${flag}\n`);

  if (m.myAnswer?.rotate !== undefined) {
    checked.push({ round: m.round, jev: a.rotate >= 0.5, mine: m.myAnswer.rotate, p: a.rotate });
  }
}

// 答え合わせ：本人の答え（myAnswer）があるラウンドだけ
if (checked.length > 0) {
  const hits = checked.filter((c) => c.jev === c.mine).length;
  // ブライアスコア：確率がどれくらい当たっているか（0 が最良、0.25 が当てずっぽう）
  const brier = checked.reduce((s, c) => s + (c.p - (c.mine ? 1 : 0)) ** 2, 0) / checked.length;
  console.log(`答え合わせ: ${hits}/${checked.length} 一致、ブライアスコア ${brier.toFixed(3)}`);
  for (const c of checked.filter((c) => c.jev !== c.mine)) {
    console.log(`  外れ R${c.round}: Jev ${c.jev ? "寄る" : "待つ"}（${pct(c.p)}） / 自分 ${c.mine ? "寄る" : "待つ"}`);
  }
}
