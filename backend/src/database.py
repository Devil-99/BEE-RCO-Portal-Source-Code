from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import make_url
from src.settings import settings

SessionLocal = None
engine = None

def init_db():
    """Initialize database connection. Call this after settings are loaded."""
    global engine, SessionLocal
    
    if not settings.database_url:
        raise RuntimeError(
            "DATABASE_URL is empty. Ensure your .env is present and loaded or set DATABASE_URL in the environment. "
            f"Expected .env at: {Path(__file__).resolve().parents[1] / '.env'}. Current CWD: {Path.cwd()}"
        )

    print("DATABASE_URL repr:", repr(settings.database_url))
    try:
        url_obj = make_url(settings.database_url)
    except Exception as e:
        raise RuntimeError(f"Failed to parse DATABASE_URL: {e}\nValue repr: {repr(settings.database_url)}") from e

    try:
        engine = create_engine(
            settings.database_url,
            pool_size=10,
            max_overflow=20,
            pool_timeout=5,
            pool_recycle=1800,
            pool_pre_ping=True
        )

        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        print("Database initialized successfully")
    except Exception as e:
        raise RuntimeError(f"Failed to create SQLAlchemy engine from DATABASE_URL: {e}") from e
    
def get_db():
    """Dependency generator for FastAPI routes. Call after init_db() ran in startup."""
    if SessionLocal is None:
        raise RuntimeError("SessionLocal is not initialized. Ensure database.init_db() is called in app startup.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()