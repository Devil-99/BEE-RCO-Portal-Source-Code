from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, BigInteger
from sqlalchemy.sql import func
from src.models.base import Base

class HelpdeskAttachment(Base):
    __tablename__ = "helpdesk_attachments"

    attachment_id = Column(Integer, primary_key=True)
    ticket_id = Column(ForeignKey("helpdesk_tickets.ticket_id"))
    file_name = Column(String(255))
    file_path = Column(String(500))
    file_type = Column(String(50))
    file_size_bytes = Column(BigInteger)
    uploaded_by = Column(String(50))
    uploaded_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
