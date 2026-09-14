from datetime import datetime, timedelta, timezone
import src.database as database
from src.models.session import Session as UserSession
from apscheduler.schedulers.background import BackgroundScheduler

def cleanup_expired_sessions():
    db = database.SessionLocal()
    try:
        print(f"Running cleanup at {datetime.now(timezone.utc)}; removing sessions expired before {datetime.now(timezone.utc)}")
        db.query(UserSession).filter(
            UserSession.exp < datetime.now(timezone.utc)
        ).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()

# APScheduler setup
scheduler = BackgroundScheduler()

def start_scheduler():
    scheduler.add_job(cleanup_expired_sessions, 'interval', hours=12, id='session_cleanup', replace_existing=True)
    scheduler.start()
    print("APScheduler started for session cleanup every 12 hours.")
