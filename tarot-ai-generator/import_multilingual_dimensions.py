#!/usr/bin/env python3
"""
Import multilingual dimension data into the tarot_config.db SQLite database.

Expected input is the JSON output produced by running:
    python main.py --multilingual-question "..."
"""

from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, Iterable, Tuple


def load_multilingual_payload(path: Path) -> Dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"输出文件不存在: {path}")

    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)

    if "dimensions" not in data:
        raise ValueError("JSON 中缺少 `dimensions` 字段，无法解析。")
    if "root_dimension_locale" not in data:
        raise ValueError("JSON 中缺少 `root_dimension_locale` 字段，无法解析。")

    return data


def upsert_dimension(
    cursor: sqlite3.Cursor,
    *,
    name: str,
    category: str,
    description: str,
    aspect: str | None,
    aspect_type: int | None,
) -> Tuple[int, bool, bool]:
    cursor.execute(
        "SELECT id, category, description, aspect, aspect_type "
        "FROM dimension WHERE name = ?",
        (name,),
    )
    existing = cursor.fetchone()

    if existing:
        dimension_id = existing[0]
        changed = not (
            existing[1] == category
            and existing[2] == description
            and existing[3] == aspect
            and existing[4] == aspect_type
        )
        if not changed:
            return dimension_id, False, False

        cursor.execute(
            """
            UPDATE dimension
            SET category = ?, description = ?, aspect = ?, aspect_type = ?
            WHERE id = ?
            """,
            (category, description, aspect, aspect_type, dimension_id),
        )
        return dimension_id, False, True

    cursor.execute(
        """
        INSERT INTO dimension (name, category, description, aspect, aspect_type)
        VALUES (?, ?, ?, ?, ?)
        """,
        (name, category, description, aspect, aspect_type),
    )
    return cursor.lastrowid, True, True


def upsert_dimension_translation(
    cursor: sqlite3.Cursor,
    *,
    dimension_id: int,
    locale: str,
    name: str,
    description: str,
    aspect: str | None,
    category: str | None,
) -> bool:
    cursor.execute(
        """
        INSERT INTO dimension_translation (dimension_id, locale, name, description, aspect, category)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(dimension_id, locale)
        DO UPDATE SET
            name = excluded.name,
            description = excluded.description,
            aspect = excluded.aspect,
            category = excluded.category
        """,
        (dimension_id, locale, name, description, aspect, category),
    )
    return cursor.rowcount == 1


def iter_localizations(record: Dict[str, Any]) -> Iterable[Dict[str, Any]]:
    localizations = record.get("localizations", [])
    if not isinstance(localizations, list):
        raise ValueError("`localizations` 字段不是列表。")
    for entry in localizations:
        if not isinstance(entry, dict):
            raise ValueError("`localizations` 条目必须是对象。")
        yield entry


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="将 multilingual_dimensions.json 导入 SQLite 数据库的 dimension 与 dimension_translation 表。"
    )
    parser.add_argument(
        "--json",
        default="output/multilingual_dimensions.json",
        help="多语言输出 JSON 路径（默认: output/multilingual_dimensions.json）",
    )
    parser.add_argument(
        "--db",
        default="data/tarot_config.db",
        help="SQLite 数据库路径（默认: data/tarot_config.db）",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="仅打印导入动作，不写入数据库。",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    payload = load_multilingual_payload(Path(args.json))
    root_locale = payload["root_dimension_locale"]
    dimensions = payload.get("dimensions", [])

    if not dimensions:
        print("没有可导入的维度记录。")
        return

    conn = sqlite3.connect(args.db)
    cursor = conn.cursor()

    inserted_dimensions = 0
    updated_dimensions = 0
    upserted_translations = 0

    try:
        for idx, record in enumerate(dimensions, start=1):
            localizations = list(iter_localizations(record))

            root_entry = next((loc for loc in localizations if loc.get("locale") == root_locale), None)
            if not root_entry:
                raise ValueError(f"第 {idx} 条记录缺少根语言 {root_locale} 的本地化数据。")

            category = root_entry.get("category") or record.get("dimension_key", {}).get("category")
            aspect = root_entry.get("aspect") or record.get("dimension_key", {}).get("aspect")
            aspect_type_raw = root_entry.get("aspect_type") or record.get("dimension_key", {}).get("aspect_type")
            aspect_type = int(aspect_type_raw) if aspect_type_raw not in (None, "") else None

            name = root_entry.get("name")
            description = root_entry.get("description") or ""

            if not name:
                raise ValueError(f"第 {idx} 条记录的根语言名称为空。")

            dim_id, created, changed = upsert_dimension(
                cursor,
                name=name,
                category=category or "",
                description=description,
                aspect=aspect,
                aspect_type=aspect_type,
            )

            if created:
                inserted_dimensions += 1
            elif changed:
                updated_dimensions += 1

            for entry in localizations:
                locale = entry.get("locale")
                if locale == root_locale:
                    continue

                translation_written = upsert_dimension_translation(
                    cursor,
                    dimension_id=dim_id,
                    locale=locale,
                    name=entry.get("name", ""),
                    description=entry.get("description", ""),
                    aspect=entry.get("aspect"),
                    category=entry.get("category"),
                )

                if translation_written:
                    upserted_translations += 1

        if args.dry_run:
            conn.rollback()
            print("Dry run 完成，未对数据库进行修改。")
        else:
            conn.commit()

    finally:
        conn.close()

    print(f"维度新增: {inserted_dimensions}")
    print(f"维度更新: {updated_dimensions}")
    print(f"翻译写入/更新: {upserted_translations}")
    print("提示: JSON 中的 `summary` 字段当前未写入数据库，如需保留请扩展 schema 或额外处理。")


if __name__ == "__main__":
    main()
