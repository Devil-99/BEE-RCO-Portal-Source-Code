
from sqlalchemy import Column, CHAR, Integer, String, Text
from .base import Base
from sqlalchemy.orm import relationship

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, nullable=False,primary_key=True)
    role_code = Column(String(4), nullable=False, unique=True)
    role_name = Column(String(50), nullable=False)
    description = Column(Text)
    role_permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")
