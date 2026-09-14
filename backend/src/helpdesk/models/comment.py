from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from src.models.base import Base

class HelpdeskComment(Base):
    __tablename__ = "helpdesk_ticket_comments"

    comment_id = Column(Integer, primary_key=True)
    ticket_id = Column(ForeignKey("helpdesk_tickets.ticket_id"))
    entered_by = Column(String(50), nullable=False)
    comment_text = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
