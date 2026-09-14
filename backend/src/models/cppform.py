from .base import Base
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Numeric, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import ENUM
from ..utils.enums import FormTypeEnum

# ------------------- Section Table -------------------
class CPPFormSection(Base):
    __tablename__ = 'cpp_form_sections'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)

    # One-to-many relationship to fields
    fields = relationship("CPPFormField", back_populates="section", cascade="all, delete")


# ------------------- Field Table -------------------
class CPPFormField(Base):
    __tablename__ = 'cpp_form_fields'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    section_id = Column(Integer, ForeignKey("cpp_form_sections.id"), nullable=False)
    serial = Column(Integer, nullable=False)
    field_name = Column(String(255), nullable=False)
    acronym = Column(String(10), nullable=False, unique=True)
    unit = Column(String(10), nullable=False)
    type = Column(ENUM(FormTypeEnum, name="form_type"), nullable=False)  # INPUT, LOGIC, FETCHED
    logic = Column(Text, nullable=True)  # Used only if type is LOGIC

    # Relationship to section
    section = relationship("CPPFormSection", back_populates="fields")