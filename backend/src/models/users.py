from sqlalchemy import Column, Integer, String, Boolean, DateTime, CHAR, ForeignKey, UUID
from sqlalchemy.sql import func
from .base import Base
from sqlalchemy.dialects.postgresql import UUID
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=True)
    entity_id = Column(UUID, ForeignKey("entities.id"), nullable=True)
    designation = Column(String(50), nullable=True)
    applicable_fy = Column(CHAR(4), nullable=False)
    full_name = Column(String(255), nullable=False)
    primary_email = Column(String(100), unique=True, nullable=False)
    secondary_email = Column(String(100), nullable=True)
    mobile = Column(String(10), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    role_code = Column(String(4), ForeignKey("roles.role_code"), nullable=False)
    is_password_reset = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
class EnergyManagerMaster(Base):
    __tablename__ = "energy_manager_master"

    registration_number = Column(String(20), primary_key=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())