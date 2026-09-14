import uuid
from sqlalchemy import Column, Integer, ForeignKey, Boolean, DateTime, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class CorpChild(Base):
    __tablename__ = "corp_child"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parent_entity_id = Column(UUID, ForeignKey("entities.id"))
    child_entity_id = Column(UUID, ForeignKey("entities.id"))
    is_active = Column(Boolean, default=True)
    fy_id = Column(Integer, ForeignKey("financial_year.id"), nullable=False)
    status = Column(Boolean, default=True)
    associated_at = Column(DateTime(timezone=True), server_default=func.now())
    disassociated_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(UUID, ForeignKey("users.id"))
    remarks = Column(Text)
    
    # index on parent_entity_id
    __table_args__ = (
        Index('ix_parent_entity_id', 'parent_entity_id'),
    )
    
    parent_entity = relationship("Entity", foreign_keys=[parent_entity_id], backref="corp_child")
    child_entity = relationship("Entity", foreign_keys=[child_entity_id])
