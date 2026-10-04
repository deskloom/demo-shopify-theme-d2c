# ことはな（KOTOHANA）デモテーマ

架空の国産デイリーケアD2Cブランド「ことはな（KOTOHANA）」（実在しない）の Shopify オンラインストア用デモテーマです。
「Shopifyでブランド公式ECを構築・商品ページを改修できる」ことを示すポートフォリオ用の公開デモです。
Shopify skeleton-theme をベースに作成しています。

## 画面構成

- トップページ（`templates/index.json`）
  - ヒーロー（画像・見出し・CTAボタン）: `sections/kotohana-hero.liquid`
  - 3つのこだわり: `sections/kotohana-features.liquid`
  - おすすめ商品（コレクション指定）: `sections/kotohana-featured-collection.liquid`
  - お客様の声（ブロックで追加可）: `sections/kotohana-testimonials.liquid`
  - FAQ（アコーディオン、ブロックで追加可）: `sections/kotohana-faq.liquid`
  - ニュースレター登録（Shopify標準の `customer` フォーム）: `sections/kotohana-newsletter.liquid`
- 商品ページ（`templates/product.json` + `sections/product.liquid`）
  - バリエーション選択で価格・在庫表示・カートボタンの状態が切り替わる（`assets/product-variants.js`、在庫切れなら「売り切れ」表示でボタン無効・動的決済ボタンを非表示。売り切れの選択肢も選べて「（売り切れ）」付きで表示）
  - 「成分・原材料」「使い方」「配送・返品」の折りたたみタブ（ブロックで追加・並べ替え可）
  - 商品画像ギャラリー（サムネイル切替）
  - 定期便の案内などの自由テキストブロック
- 送料無料バー: ヘッダー下とカートページに「あと¥X で送料無料」を表示（`snippets/free-shipping-bar.liquid` + `assets/free-shipping.js`）。基準額はテーマ設定（`config/settings_schema.json` の `free_shipping_threshold`、数値型・既定 8,000、空や0以下のときは8,000円にフォールバック）で変更可能。初回表示はLiquidの `money` フィルタ、JSでの再描画も同じ円表示に整形
- カートページ（`sections/cart.liquid`）: 数量変更・削除・小計、送料無料バー
- コレクションページ（`sections/collection.liquid`）: 商品グリッド、並び替え（`sort_by`）

## 主な工夫

- Online Store 2.0 形式（JSONテンプレート＋セクション＋ブロック）。追加した全セクションに `{% schema %}` と `presets` を付け、テーマエディタから追加可能
- 多言語: `locales/ja.default.json` を既定、`locales/en.json` を追加。テンプレート内の固定文言はすべて `{{ 'key' | t }}` で出力し、直書きなし。セクションの schema 表示名は `t:` 形式で `ja.default.schema.json` / `en.schema.json` に用意
- レスポンシブ: モバイルファーストの `assets/kotohana.css`（`minmax(0,1fr)`・折り返し）。スマホ幅ではカートを1商品1カードの縦並びに切り替え。開発ストアで 375px / 1280px の表示を確認済み（下記「開発ストアで確認したこと」）
- 画像は外部URLを使わず `placeholder_svg_tag` で代用。ブランド名・商品名はすべて架空
- JSの純粋関数（残額計算・バリエーション状態）を `assets/` に置き、Node の単体テストから `require` して検証

## ディレクトリ構成

```text
assets/           # kotohana.css / free-shipping.js / product-variants.js / critical.css / icon-*.svg 他
blocks/           # group / text
config/           # settings_schema.json（送料無料基準額を追加）/ settings_data.json
layout/           # theme.liquid（kotohana.css を読み込み）/ password.liquid
locales/          # ja.default.json / en.json / ja.default.schema.json / en.schema.json
sample-data/      # products.csv（商品CSVインポート用サンプル）
sections/         # kotohana-* 6件 + product / cart / collection / collections / header / footer / page / password / search / article / blog / 404
snippets/         # free-shipping-bar.liquid / image.liquid / meta-tags.liquid / css-variables.liquid
templates/        # index / product / cart / collection 他（gift_card.liquid を含む）
tests/            # node:test による自動テスト
```

## ローカルでのチェック方法

```bash
npm install
npm test
npx shopify theme check
```

- `npm test`: `node --test` で63件のテストを実行（テンプレート参照・翻訳キー・日本語直書き禁止・英語直書き禁止・schema presets・CSV・残額計算・金額整形・バリエーション切替・決済ボタン表示切替・low_stockキー削除・死んだコード削除・ブロック名一意・range制約・画像フォールバック・index文言・ストアフロント修正の静的検査）
- `npx shopify theme check`: エラー0・警告0を確認済み（48 files inspected with no offenses found）

## テスト

