

from .base import Base
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Numeric, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import ENUM

# Adjust the import path to match your project structure
from ..utils.enums import FormTypeEnum


# ------------------- DISCOM Form Section Table -------------------
class DiscomFormSection(Base):
    """
    Defines the sections or parts of the DISCOM form for better organization.
    (e.g., "Part A - Energy Supply Details")
    """
    __tablename__ = 'discom_form_sections'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False, unique=True)

    # One-to-many relationship to the fields within this section
    fields = relationship("DiscomFormField", back_populates="section", cascade="all, delete")


# ------------------- DISCOM Form Field Table -------------------
class DiscomFormField(Base):
    """
    Defines each individual field available in the DISCOM form.
    Includes details like name, type (INPUT/LOGIC), and calculation logic.
    """
    __tablename__ = 'discom_form_fields'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    section_id = Column(Integer, ForeignKey("discom_form_sections.id"), nullable=False)
    serial = Column(Integer, nullable=False)
    field_name = Column(String(255), nullable=False)
    acronym = Column(String(10), nullable=False, unique=True)
    unit = Column(String(10), nullable=False)
    type = Column(ENUM(FormTypeEnum, name="discom_form_type"), nullable=False)
    logic = Column(Text, nullable=True)  # Used only if type is 'LOGIC'

    # Many-to-one relationship back to the parent section
    section = relationship("DiscomFormSection", back_populates="fields")

