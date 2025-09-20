#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sqlite3
import json
import random

def generate_multiple_test_data():
    """Generate multiple test data sets with different categories and scenarios"""
    # Connect to database
    conn = sqlite3.connect('backend_tarot.db')
    cursor = conn.cursor()

    # Get all cards data
    cursor.execute('SELECT name, arcana, number FROM card ORDER BY number')
    all_cards = cursor.fetchall()

    # Get different categories of dimensions
    cursor.execute('SELECT DISTINCT category FROM dimension')
    categories = [row[0] for row in cursor.fetchall()]

    test_datasets = []

    # Generate test data for each category
    for category in categories[:3]:  # Limit to first 3 categories
        cursor.execute('''
            SELECT id, name, category, description, aspect, aspect_type
            FROM dimension
            WHERE category = ?
            ORDER BY aspect_type
            LIMIT 3
        ''', (category,))
        category_dims = cursor.fetchall()

        if len(category_dims) >= 3:
            # Select 3 random cards for this reading
            selected_cards = random.sample(all_cards, 3)

            # Generate test data
            test_data = {
                "cards": [],
                "dimensions": [],
                "description": f"关于{category}相关的困惑和疑问",
                "spread_type": "three-card"
            }

            # Add cards with random directions
            directions = ["正位", "逆位"]
            for i, (name, arcana, number) in enumerate(selected_cards, 1):
                test_data["cards"].append({
                    "name": name,
                    "arcana": arcana,
                    "number": number,
                    "direction": random.choice(directions),
                    "position": i
                })

            # Add dimensions
            for dim_id, name, category_name, description, aspect, aspect_type in category_dims:
                test_data["dimensions"].append({
                    "id": dim_id,
                    "name": name,
                    "category": category_name,
                    "description": description
                })

            test_datasets.append(test_data)

    conn.close()
    return test_datasets

def generate_test_data():
    # Connect to database
    conn = sqlite3.connect('backend_tarot.db')
    cursor = conn.cursor()

    # Get all cards data
    cursor.execute('SELECT name, arcana, number FROM card ORDER BY number')
    all_cards = cursor.fetchall()

    # Get dimensions data - try to get a set with aspect_type 1,2,3
    cursor.execute('''
        SELECT id, name, category, description, aspect, aspect_type
        FROM dimension
        WHERE aspect_type IN (1, 2, 3)
        ORDER BY aspect_type
        LIMIT 3
    ''')
    three_card_dims = cursor.fetchall()

    # If no sequential dimensions found, get any 3 dimensions
    if len(three_card_dims) < 3:
        cursor.execute('SELECT id, name, category, description, aspect, aspect_type FROM dimension LIMIT 3')
        three_card_dims = cursor.fetchall()

    conn.close()

    # Select 3 random cards for the reading
    selected_cards = random.sample(all_cards, 3)

    # Generate test data
    test_data = {
        "cards": [],
        "dimensions": [],
        "description": "关于事业发展的困惑",
        "spread_type": "three-card"
    }

    # Add cards with random directions
    directions = ["正位", "逆位"]
    for i, (name, arcana, number) in enumerate(selected_cards, 1):
        test_data["cards"].append({
            "name": name,
            "arcana": arcana,
            "number": number,
            "direction": random.choice(directions),
            "position": i
        })

    # Add dimensions
    for i, (dim_id, name, category, description, aspect, aspect_type) in enumerate(three_card_dims):
        test_data["dimensions"].append({
            "id": dim_id,
            "name": name,
            "category": category,
            "description": description
        })

    return test_data

if __name__ == "__main__":
    # Generate single test data
    print("=== Single Test Data ===")
    test_data = generate_test_data()
    print(json.dumps(test_data, ensure_ascii=False, indent=2))

    print("\n=== Multiple Test Data Sets ===")
    # Generate multiple test data sets
    test_datasets = generate_multiple_test_data()
    for i, dataset in enumerate(test_datasets, 1):
        print(f"\n--- Test Dataset {i} ---")
        print(json.dumps(dataset, ensure_ascii=False, indent=2))