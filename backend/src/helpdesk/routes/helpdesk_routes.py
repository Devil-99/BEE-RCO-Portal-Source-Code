from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, case, select, exists

from src.database import get_db
from src.helpdesk.models.helpdesk import (
    HelpdeskTicket,
    HelpdeskComment,
    HelpdeskAttachment,
    HelpdeskCategory,
    HelpdeskSubCategory
)
from src.models import User
from src.helpdesk.schemas.ticket import TicketCreateSchema, TicketResponseSchema, RecentTicketResponseSchema
from src.services.storage_service import StorageService, get_storage
from src.utils.security import verify_user_access
from src.utils.validation import validate_file
import logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/helpdesk", tags=["Helpdesk"])


# ============================
# CREATE TICKET
# ============================
@router.post("/tickets")
def create_ticket(payload: TicketCreateSchema, db: Session = Depends(get_db)):
    existing_user = db.scalar(
        select(exists().where(User.username == payload.user_id))
    )

    if not existing_user:
        raise HTTPException(
                status_code=404,
                detail="Username does not exist. Please use a valid Username"
            )

    ticket = HelpdeskTicket(
        user_id=payload.user_id,
        category=payload.category,
        subcategory=payload.subcategory,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return ticket


# ============================
# LIST TICKETS
# ============================
@router.get("/tickets", response_model=list[TicketResponseSchema])
def list_tickets(
    request: Request,
    db: Session = Depends(get_db)
):
    entity_id = request.state.entity_id
    user_id = request.state.user_id
    role_code = request.state.role_code

    if not entity_id or not user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You are not authorized to access this data."
        )

    user_details = db.query(User).filter(User.id == user_id).first()
    if not user_details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    username = user_details.username
    query = db.query(
        HelpdeskTicket.user_id,
        HelpdeskTicket.ticket_id,
        HelpdeskTicket.title,
        HelpdeskTicket.description,
        HelpdeskTicket.priority,
        HelpdeskTicket.status,
        HelpdeskTicket.assigned_to,
        HelpdeskTicket.created_at,
        HelpdeskTicket.updated_at,
        HelpdeskTicket.closed_at,              
        HelpdeskCategory.name.label("category"),
        HelpdeskSubCategory.name.label("subcategory")
    ).join(
        HelpdeskCategory, HelpdeskTicket.category == HelpdeskCategory.id
    ).join(
        HelpdeskSubCategory, HelpdeskTicket.subcategory == HelpdeskSubCategory.id
    )

    if role_code == "ADM":
        result = query.order_by(
            HelpdeskTicket.created_at.desc()
        ).all()
    else:
        result = query.filter(
            HelpdeskTicket.user_id == username
        ).order_by(
            HelpdeskTicket.created_at.desc()
        ).all()

    return result


# ============================
# RECENT TICKETS
# ============================
@router.get("/recent-tickets", response_model=list[RecentTicketResponseSchema])
def get_recent_tickets(
    request: Request,
    db: Session = Depends(get_db)
):
    access_roles = {"ADM"}
    verify_user_access(request, access_roles, db)

    priority_order = case(
        (HelpdeskTicket.priority == "High", 1),
        (HelpdeskTicket.priority == "Medium", 2),
        (HelpdeskTicket.priority == "Low", 3),
        else_=4
    )

    result = db.query(
        HelpdeskTicket.user_id,
        HelpdeskTicket.title,
        HelpdeskTicket.description,
        HelpdeskTicket.priority,
        HelpdeskTicket.status,
        HelpdeskTicket.assigned_to,
        HelpdeskTicket.created_at,
        HelpdeskCategory.name.label("category"),
        HelpdeskSubCategory.name.label("subcategory")
    ).join(
        HelpdeskCategory, HelpdeskTicket.category == HelpdeskCategory.id
    ).join(
        HelpdeskSubCategory, HelpdeskTicket.subcategory == HelpdeskSubCategory.id
    ).filter(
        HelpdeskTicket.status == "Open"
    ).order_by(
        priority_order,
        HelpdeskTicket.created_at.desc()
    ).limit(5).all()

    return result


# ============================
# RESOLVE TICKET
# ============================
@router.post("/tickets/{ticket_id}/resolve")
def resolve_ticket(
    request: Request,
    ticket_id: str,
    resolution_comment: str = Form(...),
    user_id: str = Form(...),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage)
):
    access_roles = {"ADM"}
    verify_user_access(request, access_roles, db)
    ticket = db.query(HelpdeskTicket).filter_by(ticket_id=ticket_id).first()

    if not ticket:
        logger.warning("[RESOLVE_TICKET] Ticket not found")
        raise HTTPException(404, "Ticket not found")

    if ticket.status.lower() in ["closed", "resolved", "completed"]:
        logger.warning("[RESOLVE_TICKET] Ticket already closed")
        raise HTTPException(400, "Ticket already closed")

    ticket.status = "Resolved"

    # comment
    db.add(
        HelpdeskComment(
            ticket_id=ticket.ticket_id,
            comment_text=resolution_comment
        )
    )

    # Validate file types + size
    if file:
        validate_file(file, 5)

    # Read file bytes before storing (StorageService expects bytes, not UploadFile)
    if file:
        file.file.seek(0)
        file_bytes = file.file.read()
        file_path = storage.save_file(file_bytes, file.filename, "helpdesk")

        db.add(
            HelpdeskAttachment(
                ticket_id=ticket.ticket_id,
                file_name=file.filename,
                file_path=file_path,
                file_type=file.content_type,
                uploaded_by=user_id
            )
        )

    db.commit()
    logger.info("[RESOLVE_TICKET] Ticket resolved successfully")
    return {"message": "Ticket resolved successfully"}


# ============================
# DASHBOARD
# ============================
@router.get("/dashboard")
def dashboard_counts(
    request: Request,
    db: Session = Depends(get_db)
):
    access_roles = {"ADM"}
    verify_user_access(request, access_roles, db)

    rows = (
        db.query(HelpdeskTicket.status, func.count(HelpdeskTicket.ticket_id))
        .group_by(HelpdeskTicket.status)
        .all()
    )

    result = {"Open": 0, "In Progress": 0, "Resolved": 0}
    for status, count in rows:
        result[status] = count

    return result

# ============================
# GET ALL CATEGORIES
# ============================
@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(HelpdeskCategory).filter_by(active=True).all()
    return categories


# ============================
# GET SUBCATEGORIES BY CATEGORY ID
# ============================
@router.get("/subcategories/{category_id}")
def get_subcategories(category_id: int, db: Session = Depends(get_db)):
    subcategories = (
        db.query(HelpdeskSubCategory)
        .filter_by(category_id=category_id, active=True)
        .all()
    )
    return subcategories