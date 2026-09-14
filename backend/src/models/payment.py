from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, CHAR, Numeric, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import ENUM, UUID
import uuid
from .base import Base
from ..utils.enums import PaymentStatusEnumNew

class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    entity_id = Column(UUID, ForeignKey("entities.id"), nullable=False)
    category = Column(String(50), nullable=False)
    payment_amount = Column(Numeric(20, 2), nullable=False)
    payment_currency = Column(CHAR(3), default='INR')
    payment_status = Column(ENUM(PaymentStatusEnumNew, name="payment_status"))
    gateway_status = Column(String(25), nullable=True)
    transaction_ref_id = Column(String(30), unique=True, nullable=True)
    payment_mode = Column(String(50), nullable=True)
    bank_ref_number = Column(String(30), nullable=True)
    challan_number = Column(String(25), nullable=True)
    transaction_date = Column(String(25), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
