from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from src.models.base import Base

class HelpdeskSubCategory(Base):
    __tablename__ = "helpdesk_subcategories"

    id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey("helpdesk_categories.id"))
    name = Column(String(100), nullable=False)
    description = Column(String)
    sla_hours = Column(Integer)
    active = Column(Boolean, default=True)