- 全 `templates/*.json` が参照するセクションが `sections/` に実在すること、ブロック型の整合性を確認
- 全 Liquid の `'key' | t` が `ja.default.json` と `en.json` の両方に存在すること、両言語のキー集合が一致することを確認
- sections/snippets/blocks/layout の Liquid（schema・stylesheet・script・title除く）に日本語直書きがないことを確認（templates/*.json の settings 値は日本語既定値として許容）
- 画像フォールバック: `snippets/image.liquid` が `blank` 時に `placeholder_svg_tag` を出すこと、全Liquidの `image_url`/`image_tag` 使用箇所に分岐があること、コレクショングリッドにプレースホルダーがあることを確認
- `templates/index.json` の全ブロックのテキスト設定が空でないこと、features/testimonials/faq の presets に既定文言が入っていることを確認
- schema外のLiquidのHTML地の文に英語直書き（タグ間に英単語2語以上）がないことを確認
- 各セクション・ブロックの schema が正しいJSONで `presets` を持つことを確認。`low_stock_html` が ja/en ともに存在しないこと、`sections/product.liquid` に `window.KotohanaVariants` が残っていないことも確認
- 全 `sections/*.liquid` の schema でブロックの `name` がセクション内で一意であること（`sections/product.liquid` の重複を `t:blocks.*` に分離して解消）を確認
- 全 schema（sections/blocks/config/settings_schema.json）の `type: "range"` 設定が `max < 10000`・`min < max`・`(max-min)/step <= 101`・`default` が範囲内で step に乗っていること、`free_shipping_threshold` が range 型でないこと（数値型に変更）を確認
- `products.csv` の必須ヘッダー（`Variant Inventory Tracker` を含む）・6商品以上・バリエーション付き商品・在庫0バリエーション・全行 `Variant Inventory Tracker=shopify` を確認
- 送料無料バーの残額計算（基準額未満／ちょうど／超過）と金額整形（`buildFreeShippingMessage('あと __AMOUNT__ で送料無料', 300000)` → `'あと ¥3,000 で送料無料'`）、バリエーション切替JS（在庫切れでボタン無効・価格切替・決済ボタン非表示）を確認
- 破壊テスト確認: `locales/en.json` から `cart.free_achieved` を1キー削除すると `locales` テストが失敗する（missing locale keys）ことを実際に確認し、確認後に元に戻した。英語直書きの探知も、わざと `snippets/__probe.liquid` に英文を入れて失敗することを確認後に削除した

## 開発ストアでの確認方法

```bash
shopify theme dev --store <ストア名>
```

1. ストアの通貨をJPY、既定言語を日本語にする
2. 管理画面の「商品管理」から `sample-data/products.csv` を商品インポート（CSVを取り込む）。取り込みで在庫数が反映されない場合は、売り切れを確認したいバリエーション（例: Lotion 200mL）を管理画面で「在庫を追跡する」オン・数量0にする
3. コレクションを作成し、おすすめ商品を集める（トップの「おすすめ商品」セクションで指定。未指定時は `collections.all` の最大4件、それも0件ならプレースホルダー4枚を表示）
4. テーマエディタでトップページ各セクション・商品ページブロック・送料無料基準額（既定8,000）を確認

## 開発ストアで確認したこと

Shopify の開発ストア（通貨JPY・既定言語 日本語）にテーマを非公開でアップロードし、サンプル商品を取り込んで確認しました。

- アップロード時のエラーなし（`theme check` では出ずアップロードで初めて出たエラー〔ブロック名の重複・range設定の上限〕は修正し、同じ種類をテストで検出するようにした）
- トップ・商品・コレクション・カートの4画面で、375px / 1280px とも横スクロールなし（`scrollWidth === clientWidth` を計測）
- 送料無料バー: カートに ¥3,850 の商品を入れると「あと ¥4,150 で送料無料」（Liquid の初回表示と JS の再描画で同じ表示）
- 在庫0のバリエーション（Lotion 200mL）を選ぶと、価格 ¥4,950・「売り切れ」表示・カートボタン無効・動的決済ボタン非表示に切り替わる
- 画像の無い商品をカートに入れてもエラーにならず、プレースホルダーを表示

## 画面写真

| トップ（PC） | トップ（スマホ） |
|---|---|
| ![](docs/screenshots/home-pc.png) | ![](docs/screenshots/home-sp.png) |

| 商品ページ（PC） | 商品ページ（スマホ） | 売り切れ選択時（スマホ） |
|---|---|---|
| ![](docs/screenshots/product-pc.png) | ![](docs/screenshots/product-sp.png) | ![](docs/screenshots/product-soldout-sp.png) |

| コレクション（スマホ） | カート（スマホ） |
|---|---|
| ![](docs/screenshots/collection-sp.png) | ![](docs/screenshots/cart-sp.png) |

> 注: カート（スマホ）の写真は修正前（送料無料バーが2本表示されていた時点）の画面です。現在のコードではヘッダー側のバーをカートページで出さないようにしており、実ストアでの撮り直しはまだ行っていません。

## ベーステーマの出典とライセンス

- ベース: [Shopify skeleton-theme](https://github.com/Shopify/skeleton-theme)（`LICENSE.md` は原文のまま残しています）
- ライセンス: Shopify skeleton-theme のライセンス（MIT形式で、Shopify と連携するテーマの開発に限って利用可能という条件付き。`LICENSE.md` を参照）

## できていないこと

- 実決済・配送業者連携・税設定は開発ストア側の設定が必要で、このテーマには含みません
- 商品画像はプレースホルダー表示のみで、実画像は含みません（画面写真のバッグ等のイラストは Shopify 標準のプレースホルダー）
- 商品名は架空であることが分かるよう英語表記＋「(Fictional)」にしています
- 定期便の申込処理自体はダミー案内のみで、サブスクアプリ連携はしていません
