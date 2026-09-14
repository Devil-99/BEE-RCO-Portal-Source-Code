from sqlalchemy import Column, Integer, String, ForeignKey
from .base import Base
from sqlalchemy.dialects.postgresql import UUID, ENUM
from ..utils.enums import EntityTypeEnum
import uuid

class Organization_Option(Base):
    __tablename__ = "organization_options"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(ENUM(EntityTypeEnum, name="entity_type"), nullable=False)
    state_code = Column(String, ForeignKey("state.state_code"), nullable=False)
    organization_name = Column(String, nullable=False)
    sector_type = Column(String, ForeignKey("sector_type.sector_code"), nullable=False)
    organization_code = Column(String, nullable=False)
    address = Column(String, nullable=True)

