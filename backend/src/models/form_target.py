from .base import Base
from sqlalchemy import Column, String, Integer, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import ENUM, UUID
import uuid
from ..utils.enums import RCOSourceEnum

# ------------------- Configuration Table (Retained from original) -------------------
class TargetPercentage(Base):
    __tablename__ = 'rco_target_percentage'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fy_id = Column(Integer, ForeignKey("financial_year.id"), nullable=False)
    category = Column(String, ForeignKey("rco_target_category.category"), nullable=False)
    source = Column(ENUM(RCOSourceEnum), nullable=False)
    target_pct = Column(Numeric(5, 2), nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "fy_id",
            "category",
            "source",
            name="uq_target_percentage_fy_category_source"
        ),
    )

class RCOTargetCategory(Base):
    __tablename__ = 'rco_target_category'

    id = Column(Integer, primary_key = True, autoincrement = True)
    category = Column(String(20), nullable=False, unique = True)
