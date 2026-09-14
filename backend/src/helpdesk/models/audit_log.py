from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from src.models.base import Base

class HelpdeskAuditLog(Base):
    __tablename__ = "helpdesk_audit_log"

    log_id = Column(Integer, primary_key=True)
    ticket_id = Column(ForeignKey("helpdesk_tickets.ticket_id"))
    action = Column(String(100))
    field_name = Column(String(100))
    old_value = Column(Text)
    new_value = Column(Text)
    performed_by = Column(String(50))
    performed_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
