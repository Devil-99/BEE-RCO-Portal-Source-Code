from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from src.database import get_db
from src.helpdesk.models.ticket import HelpdeskTicket
from src.helpdesk.models.comment import HelpdeskComment
from src.helpdesk.models.attachment import HelpdeskAttachment
from src.helpdesk.schemas.ticket import TicketCreateSchema
from src.helpdesk.services.file_service import save_attachment

import logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/helpdesk", tags=["Helpdesk"])

# CREATE TICKET
@router.post("/tickets")
def create_ticket(payload: TicketCreateSchema, db: Session = Depends(get_db)):
    ticket = HelpdeskTicket(
        user_id=payload.user_id,   # ✅ from frontend now
        category=payload.category,
        subcategory=payload.subcategory,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    logger.info("[CREATE_TICKET] Ticket created successfully")
    return ticket


# LIST MY TICKETS
@router.get("/tickets")
def my_tickets(db: Session = Depends(get_db)):
    return db.query(HelpdeskTicket).order_by(HelpdeskTicket.created_at.desc()).all()


# RESOLVE TICKET
@router.post("/tickets/{ticket_id}/resolve")
def resolve_ticket(
    ticket_id: str,
    resolution_comment: str = Form(...),   # ✅ FIX
    file: UploadFile | None = File(None),  # ✅ FIX
    db: Session = Depends(get_db)
):
    logger.info("[RESOLVE_TICKET] Request received")
    ticket = db.query(HelpdeskTicket).filter_by(ticket_id=ticket_id).first()

    if not ticket:
        logger.warning("[RESOLVE_TICKET] Ticket not found")
        raise HTTPException(404, "Ticket not found")

    if ticket.status.lower() in ["closed", "resolved", "completed"]:
        logger.warning("[RESOLVE_TICKET] Ticket already closed")
        raise HTTPException(400, "Ticket already closed")

    ticket.status = "Resolved"

    db.add(
        HelpdeskComment(
            ticket_id=ticket.ticket_id,
            entered_by=payload.user_id,
            comment_text=resolution_comment
        )
    )

    if file:
        path = save_attachment(file)
        db.add(
            HelpdeskAttachment(
                ticket_id=ticket.ticket_id,
                file_name=file.filename,
                file_path=path,
                file_type=file.content_type,
                uploaded_by=payload.user_id
            )
        )

    db.commit()
    logger.info("[RESOLVE_TICKET] Ticket resolved successfully")
    return {"message": "Ticket resolved successfully"}
