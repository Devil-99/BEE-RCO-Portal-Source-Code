from sqlalchemy import (
    Integer, String, DateTime, JSON, Column, ForeignKey, Index
)
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
 
class Workflow(Base):
    __tablename__ = "workflows"
 
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    form_type = Column(String(100), index=True)
    fy_id = Column(Integer, ForeignKey("financial_year.id"), index=True)
    steps_json = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    default = Column(Integer, default=0)
 
    forms = relationship("SubmissionMaster", back_populates="workflow", cascade="all, delete-orphan")
 