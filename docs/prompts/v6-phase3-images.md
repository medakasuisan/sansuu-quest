# v6 Phase 3 発射プロンプト — かざん画像生成（Codex CLI）

> 2026-07-18 策定。**モンスター12体は発射可能**（ロスター確定済み）。シーン絵10枚は
> Phase 1 bible 正本化後に §3 のテンプレへ K1〜K10 の情景指定を転記して発射する。
> 実行はオーケストレータが scratchpad にスクリプトを置いて `bash gen_images.sh` を background 実行
> （実測: 約43k tokens/枚・1〜3分/枚・稀に28分級ハング→watchdog 480秒で kill→リテイク1周で回収）。

## §1. バッチスクリプト（そのまま保存して使う）

```bash
#!/bin/bash
# gen_images.sh — かざんモンスター12体。生成済みスキップ + watchdog 8分
OUTDIR="${OUTDIR:-$PWD/gen_out}"; mkdir -p "$OUTDIR"
gen_one() {  # $1=出力名 $2=プロンプト本文
  [ -f "$OUTDIR/$1.png" ] && { echo "skip: $1"; return 0; }
  echo "=== gen: $1 $(date +%H:%M:%S)"
  perl -e 'alarm shift; exec @ARGV' 480 \
    codex exec --sandbox workspace-write --skip-git-repo-check -C "$OUTDIR" \
    "$2 出力ファイル名は $1.png としてカレントディレクトリに保存してください。" \
    </dev/null || echo "TIMEOUT/FAIL: $1 (リテイク対象)"
  # ⚠️ macOS には GNU timeout がない → perl alarm で代替(2026-07-18 実測)
  # ⚠️ 出力先が git 外なら --skip-git-repo-check 必須 / background 実行は stdin を </dev/null で閉じる
  sleep 1
}

STYLE="かわいいデフォルメ2頭身のオリジナルモンスターのキャラクターデザイン。パステル調、やわらかい水彩タッチ、白背景、全身、正面向き、大きなキラキラの瞳。子ども向け知育ゲームのキャラクター。正方形の構図、キャラクターを中央に大きく配置。火山・マグマ・あたたかい色(赤・オレンジ・金)を基調にする。"

gen_one 014_kaketchi   "$STYLE このモンスターの設定: 赤いちいさな火トカゲ。しっぽの先の炎が 2つ に分かれている"
gen_one 015_kakeruga   "$STYLE このモンスターの設定: 凛々しい火トカゲ→小竜。しっぽの炎が 4つ に。背中に金のうろこ"
gen_one 016_kakeryu    "$STYLE このモンスターの設定: 堂々とした火の竜。しっぽの炎が 8つ・翼に炎の模様。かざんの王の風格"
gen_one 017_narabin    "$STYLE このモンスターの設定: 小さな岩の子。体にマグマ玉が 2×3 のきれいな並びで光る"
gen_one 018_naragoron  "$STYLE このモンスターの設定: まるっとした岩ゴーレム。マグマ玉が 3×4 の並びに増える"
gen_one 019_naraberuga "$STYLE このモンスターの設定: 大きな岩の王。マグマ玉が 4×5 の並び・肩に小さな火山"
gen_one 020_kaekko     "$STYLE このモンスターの設定: そっくりな双子の火の子。おたがいの場所を入れ替わって遊ぶ"
gen_one 021_kaenbi     "$STYLE このモンスターの設定: 双子の炎が 1つに合体しかけの姿。左右対称の模様"
gen_one 022_kaenperor  "$STYLE このモンスターの設定: 炎のマントの小さな皇帝。左右どちらから見ても同じ姿(シンメトリー)"
gen_one 023_zerobi     "$STYLE このモンスターの設定: 半透明の火の子。体がうっすら消えかけ・ふしぎな微笑み"
gen_one 024_byunbi     "$STYLE このモンスターの設定: 流線型の火の鳥。目にも止まらぬ速さ・残像の尾"
gen_one 025_oyoson     "$STYLE このモンスターの設定: おおよそのことがわかる火の長老。丸メガネ・雲のようなひげ"

echo "=== 完了: $(ls "$OUTDIR"/*.png 2>/dev/null | wc -l)/12"
```

> モンスター設定文は monster-design.md v2 節からの**そのままコピペ**（変更禁止）。
> リテイク = 該当 png を削除して再実行するだけ（skip 構造なので他は再生成されない）。

## §2. 後処理（全png揃い&佐々木さん目視OK後・python3+Pillow）

```python
# postprocess.py — 正方形センタートリム → 512px → WebP(q80)
from PIL import Image; import glob, os
SRC="gen_out"; DST="/Users/sasaki_shin-ichi/Documents/sansu-quest/assets/monsters"
for p in sorted(glob.glob(f"{SRC}/*.png")):
    img=Image.open(p).convert("RGB"); w,h=img.size; s=min(w,h)
    img=img.crop(((w-s)//2,(h-s)//2,(w+s)//2,(h+s)//2)).resize((512,512),Image.LANCZOS)
    name=os.path.basename(p)
    img.save(f"{DST}/{name}", "PNG")                       # 原本(512px)
    img.save(f"{DST}/webp/{name[:-4]}.webp","WEBP",quality=80)
print("done")
```

保存後にオーケストレータが対象ファイル明示で commit（`git add assets/monsters/0{14..25}*` 相当・-A 禁止）。

## §3. シーン絵バッチ（bible 正本化後に充填して発射）

```
子ども向け絵本の1場面のイラスト。パステル調、やわらかい水彩タッチ、横長の構図。
文字は入れない。キャラクターの顔は小さめ・風景主体。
場面: {kazan-story-bible.md §3 の K1〜K10 各行をそのままコピペ}
```

- 出力名 `k01_xxx.png` 〜 `k10_xxx.png`（xxx は bible のシーンID英名）。gen_one 構造・後処理は §1・§2 と同一（保存先 assets/scenes/）
