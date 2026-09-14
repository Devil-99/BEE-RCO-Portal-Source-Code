from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base

class AEA(Base):
    __tablename__ = "bee_aea_master"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    aea_id = Column(String(50), nullable=False)
    full_name = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    mobile = Column(String(10), unique=True, nullable=True)
    valid_from = Column(Date, nullable=False)
    valid_to = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    source_type = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now()) 
   
class FirmAuditorMapping(Base):
    __tablename__ = "firm_auditor_mapping"
    
    application_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    auditor_id = Column(UUID, ForeignKey("bee_aea_master.id"), nullable=False)
    firm_id = Column(UUID, ForeignKey("bee_firm_master.firm_id"), nullable=False)
    status = Column(Boolean, nullable=False, default=False)
    reviewed_by = Column(UUID, ForeignKey("users.id"), nullable=True)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    approved_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
class EntityFirmAuditorMapping(Base):
    __tablename__ = "entity_firm_auditor_mapping"
    
    assignment_id =  Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID, ForeignKey("entities.id"), nullable=False)
    auditor_id = Column(UUID, ForeignKey("bee_aea_master.id"), nullable=False)
    firm_id = Column(UUID, ForeignKey("bee_firm_master.firm_id"), nullable=False)
    fy = Column(Integer, nullable=True)
    status = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
 