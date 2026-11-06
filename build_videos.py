#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
pdfs_jp/ 内の資料PDF（情報33号の分割PDF・FIGニュースレター国内適用）から
YouTubeリンクを抽出し、videos.json（動画一覧ページ用）を書き出す。

使い方:
    pip3 install pymupdf
    python3 build_videos.py

資料を追加するとき:
    SOURCES に { ファイル名: (資料名, 種目) } を足す。
    1つのPDFに複数種目が混ざる資料は、種目に None を入れて
    PAGE_APPARATUS / TITLES で動画ごとに指定する。
"""
import fitz  # PyMuPDF
import json
import os

PDF_DIR = "pdfs_jp"
OUT = "videos.json"

# ファイル名 -> (資料名, 種目)。並び順がそのまま一覧の並び順になる（新しい資料を先に）。
SOURCES = {
    "JP_FIG_NL4_2026.pdf": ("FIG NL4", None),
    "JP_Info33_01_kaitei.pdf": ("情報33号", "採点規則修正・追加情報"),
    "JP_Info33_02_FX.pdf": ("情報33号", "ゆか"),
    "JP_Info33_03_PH.pdf": ("情報33号", "あん馬"),
    "JP_Info33_04_SR.pdf": ("情報33号", "つり輪"),
    "JP_Info33_05_VT.pdf": ("情報33号", "跳馬"),
    "JP_Info33_06_PB.pdf": ("情報33号", "平行棒"),
    "JP_Info33_07_HB.pdf": ("情報33号", "鉄棒"),
    "JP_Info33_08_tiebreak.pdf": ("情報33号", "タイ・ブレイク"),
    "JP_Info33_09_naiki.pdf": ("情報33号", "2026年度国内内規"),
    "JP_Info33_10_manner.pdf": ("情報33号", "マナー・モラル"),
}

# 種目が混在する資料の、動画ごとの種目と題名（URL で指定）
TITLES = {
    # FIG ニュースレター No.4（2026年7月）国内適用
    "https://youtu.be/Kzo8i6JeIk8": ("ゆか", "ライン減点（ゆか・跳馬の着地）"),
    "https://youtu.be/SfmJ435SPFA": ("ゆか", "異なるコーナーの移動"),
    "https://youtu.be/HsHIaVpTL0w": ("ゆか", "ジャンプ／リープの要求（とびひねり）"),
    "https://youtu.be/5uFU9r5v8KU": ("つり輪", "ゆっくりと後方伸身逆上がり系の力静止技"),
    "https://youtu.be/GJE5klNF8sU": ("平行棒", "新技：棒端懸垂前振り後方かかえ込み２回宙返り２回ひねり下り"),
    "https://youtu.be/L4uXaM-4pkM": ("平行棒", "新技：棒端前方屈身２回宙返り下り（ガルサ）"),
    "https://youtu.be/a6D1rViKpZY": ("鉄棒", "新技：屈身ゲイロード１回ひねり"),
}


def main():
    videos = []
    for fname, (source, apparatus) in SOURCES.items():
        path = os.path.join(PDF_DIR, fname)
        if not os.path.exists(path):
            print(f"skip (not found): {fname}")
            continue
        doc = fitz.open(path)
        n = 0
        for i in range(len(doc)):
            for link in doc[i].get_links():
                uri = link.get("uri", "")
                if "youtube" not in uri and "youtu.be" not in uri:
                    continue
                app, title = TITLES.get(uri, (apparatus, ""))
                if app is None:
                    print(f"  ! 種目未設定の動画: {fname} p.{i+1} {uri}（TITLES に追加してください）")
                    app = "その他"
                videos.append({
                    "apparatus": app,
                    "source": source,
                    "title": title,
                    "file": f"pdfs_jp/{fname}",
                    "page": i + 1,
                    "url": uri,
                })
                n += 1
        doc.close()
        if n:
            print(f"{fname:28s} {n:2d} videos")

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(videos, f, ensure_ascii=False, indent=1)
    print(f"\n完了: {len(videos)} 本 -> {OUT}")


if __name__ == "__main__":
    main()
