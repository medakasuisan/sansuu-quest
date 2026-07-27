# v6 Phase 2 発射プロンプト — かざん数学ロジック層（Sonnet実装係）

> 2026-07-18 策定・**発射可能**（bible 非依存）。前提ゲート: Phase 2 の発射前に Phase 1 bible の正本化は不要だが、
> 佐々木さんの「Phase 2 GO」を取ること。以下の``` 内をそのまま実装係プロンプトとして渡す。

```
あなたは「さんすうクエスト」の作業担当です。会話履歴はありません。以下の情報だけで作業してください。

## プロダクト
小学3年生向け算数学習ゲーム。単一ファイルHTML(外部リソース・CDN・通信・外部フォント一切禁止)。
正本: /Users/sasaki_shin-ichi/Documents/sansu-quest/sansu-quest.html (約3500行)

## 作業前の必読ファイル(全文読むこと)
- /Users/sasaki_shin-ichi/Documents/sansu-quest/docs/v6-plan-kazan-area.md (計画の正本。特に §0 §2 §5)
- sansu-quest.html の <script> 冒頭〜selfTest まで(既存アーキテクチャの理解。約 770〜1130 行目)

## 全作業共通の鉄則
1. 【不可侵】既存のわり算ロジック(makeDivision/assertDivision/kukuSteps/Generators の既存4生成器/
   CURRICULUM の div-* 3ユニット/selfTest 既存6ケース)、ゲーム層・ストーリー・セーブ処理は変更禁止。
2. 【罰ゼロ】✗の帰結は「進まないだけ」。ペナルティを追加しない。
3. 【スキーマ厳守】生成器は {prompt, fields, answer, explain, d} を返す。UIエンジンに単元固有の知識を持ち込まない。
4. 【表記】子ども向け文言はひらがな多め。
5. 【乗法順序非依存の基本原則】(v6計画 §5) 解説で「じゅんばんを かえても こたえは おなじ」を教える。
   式の順序を正誤判定に使わない。
6. git 操作(add/commit)はしない。ファイル編集のみ。

## タスク
sansu-quest.html に「かけざんのかざん」の数学ロジック層を実装する。
変更範囲: (a)数生成関数 (b)Generators への生成器9本追加 (c)CURRICULUM の 'mul' プレースホルダを
4ユニットに置換 (d)selfTest へのケース追加。ゲーム層・エリア選択UIはこの Phase では触らない
(ユニットカードが増えてプレイ可能になるだけでよい)。

## 実装仕様

### 1. 数生成(構成的生成・乱数リトライ方式は禁止)
makeMultiplication({ digits, allowZero })
- digits='easy10': a = 10×rand(2,9), b = rand(2,9)
- digits='2x1'  : a = rand(11,99),  b = rand(2,9)
- digits='3x1'  : a = rand(101,999), b = rand(2,9)
- digits='2x2'  : a = rand(11,99),  b = rand(11,99)
- allowZero が true のとき 10% の確率で a か b を 0 にする(どちらかランダム)
- 返り値 { a, b, p: a*b, parts } 。parts = 分配分解:
  2x1/3x1 は a を位で分解(23→{a1:20,a2:3} / 213→{a1:200,a2:10,a3:3})、
  2x2 は b を位で分解(45→{b1:40,b2:5})、easy10/zero は parts なし

assertMultiplication(d):
- a,b,p が整数 / p === a*b を独立再計算で一致確認 / digits ごとの桁範囲検証
- parts があるとき: 分解の和が元の数に一致(20+3===23 等)
- 失敗時は throw(握りつぶし禁止)

### 2. 解説の共通関数
bunpaiSteps(d): 分配法則ベースのステップ配列を返す(わり算の kukuSteps に相当)。
- 例(23×4): 「23を **20と3** に分けるよ」→「20×4＝**80**」→「3×4＝**12**」→「80＋12＝**92**」
- 2x2(23×45): 「45を **40と5** に分けるよ」→「23×40＝920」→「23×5＝115」→「920＋115＝**1035**」
- easy10(30×4): 「30は **10が3こ**」→「10のたばが 3×4＝12こ」→「だから **120**」
- 0のとき: 「**0に なにを かけても 0** だよ。ぜんぶ 0こ ってことだからね」
checkFormula(d): 除法での確かめ「92 ÷ 4 ＝ 23」(0問題は確かめ式なし・上の一文で代替)

