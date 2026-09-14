from sqlalchemy import Column, Integer, ForeignKey, String, Text, DateTime, Boolean ,JSON
from sqlalchemy.sql import func
from .base import Base
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Session(Base):
    __tablename__ = "sessions"

    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_context=Column(JSON, nullable=True)
    session_token = Column(String(512), unique=True, nullable=False, index=True)  # JWT token
    login_time = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_activity = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    logout_time = Column(DateTime(timezone=True), nullable=True)
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    failed_attempts = Column(Integer, default=0, nullable=False)
    iat = Column(DateTime(timezone=True), nullable=False, default=func.now())  # issued at
    exp = Column(DateTime(timezone=True), nullable=False)  # expiry
