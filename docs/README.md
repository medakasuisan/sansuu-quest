# さんすうクエスト ドキュメント正本

> **この repo（`medakasuisan/sansuu-quest`）がさんすうクエストの正本です。**
> コード（`index.html`）・設計ドキュメント（`docs/`）・原本画像（`assets/`）はすべてここに置きます。

## 経緯（2026-07-25 統合）

2026-07-18 まで `~/Documents/sansu-quest`（ローカル git のみ・リモートなし）で開発していたが、
2026-07-23 に Claude Artifact から `~/Documents/sansuu-quest` へ import して Vercel 公開したため、
**正本が 2 つに割れていた**（コードは新 repo、設計ドキュメントと原本画像は旧 repo）。

2026-07-25 に本 repo へ `docs/` `assets/` を統合し、旧 repo は凍結した。

- 旧 repo: `~/Documents/sansu-quest`（**凍結・参照専用**。`ARCHIVED.md` 参照）
- 旧 repo の `docs/` `assets/` は working tree から削除済み（git 履歴には残存）

## 構成

| パス | 内容 |
|---|---|
| `index.html` | アプリ本体（単体 HTML・表示画像は base64 埋め込み） |
| `docs/` | 設計正本（世界観 bible・モンスター設計・実装プロンプト集・エリア計画） |
| `assets/monsters/` `assets/scenes/` | Codex 生成画像の**原本 PNG** + WebP（リテイク・再リサイズ用） |
| `assets/brand/` | favicon / OGP の原本（2026-07-25〜） |
| `.vercelignore` | `docs/` `assets/` を配信対象外にする（表示用は base64 埋め込み済みのため） |

## 画像を追加・差し替えるときの正本

1. **画風の固定ルール** = `monster-design.md` の「共通スタイルヘッダー」（変更禁止）
2. **発注手順（Codex CLI）** = `implementation-prompts.md` §4（バッチ構造・watchdog・後処理・目視ゲート）
3. 原本 PNG は `assets/` に保存してから commit する

> ⚠️ `implementation-prompts.md` §4-1 のバッチは `timeout` コマンド前提だが、**macOS には GNU coreutils の `timeout` が無い**。
> watchdog は bash（`kill -0` ポーリング）か perl alarm で自前実装すること（2026-07-25 実測）。

---

## ⚠️ 未統合のコード差分（2026-07-25 時点のスナップショット・現況は git log を正とする）

旧 repo の最終 commit `c7631fb`（2026-07-18）に **v6 Phase 2「かけざんのかざん」数学ロジック層**が入っているが、
**本 repo の `index.html` には未統合**。

| | 本 repo（本番） | 旧 repo `sansu-quest.html` |
|---|---|---|
| GA4 計測（`sqTrack`） | ✅ あり | ❌ なし |
| 有効な単元 | わり算 3 種（`mul` は `enabled:false`） | わり算 3 種 + **かけ算 4 種が `enabled:true`**（`mul-basic` / `mul-big` / `mul-tech` / `mul-word`） |
| `makeMultiplication` / `selfTestMul` | ❌ なし | ✅ あり |

v6 は Phase 3（画像）/ Phase 4（ゲーム層）/ Phase 5（検証）が**未実施**の途中成果のため、
本番へ載せるかは佐々木さんの判断待ち。統合するなら「旧 HTML を土台に GA4 パッチ（commit `683dbd1`）を再適用する」方向が安全
（かけ算ロジック 17KB を移植するより差分が小さいため）。
