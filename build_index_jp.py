#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
pdfs/ 内のすべてのPDFを読み、本文をページ単位で index.json に書き出す。
分割版（種目ごとに独立PDF）・1ファイル版のどちらでもそのまま動く。

使い方:
    pip3 install pymupdf
    python3 build_index.py
"""
import fitz  # PyMuPDF
import json
import os

PDF_DIR = "pdfs_jp"
OUT = "index_jp.json"

# index.json の並び順（任意）。ここに無いファイルは名前順で末尾に追加される。
ORDER = [
    "JP_U12_rules_2025.pdf",
    "JP_U12_VT_values_2025.pdf",
    "JP_U15_rules_2025.pdf",
    "JP_U15_VT_values_2025.pdf",
    "JP_HS_rules_2026.pdf",
    "JP_Masters_rules_2025.pdf",
    "JP_Info33_01_kaitei.pdf",
    "JP_Info33_02_FX.pdf",
    "JP_Info33_03_PH.pdf",
    "JP_Info33_04_SR.pdf",
    "JP_Info33_05_VT.pdf",
    "JP_Info33_06_PB.pdf",
    "JP_Info33_07_HB.pdf",
    "JP_Info33_08_tiebreak.pdf",
    "JP_Info33_09_naiki.pdf",
    "JP_Info33_10_manner.pdf",
    "JP_Kitei2022_00_general.pdf",
    "JP_Kitei2022_FX.pdf",
    "JP_Kitei2022_PH.pdf",
    "JP_Kitei2022_SR.pdf",
    "JP_Kitei2022_VT.pdf",
    "JP_Kitei2022_PB.pdf",
    "JP_Kitei2022_HB.pdf",
]


def sort_key(name):
    return (ORDER.index(name) if name in ORDER else len(ORDER), name)


def main():
    files = [f for f in os.listdir(PDF_DIR) if f.lower().endswith(".pdf")]
    files.sort(key=sort_key)

    index = []
    for fname in files:
        path = os.path.join(PDF_DIR, fname)
        doc = fitz.open(path)
        added = 0
        for i, page in enumerate(doc):
            text = " ".join(page.get_text("text").split())
            if not text:
                continue
            index.append({
                "file": f"pdfs_jp/{fname}",  # HTMLから見た相対パス
                "page": i + 1,            # 各ファイル内のページ番号（#page= がこれで飛ぶ）
                "text": text,
            })
            added += 1
        doc.close()
        print(f"{fname:18s} {added:3d} pages")

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False)

    size_kb = os.path.getsize(OUT) / 1024
    print(f"\n完了: {len(index)} ページ / {len(files)} ファイル -> {OUT} ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
