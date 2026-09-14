from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.sql import func
import uuid
from ..utils.enums import PaymentCategoryCodeEnum, EntityTypeEnum
from .base import Base

class PaymentCategoryMaster(Base):
    __tablename__ = "payment_category_master"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_code = Column(ENUM(PaymentCategoryCodeEnum, name="payment_category_code"), nullable=False)
    title         = Column(String(100), nullable=False)
    fy_id         = Column(Integer, ForeignKey("financial_year.id"), nullable=False)
    sector_type   = Column(String(4), ForeignKey("sector_type.sector_code"), nullable=True)
    entity_type   = Column(ENUM(EntityTypeEnum, name="entity_type"), nullable=True)
    amount        = Column(Numeric(14, 2), nullable=False)
    is_default    = Column(Boolean, default=False)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("category_code", "fy_id", "sector_type", "entity_type",
                         name="uq_category_fy_sector_entity"),
    )
