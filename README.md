# MAG CoP 採点規則検索

体操競技男子（MAG）採点規則の横断検索アプリ。

## ページ
- `index.html` — ルート（`saiten-search.html` へリダイレクト）
- `saiten-search.html` — 検索（国際／国内／両方タブ）
- `pdf-list.html` — PDF一覧（国際 + 国内）
- `videos.html` — 情報33号の動画一覧（YouTube 27本）

## データ
- `index.json` — 国際ルール（FIG CoP 2025）全ページのテキスト
- `index_jp.json` — 国内ルール全ページのテキスト
- `videos_info33.json` — 情報33号内のYouTubeリンク一覧

## PDF
- `pdfs/` — 国際ルール 8ファイル（種目 + 一般 + 補足）
- `pdfs_jp/` — 国内ルール 16ファイル（適用規則各種 + 情報33号 10章）

## PWA
- `manifest.json` / `sw.js` / `pwa.js` / `icons/`
- 初回訪問時のみホーム画面追加ポップアップを表示
- 検索ページ・PDF一覧・動画一覧はオフラインでも起動

## 更新手順（PDF差し替え時）
```
pip3 install pymupdf pypdf
# 国際ルールを差し替えた場合
python3 build_index.py
# 国内ルールを差し替えた場合
python3 build_index_jp.py
# 情報33号を差し替えた場合（YouTubeリンクの再抽出）
python3 build_videos.py
```
再生成後は `git add . && git commit -m "..." && git push` でデプロイ。

## Service Worker のキャッシュ更新
HTML/JS/CSSを更新したときは、`sw.js` の `CACHE_VERSION` の値を上げる
（例：`mag-cop-v1` → `mag-cop-v2`）と、旧キャッシュが自動破棄される。

## ローカル確認
```
python3 -m http.server 8000
```
ブラウザで `http://localhost:8000/` を開く。
`file://` 直開きは fetch が CORS で失敗するため不可。
