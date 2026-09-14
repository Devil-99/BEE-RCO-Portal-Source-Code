from sqlalchemy import Column, Integer, String, Text
from .base import Base

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    path = Column(String(255), nullable=False) # e.g., /api/v1/entities
    method = Column(String(10), nullable=False) # e.g., GET, POST, PUT, DELETE  
    created_at = Column(String(50), nullable=False)  # Use a string for datetime to avoid timezone issues
    