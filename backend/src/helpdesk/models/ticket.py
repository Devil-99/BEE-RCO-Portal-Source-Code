import uuid
from sqlalchemy import Column, String, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from src.models.base import Base

class HelpdeskTicket(Base):
    __tablename__ = "helpdesk_tickets"

    ticket_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(100), nullable=False, index=True)

    # 🔹 CHANGED: plain text
    category = Column(String(100), nullable=False)
    subcategory = Column(String(100), nullable=False)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)

    priority = Column(String(20), default="Medium")
    status = Column(String(30), default="Open")

    assigned_to = Column(String(50), nullable=True)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    closed_at = Column(TIMESTAMP(timezone=True), nullable=True)
