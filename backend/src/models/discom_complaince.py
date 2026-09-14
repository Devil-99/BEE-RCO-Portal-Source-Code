from .base import Base
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import ARRAY
from ..utils.enums import FormTypeEnum  # INPUT, LOGIC, INPUT_MULTI, LOGIC_MULTI


# ---------------------------------------------------------
#  SECTION TABLE
# ---------------------------------------------------------
class DiscomComplianceSection(Base):
    __tablename__ = "Discom_Complinace_form_sections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)


# ---------------------------------------------------------
#  FIELD TABLE (logic_multi changed to ARRAY)
# ---------------------------------------------------------
class DiscomComplianceFormField(Base):
    __tablename__ = "Discom_Complinace_form_fields"

    id = Column(Integer, primary_key=True, autoincrement=True)

    section_id = Column(
        Integer,
        ForeignKey("cpp_form_sections.id", ondelete="CASCADE"),
        nullable=False
    )

    # Optional grouping
    group_id = Column(Integer, nullable=True)

    serial = Column(Integer, nullable=False)
    field_name = Column(String(255), nullable=False)
    acronym = Column(String(20), nullable=False, unique=True)
    unit = Column(String(20), nullable=True)

    type = Column(
        Enum(FormTypeEnum, name="form_type_enum"),
        nullable=False
    )

    # Single formula (LOGIC)
    logic = Column(Text, nullable=True)

    # MULTI FORMULAS (LOGIC_MULTI)
    logic_multi = Column(ARRAY(Text), nullable=True)   # <-- updated
