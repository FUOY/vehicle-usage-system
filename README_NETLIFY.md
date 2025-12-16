# 🚗 社用車利用履歴管理システム v9.0

**Netlify + Google Sheets統合版**

---

## 📋 プロジェクト概要

営業部向けの社用車利用履歴を管理するWebアプリケーションです。**Netlify**でホスティングし、**Google Sheets**をデータベースとして使用します。

### ✅ チーム利用可能な機能

1. **リアルタイムデータ共有** - 全員が最新データを確認
2. **前回走行距離の自動反映** - 車番選択時に前回の帰着時走行距離を表示
3. **月末集計** - Google SheetsまたはExcel出力で簡単集計
4. **完全無料** - Netlify、GitHub、Google Sheets すべて無料

---

## 🎯 主な機能

### ✅ 実装済み機能

1. **車番ごとの管理** (2405, 2406, 2407, 2408)
2. **利用履歴の登録** - 出発時情報と帰着情報
3. **給油レシート画像アップロード** (自動圧縮: 最大500KB)
4. **履歴の表示・フィルター** (月・車番・担当者)
5. **編集・削除機能**
6. **Excel出力**
7. **スマートフォン対応** (iPhone Safari完全対応)

---

## 🔧 技術構成

### フロントエンド
- **HTML5** - セマンティックマークアップ
- **CSS3** - レスポンシブデザイン
- **JavaScript (ES6+)** - 非同期処理、画像圧縮

### バックエンド
- **Google Sheets** - データベース
- **Google Apps Script** - RESTful API

### ホスティング
- **Netlify** - 静的サイトホスティング（無料）

### ライブラリ
- **SheetJS (xlsx.js)** - Excel出力機能

---

## 🚀 デプロイ方法

### 📖 詳細ガイド

- **完全版**: [NETLIFY_DEPLOYMENT_GUIDE.md](NETLIFY_DEPLOYMENT_GUIDE.md)
- **クイックスタート**: [QUICK_START_NETLIFY.md](QUICK_START_NETLIFY.md)

### ⚡ 簡易手順

1. **Google Sheetsをセットアップ** (5分)
2. **GitHubにアップロード** (3分)
3. **Netlifyにデプロイ** (3分)
4. **API URLを設定** (4分)

**合計: 約15〜20分**

---

## 📂 ファイル構成

```
project/
├── index.html                      # メインHTML (v9.0)
├── css/
│   └── style.css                   # スタイルシート
├── js/
│   └── main.js                     # メインJavaScript (Google Sheets統合)
├── README_NETLIFY.md              # このファイル
├── NETLIFY_DEPLOYMENT_GUIDE.md    # デプロイ完全ガイド
└── QUICK_START_NETLIFY.md         # クイックスタート
```

---

## 📊 データモデル

### Google Sheets: vehicle_usage

| フィールド名 | 型 | 説明 | 必須 |
|-------------|-----|------|------|
| id | text | レコードID (UUID) | ✅ |
| usage_date | text | 使用日 (YYYY-MM-DD) | ✅ |
| vehicle_number | text | 車番 (2405〜2408) | ✅ |
| staff_name | text | 担当者名 | ✅ |
| departure_time | text | 出発時刻 (HH:MM) | ✅ |
| departure_mileage | number | 出発時走行距離 (km) | ✅ |
| destination | text | 目的地・客先 | ✅ |
| arrival_time | text | 帰着時刻 (HH:MM) | ❌ |
| arrival_mileage | number | 帰着時走行距離 (km) | ❌ |
| fuel_amount | number | 給油量 (リットル) | ❌ |
| receipt_image | text | レシート画像 (Base64) | ❌ |

---

## 🔄 バージョン履歴

### v9.0 (最新) - Netlify + Google Sheets統合版
- ✅ **Netlifyホスティング**: CORS問題完全解決
- ✅ **チーム利用可能**: リアルタイムデータ共有
- ✅ **前回走行距離自動反映**: 車番選択時に表示
- ✅ **月末集計対応**: Google Sheets直接確認またはExcel出力
- ✅ **完全無料**: すべてのサービスが無料

