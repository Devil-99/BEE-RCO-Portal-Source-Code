from sqlalchemy import Column, Integer, String, ForeignKey, Date, DateTime, Text, Numeric, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ENUM, UUID
import uuid
from .base import Base
from ..utils.enums import BuyoutTypeEnum, BuyoutRequestStatusEnum, ComplianceStatusEnum

class RECMaster(Base):
    __tablename__ = "rec_master"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID, ForeignKey("entities.id"), nullable=False)
    fy_id = Column(Integer, ForeignKey("financial_year.id"), nullable=False)
    target = Column(Numeric(14, 2), nullable=False)
    number_of_recs = Column(Integer, nullable=False)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    

class BuyoutRequest(Base):
    __tablename__ = "buyout_request"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID(as_uuid=True),ForeignKey("entities.id"),nullable=False)
    fy_id = Column(Integer,ForeignKey("financial_year.id"),nullable=False)
    buyout_type = Column(ENUM(BuyoutTypeEnum, name="buyout_type_enum"),nullable=False)
    shortfall_amount = Column(Numeric(20, 4),nullable=False)
    payable_amount = Column(Numeric(20, 2),nullable=False)
    utr_number = Column(String(100),nullable=False)
    payment_date = Column(Date,nullable=True)
    status = Column(ENUM(BuyoutRequestStatusEnum,name="buyout_request_status_enum"),nullable=False,default=BuyoutRequestStatusEnum.SUBMITTED)
    document_url = Column(String(500),nullable=False)
    submitted_by = Column(UUID(as_uuid=True),ForeignKey("users.id"),nullable=False)
    approved_at = Column(DateTime(timezone=True),nullable=True)
    remarks = Column(Text,nullable=True)
    created_at = Column(DateTime(timezone=True),server_default=func.now())
    updated_at = Column(DateTime(timezone=True),server_default=func.now(),onupdate=func.now())


class ComplianceStatus(Base):
    __tablename__ = "compliance_status"

    id = Column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    entity_id = Column(UUID(as_uuid=True),ForeignKey("entities.id"),nullable=False)
    fy_id = Column(Integer,ForeignKey("financial_year.id"),nullable=False)
    status = Column(ENUM(ComplianceStatusEnum,name="compliance_status_enum"),nullable=False,default=ComplianceStatusEnum.PENDING)
    buyout_request_id = Column(UUID(as_uuid=True),ForeignKey("buyout_request.id"),nullable=False)
    created_at = Column(DateTime(timezone=True),server_default=func.now())
    updated_at = Column(DateTime(timezone=True),server_default=func.now(),onupdate=func.now())
    
    buyout_request = relationship(
        "BuyoutRequest",
        backref="compliance_records"
    )
    __table_args__ = (UniqueConstraint("entity_id","fy_id",name="uq_compliance_entity_fy"),)