### 3. 生成器9本(すべて共通スキーマ・visual は既存 emoji グループ図を流用)
| 生成器 | prompt | fields | answer |
|--------|--------|--------|--------|
| mulTens | calc: '30 × 4 ＝ ?' (easy10) | [{key:'p',label:'こたえ'}] | {p} |
| mulCalc2x1 | calc (2x1) | 同上 | {p} |
| mulCalc3x1 | calc (3x1) | 同上 | {p} |
| mulCalc2x2 | calc (2x2) | 同上 | {p} |
| mulZero | word: 的当てゲーム文脈「0てんの ところに @@3@@かい はいったよ。とくてんは なんてん?」(0×3 と 3×0 の両パターン) | [{key:'p',label:'とくてん',unit:'てん'}] | {p:0} |
| mulLaw | word: 計算のくふう「4×7×25 を くふうして 計算しよう。さきに 4×25 を すると?」→ 2段入力(4×25=□, 7×□=□) | [{key:'m',label:'4×25'},{key:'p',label:'こたえ'}] | {m:100,p:700} (数値は 4×N×25, 2×N×5 等の「きりのいいペア」から構成) |
| mulEstimate | word: 「19×6 の こたえは 120 より 大きい? 小さい?」 | choice型 2択(下記 4. 参照) | 方向 |
| wordTimes | word: 「1mの ねだんが @@85@@円の リボンを @@25@@m 買います。だいきんは?」等の倍・値段文脈 | [{key:'p',label:'だいきん',unit:'円'}] | {p} |
| wordInverse | word: 「ひもを @@4@@とうぶんした 1つぶんが @@9@@cm。はじめの ながさは?」(除法の逆) | [{key:'p',label:'ながさ',unit:'cm'}] | {p:36} 型 |
- wordTimes / wordInverse の explain.steps 冒頭に立式解説を入れ、そこに必ず
  「**しきは 85×25 でも 25×85 でも いいよ。じゅんばんを かえても こたえは おなじ**」の趣旨の1文を入れる(順序非依存の基本原則)
- visual: 2x1 は emoji アレイ(groups=b, groupSize=a1/10 の束表現が難しければ個数を丸めた caption 併用可)。
  無理に凝らず、図と数の一致が selfTest で検証できる形を最優先する

### 4. choice型 fields の最小実装(共通UI部品 U1 の初出)
- fields: [{key:'c', type:'choice', label:'どっち?', options:[{value:'big',label:'大きい'},{value:'small',label:'小さい'}]}]
- UIエンジンの解答欄生成部に type==='choice' の分岐を追加(ボタン2〜4個・タップで選択・既存の数値入力を壊さない)
- 採点は answer.c との一致。既存の数値採点ロジックに手を入れず分岐で追加すること

### 5. CURRICULUM
'mul' プレースホルダ(enabled:false)を削除し、以下の4ユニットを追加(すべて enabled:true, questions:10):
- mul-basic 🔥「かけざんの きほん」: mulTens 4 / mulCalc2x1 4 / mulZero 2
- mul-big 🌋「大きな かけざん」: mulCalc3x1 4 / mulCalc2x2 4 / mulCalc2x1 2
- mul-tech ✨「かけざんの わざ」: mulLaw 4 / mulEstimate 4 / mulZero 2
- mul-word 📖「かけざんの ぶんしょうだい」: wordTimes 4 / wordInverse 3 / mulCalc2x1 3
(数字は pool の weight。hissan プレースホルダは残す)

### 6. selfTest 追加
- 追加9生成器 × 各200問: assertMultiplication + fields/answer の整合 + choice型は options に正解が存在
- mulZero: answer.p===0 / mulLaw: m,p の再計算一致 / mulEstimate: 実積と方向の一致
- 既存6ケースは変更禁止

## fixture 検算(実装後、指定値で手動生成して確認・実物出力を報告)
1. 23×4 の bunpaiSteps に「20×4」「80」「3×4」「12」「92」が全て含まれる
2. 0×7 または 7×0: answer.p===0 かつ steps に「0に なにを かけても 0」を含む
3. 23×45 の steps: parts が 40 と 5(「40」「920」「115」「1035」を含む)
4. 19×6 見積り: 正解方向が「小さい」(実積114 < 120)
5. wordTimes の steps に「じゅんばんを かえても」の1文が含まれる

## 検証(すべて実施・証跡=コマンド+生出力 必須)
1. node + jsdom で sansu-quest.html をロードし「✅ selfTest passed」ログを確認(出力貼付)
2. fixture 5点の実物出力
3. 既存わり算3ユニットの selfTest 継続パス(回帰確認)
4. git diff --stat 貼付 + 変更が指示範囲内であることの自己申告

## 報告形式(必須)
1. 変更サマリー(何をどこに足したか・行数規模)
2. 検証証跡(タイムスタンプ付き生出力)
3. 未実施事項・懸念・自信のない箇所を正直に列挙(なければ「なし」と明記)
```
