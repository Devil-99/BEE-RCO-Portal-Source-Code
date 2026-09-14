import uuid
from sqlalchemy import (
    Column, String, Date, Boolean, Integer, func ,DateTime, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class Firm(Base):
    __tablename__ = "bee_firm_master"

    firm_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_name = Column(String(255), nullable=False)
    state_code = Column(String(10), ForeignKey("state.state_code"))
    address = Column(String(255))
    full_name = Column(String(255), nullable=True)
    mobile = Column(String(15), nullable=True)
    email = Column(String(25), nullable=True)
    valid_from = Column(Date, nullable=False)
    valid_to = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    source_type = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
class PlantFirmMapping(Base):
    __tablename__ = "plant_firm_mapping"
    
    assignment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID, ForeignKey("entities.id"), nullable=False)
    firm_id = Column(UUID, ForeignKey("bee_firm_master.firm_id"), nullable=False)
    fy = Column(Integer, ForeignKey("financial_year.id"), nullable=True)
    status = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())