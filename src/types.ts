// 振り返り用に手入力する「ラウンドの一場面」。
// 録画を止めて、迷った瞬間（寄るか待つか）の状況を書き写す。

export type Side = "attack" | "defense";
export type Economy = "full" | "half" | "eco";

export type Sighting = {
  /** 例: "B メイン"、"ミッド" */
  position: string;
  /** その場面の何秒前に見えたか（足音・スキャン含む） */
  secondsAgo: number;
};

export interface RoundMoment {
  round: number;
  side: Side;
  map: string;
  /** 判断した瞬間のラウンド残り時間（秒）。スパイク設置後は設置後の残り */
  timeLeft: number;
  me: { agent: string; alive: boolean; position: string };
  /** 生存人数（自分を含む） */
  alive: { allies: number; enemies: number };
  allies: { agent: string; position: string }[];
  enemiesSeen: Sighting[];
  spike: { state: "carried" | "dropped" | "planted"; site?: string };
  economy: { team: Economy; enemy: Economy };
  /** 「寄る」なら行き先の候補（例: "B"） */
  rotateTo: string;
  /** 実際にしたこと */
  whatIDid: string;
  outcome: "won" | "lost";
  /** 本人の答え（答え合わせ用、任意）。true = 寄るべきだった */
  myAnswer?: { rotate?: boolean };
}
