# CLAUDE.md

このファイルは、Claude Code がこのリポジトリで作業する際のガイドです。

## 概要

有限会社スローライフ向けの不動産仲介CRM。Googleスプレッドシートをデータベースとして使い、フロントエンドはGitHub Pages（静的サイト）、バックエンドはGoogle Apps Script（GAS）のWeb Appという構成。詳しいアーキテクチャ・データモデルは [README.md](README.md) を参照（ただし機能追加が早いため、README記載と実装が食い違っている場合は実装側を正とすること。特に認証方式・シート構成は変化が大きいので `gas/Code.js` を直接確認するのが確実）。

公開URL: https://taisukeando.github.io/slowlife-crm-app/

## ファイル構成

```
gas/Code.js       バックエンドの全ロジック（このファイルだけ）
gas/appsscript.json
docs/index.html   画面構造（サイドバー・各セクション・ログインオーバーレイ）
docs/style.css
docs/app.js       画面ロジック（state管理・一覧描画・モーダル・並び替え）
docs/api.js       GAS Web Appへの fetch ラッパー（idTokenを毎回付与）
docs/auth.js      Googleログイン（Identity Services）
docs/config.js    API_BASE と GOOGLE_CLIENT_ID
```

## 変更を反映する手順

**フロントエンド（`docs/`）を変更した場合**: 編集して commit & push するだけ。GitHub Pagesが自動で再配信する。

**バックエンド（`gas/Code.js`）を変更した場合**: 保存だけでは反映されない。必ず以下を実行する。

```bash
npx clasp push --force
npx clasp deploy --deploymentId AKfycbxtM_Vve-rWW1d3bylW3kL9hrgpyW9CSUPS4_j0h1MxZI6wT8fIDGJlo9Va1voZLO1NoA --description "変更内容のメモ"
```

`--deploymentId` を省略すると新しいデプロイ（別URL）が作られてしまい、フロントエンドが古いバックエンドを向いたままになる。**既存のデプロイIDを必ず指定すること。**

`gas/Code.js` が新しいGoogleサービス（例: `UrlFetchApp`, `DocumentApp` を初めて使うようになった等）を呼ぶようになった場合、push しただけでは権限不足エラーになる。スクリプトエディタ（`npx clasp open-script`）を開き、関数選択プルダウンから `manualAuthorizeAll` を実行して認可ダイアログを一度通す必要がある（ユーザーに手動operationを依頼すること。これはClaude Codeからは実行できない）。

## データと認証

- スプレッドシートID・テンプレートDocID・OAuthクライアントIDはすべて `gas/Code.js` の先頭に定数で書かれている。
- **アクセス制御はGoogleログイン方式。** 静的トークンは廃止済み。フロントエンドはGoogle Identity Servicesでログインし、取得したIDトークンを毎回のAPI呼び出しに付与する（`docs/api.js` の `CURRENT_ID_TOKEN`）。GAS側は `authorize_()` でGoogleの`tokeninfo`エンドポイントに照会し、スプレッドシートの **`Authシート`**（メールアドレス・権限・有効の3列）にあるアカウントだけを許可する。新しい利用者を追加する場合はこのシートに1行追加するだけでよく、コード変更は不要。
- スプレッドシートのシート構成（2026年6月時点）: `ダッシュボード`（集計用、関数で自動計算）/ `連絡先マスタ` / `物件マスタ` / `イベントログ`（取引ステータスの実データ） / `履歴ログ`（物件・顧客・取引の登録/更新/削除をすべて記録、`日時・種別・内容`の3列） / `設定・マスタ`（Webアプリは読まない。スプレッドシートを直接編集する人向けのプルダウン用） / `Authシート`。
- 「取引」は独立したシートではなく、`イベントログ` を「物件名×買主氏名」でグルーピングして動的に算出している（`listTransactions_()`）。物件の「現在ステータス」も `イベントログ` の最新行から導出される（手入力ではない）。

## 列位置に依存するコードへの注意

`物件マスタ` への `appendRow` と、それに続く `sheet.getRange(lastRow, 列番号)` での数式設定（売主メール・売主電話・現在ステータス）は、**ヘッダー名ではなく列の位置（何列目か）に依存している。** `物件マスタ` の列を追加・削除・並び替えする場合は、`createProperty_()` 内の `appendRow` の配列順と、直後の `getRange(lastRow, 6/7/11)` の列番号を必ず一緒に更新すること（更新を忘れると数式が別の列に入ってデータが壊れる）。

一方、`updateRowsByKey_()` や `findRowByKey_()` などの更新・検索系はヘッダー名で列を探すため、列の位置変更に影響されない。

## 書類自動発行

テンプレート（Googleドキュメント）は Drive の `不動産CRM/01_テンプレート/` にあり、IDは `gas/Code.js` の `TEMPLATE_DOC_IDS` にハードコードされている。テンプレートの文面はDrive上のドキュメントを直接編集すればよく、コード変更は不要。プレースホルダーは `{{物件名}}` のような記法。`body.replaceText()` は第一引数を正規表現として解釈するため、新しいプレースホルダーを追加する際も `escapeRegex_()` を経由させること（過去に `{{ }}` をエスケープし忘れて置換が効かない不具合があった）。

## 既知の制約

- GASのコールドスタート（1〜3秒程度）は構造上の制約。
- NotebookLMとの連携（`04_AI参照用` フォルダ）は手動運用。外部から自動でノートブックを作成・更新する公式APIが現時点の個人/Workspace通常プランには無いため。
- 担当者は「加瀬」固定（複数担当者の管理は未実装）。
