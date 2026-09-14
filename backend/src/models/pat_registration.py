from sqlalchemy import Column, String, ForeignKey
from .base import Base

class PatRegistration(Base):
    __tablename__ = "pat_registration_no"

    registration_number = Column(String, primary_key=True, index=True)
    organisation_name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    sector_code = Column(String, ForeignKey("sector_type.sector_code"), nullable=False)
    plant_head_name = Column(String, nullable=False)
    mobile_number = Column(String, nullable=False)
    plant_head_email = Column(String, nullable=False)
    plant_head_recovery_email = Column(String, nullable=True)
    telephone_number = Column(String, nullable=True)
    state_code = Column(String, ForeignKey("state.state_code"), nullable=False)