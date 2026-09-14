from src.models.base import Base

def create_table(engine):
    """Create all tables. Requires engine object."""
    if engine is None:
        raise RuntimeError("Engine is None. Call init_db() first.")
    Base.metadata.create_all(bind=engine)
    print("Tables created:", Base.metadata.tables.keys())