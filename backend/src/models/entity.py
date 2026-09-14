from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey, CHAR, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import ENUM, UUID
from ..utils.enums import EntityTypeEnum
from .base import Base
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import relationship
from enum import IntEnum
from sqlalchemy.dialects.postgresql import JSONB # Import JSONB type for extra_docs field
import uuid

class DocumentFlagEnum(IntEnum):
    PENDING = 0
    APPROVED = 1
    REJECTED = 2

class Entity(Base):
    __tablename__ = "entities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_reg_no = Column(String(50), unique=True, nullable=True)
    org_name = Column(String(255), nullable=False)
    state_code = Column(CHAR(2), ForeignKey("state.state_code"), nullable=False)
    org_code = Column(CHAR(4), nullable=True)
    sector_code = Column(String(4), ForeignKey("sector_type.sector_code"), nullable=False)
    entity_type = Column(ENUM(EntityTypeEnum, name="entity_type"), nullable=False)
    pat_reg_number = Column(String(50), ForeignKey("pat_registration_no.registration_number"), nullable=True)
    address = Column(Text, nullable=False)
    registration_year = Column(Integer, nullable=False)
    applicability_flag = Column(Boolean, default=True)
    is_master = Column(Boolean, default=False)
    parent_entity_id = Column(UUID, ForeignKey("entities.id"), nullable=True)

    doc_one = Column(String(255), nullable=True)
    doc_two = Column(String(255), nullable=True)
    other_doc = Column(String(255), nullable=True)

    #exra doc field
    extra_docs = Column(JSONB, nullable=True, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    payment_flag = Column(Boolean, default=False)  # 0 = pending, 1 = done
    document_flag = Column(Integer, default=0)     # 0 = pending, 1 = approved, 2 = rejected

    remarks = Column(String, nullable=True)

    users = relationship("User", backref="entity")