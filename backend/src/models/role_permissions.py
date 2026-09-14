from sqlalchemy import Column, Integer, ARRAY , CHAR, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.schema import Index
from .base import Base

class RolePermission(Base):
    __tablename__ = "role_permissions"
    # Foreign key to roles.role_code
    role_code = Column(CHAR(3), ForeignKey("roles.role_code"), nullable=False , primary_key=True)
    role = relationship("Role", back_populates="role_permissions")

    # Stores: [{"permission_id": 1, "actions": "1100"}, ...]
    permissions = Column(ARRAY(Integer), nullable=False)

    __table_args__ = (
        Index("ix_role_permissions_permissions", permissions, postgresql_using="gin"),
    )