### v8.0 - ローカルストレージ版（廃止）
- ⚠️ **チーム共有不可**: 各端末独立
- デモ・個人用途のみ

### v7.0 - Genspark Table API版（廃止）
- ⚠️ **404エラー**: Table APIが利用不可
- Gensparkの制限により動作せず

### v6.0 - Google Sheets統合版（廃止）
- ⚠️ **CORSエラー**: Gensparkでは動作しない

---

## 👥 チーム共有方法

### 公開URLを共有

1. Netlifyでデプロイ
2. 公開URL（`https://your-site.netlify.app/`）をチームに共有
3. 全員が同じURLにアクセス
4. **リアルタイムでデータ共有**

### Google Sheetsでデータ確認

1. Google Sheets `vehicle_usage` を開く
2. 登録されたデータがリアルタイムで表示
3. **月末にそのまま集計可能**

---

## 📖 使用方法

### 基本的な使い方

1. 公開URLにアクセス
2. **車番タブ**（2405, 2406, 2407, 2408）をクリック
3. **前回の走行距離**が自動表示される
4. データを入力して「**登録**」をクリック
5. 履歴テーブルで確認

### 前回走行距離の自動反映

- 車番タブをクリックすると、その車番の**最新の帰着時走行距離**が自動表示
- 出発時走行距離に手動コピー可能
- **チーム全員のデータから最新を取得**

### 月末集計

#### 方法1: Google Sheetsで集計
1. Google Sheets `vehicle_usage` を開く
2. フィルター・並び替えで月ごとに表示
3. SUM関数などで集計

#### 方法2: Excel出力
1. アプリで月フィルターを選択
2. 「**Excel出力**」ボタンをクリック
3. ダウンロードしたExcelファイルで集計

---

## 🛠️ トラブルシューティング

### ❌ 「登録が完了しました」が表示されない

**原因**: Google Apps Script URLが未設定または間違っている

**対処**:
1. `js/main.js` の6行目を確認
2. Google Apps ScriptのWeb アプリURLを設定
3. GitHubにコミット → Netlifyが自動再デプロイ

### ❌ Google Sheetsにデータが保存されない

**原因**: Google Apps Scriptのデプロイ設定

**対処**:
1. Apps Script → **デプロイ** → **デプロイを管理**
2. **アクセスできるユーザー: 全員** を確認
3. 再デプロイ

### ❌ 前回走行距離が表示されない

**原因**: データがまだ登録されていない、またはAPI通信エラー

**対処**:
1. ブラウザのコンソール（F12）でエラー確認
2. Google Sheetsにデータが存在するか確認

---

## 📝 補足情報

### データ容量
- **Google Sheets**: 無料版で最大500万セル
- **Netlify**: 月100GB転送まで無料

### 同時利用
- 複数ユーザーが同時に登録・編集可能
- リアルタイムで反映

### ブラウザ対応
- Chrome, Safari, Edge, Firefox（最新版推奨）
- スマートフォン対応（iPhone Safari完全対応）

---

## 👤 開発者情報

- **プロジェクト名**: 社用車利用履歴管理システム
- **バージョン**: v9.0 - Netlify + Google Sheets統合版
- **最終更新日**: 2025-12-16

---

## 🔗 関連ドキュメント

- [Netlifyデプロイ完全ガイド](NETLIFY_DEPLOYMENT_GUIDE.md) - **必読**
- [クイックスタートガイド](QUICK_START_NETLIFY.md) - **簡易版**

---

## 🎉 完成！

**Netlify + Google Sheets版で、チーム全員がリアルタイムでデータ共有できます！**

- ✅ 前回走行距離の自動反映
- ✅ 月末集計が簡単
- ✅ 完全無料

---

**Copyright © 2026 社用車利用履歴管理システム**
