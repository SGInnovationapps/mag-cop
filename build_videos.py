#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
pdfs_jp/ 内の情報33号分割PDFからYouTubeリンクを抽出し、
videos_info33.json（動画一覧ページ用）を書き出す。

使い方:
    pip3 install pymupdf
    python3 build_videos.py
"""
import fitz  # PyMuPDF
import json
import os

PDF_DIR = "pdfs_jp"
OUT = "videos_info33.json"

# ファイル名 -> 表示名（動画一覧の見出し）。ここに無いファイルはスキップ。
LABEL = {
    "JP_Info33_01_kaitei.pdf": "採点規則修正・追加情報",
    "JP_Info33_02_FX.pdf": "ゆか",
    "JP_Info33_03_PH.pdf": "あん馬",
    "JP_Info33_04_SR.pdf": "つり輪",
    "JP_Info33_05_VT.pdf": "跳馬",
    "JP_Info33_06_PB.pdf": "平行棒",
    "JP_Info33_07_HB.pdf": "鉄棒",
    "JP_Info33_08_tiebreak.pdf": "タイ・ブレイク",
    "JP_Info33_09_naiki.pdf": "2026年度国内内規",
    "JP_Info33_10_manner.pdf": "マナー・モラル",
}


def main():
    videos = []
    for fname in sorted(LABEL):
        path = os.path.join(PDF_DIR, fname)
        if not os.path.exists(path):
            print(f"skip (not found): {fname}")
            continue
        doc = fitz.open(path)
        n = 0
        for i in range(len(doc)):
            for link in doc[i].get_links():
                uri = link.get("uri", "")
                if "youtube" in uri or "youtu.be" in uri:
                    videos.append({
                        "apparatus": LABEL[fname],
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
