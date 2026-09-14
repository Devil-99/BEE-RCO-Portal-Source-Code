from sqlalchemy import Column, String, ForeignKey
from .base import Base

class State(Base):
    __tablename__ = "state"

    state_code = Column(String(2), primary_key=True, index=True)  # e.g., 'MH', 'UP'
    state_name = Column(String(100), nullable=False)              # e.g., 'Maharashtra'
    category = Column(String, ForeignKey("rco_target_category.category"), nullable=False)
