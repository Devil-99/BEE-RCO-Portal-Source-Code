from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import ENUM
from ..utils.enums import EntityTypeEnum
from .base import Base

class Sectors(Base):
    __tablename__ = "sector_type"

    sector_code = Column(String(4), primary_key=True, index=True)
    sector_name = Column(String(255), nullable=False)
    entity_type = Column(ENUM(EntityTypeEnum, name="entity_type"), nullable=False)
    description = Column(Text, nullable=True)