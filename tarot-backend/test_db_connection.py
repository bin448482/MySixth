"""
Test database connection and models
"""
import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal
from app.models import Card, CardStyle, Dimension, CardInterpretation, Spread
from sqlalchemy import text

def test_database_connection():
    """Test database connection and basic operations"""
    try:
        # Test connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
            tables = [row[0] for row in result]
            print(f"Database connected successfully. Tables: {tables}")

        # Test session and models
        db = SessionLocal()
        try:
            # Test querying cards
            cards_count = db.query(Card).count()
            print(f"Total cards in database: {cards_count}")

            # Test querying first few cards
            cards = db.query(Card).limit(5).all()
            print("First 5 cards:")
            for card in cards:
                print(f"  - {card.name} ({card.arcana})")

            # Test dimensions
            dimensions_count = db.query(Dimension).count()
            print(f"Total dimensions in database: {dimensions_count}")

            # Test spreads
            spreads_count = db.query(Spread).count()
            print(f"Total spreads in database: {spreads_count}")

            print("Database models working correctly!")
            return True

        finally:
            db.close()

    except Exception as e:
        print(f"Database connection error: {e}")
        return False

if __name__ == "__main__":
    test_database_connection()