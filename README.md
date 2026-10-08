# valoranthink

VALORANT の試合後の振り返りツール。録画から書き写した「迷った場面」を読み、
「B に寄るべきだったか」「もっと早く動けたか」を Jev（TypeSafe AI）に聞いて、ラウンドごとに一覧で返す。

試合中には何も動かさない。企画と Riot のポリシーについては [docs/plan.md](docs/plan.md)。

## 使い方

Node.js 22.18 以上。

```sh
npm install
npm run review -- data/sample-match.json --dry-run   # Jev に送る内容を表示するだけ
npm run review -- data/my-match.json                 # Jev に聞く（.env.local に TYPESAFE_API_KEY）
npm run check                                        # 型チェック
```

`TYPESAFE_API_KEY` がないときは自動で dry-run になる。

## 試合ファイル

場面の形は [src/types.ts](src/types.ts)、例は [data/sample-match.json](data/sample-match.json)。
`data/` に置いた自分の試合ファイルは git に入らない（サンプルだけ共有）。

`myAnswer.rotate` に自分の答えを書いておくと、最後に答え合わせ（一致数・外れたラウンド・ブライアスコア）が出る。
