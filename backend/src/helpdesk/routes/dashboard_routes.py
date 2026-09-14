from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.database import get_db
from src.helpdesk.models.ticket import HelpdeskTicket

router = APIRouter(prefix="/helpdesk", tags=["Helpdesk Dashboard"])

@router.get("/dashboard")
def dashboard_counts(db: Session = Depends(get_db)):
    rows = (
        db.query(HelpdeskTicket.status, func.count(HelpdeskTicket.ticket_id))
        .group_by(HelpdeskTicket.status)
        .all()
    )

    result = {"Open": 0, "In Progress": 0, "Resolved": 0}
    for status, count in rows:
        result[status] = count

    return result
