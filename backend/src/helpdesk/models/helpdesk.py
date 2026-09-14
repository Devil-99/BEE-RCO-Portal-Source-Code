import uuid
from sqlalchemy import (
    Column, Integer, String, Text, Boolean,
    ForeignKey, TIMESTAMP, BigInteger
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from src.models.base import Base


# ============================
# TICKET
# ============================
class HelpdeskTicket(Base):
    __tablename__ = "helpdesk_tickets"

    ticket_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(100), ForeignKey("users.username"), nullable=False, index=True)

    category = Column(Integer, nullable=False)
    subcategory = Column(Integer, nullable=False)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)

    priority = Column(String(20), default="Medium")
    status = Column(String(30), default="Open")

    assigned_to = Column(String(50))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    closed_at = Column(TIMESTAMP(timezone=True))


# ============================
# CATEGORY
# ============================
class HelpdeskCategory(Base):
    __tablename__ = "helpdesk_categories"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String)
    sla_hours = Column(Integer)
    active = Column(Boolean, default=True)


# ============================
# SUBCATEGORY
# ============================
class HelpdeskSubCategory(Base):
    __tablename__ = "helpdesk_subcategories"

    id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey("helpdesk_categories.id"))
    name = Column(String(100), nullable=False)
    description = Column(String)
    sla_hours = Column(Integer)
    active = Column(Boolean, default=True)


# ============================
# COMMENT
# ============================
class HelpdeskComment(Base):
    __tablename__ = "helpdesk_ticket_comments"

    comment_id = Column(Integer, primary_key=True)
    ticket_id = Column(ForeignKey("helpdesk_tickets.ticket_id"))
    comment_text = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


# ============================
# ATTACHMENT
# ============================
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


# ============================
# AUDIT LOG
# ============================
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