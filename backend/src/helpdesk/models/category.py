from sqlalchemy import Column, Integer, String, Boolean
from src.models.base import Base

class HelpdeskCategory(Base):
    __tablename__ = "helpdesk_categories"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String)
    sla_hours = Column(Integer)
    active = Column(Boolean, default=True)
