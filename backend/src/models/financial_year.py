from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ENUM
from ..utils.enums import PeriodCodeEnum
from .base import Base

class FinancialYear(Base):
    __tablename__ = "financial_year"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fy_code = Column(String(10), nullable=False)
    start_date =  Column(Date, nullable=False)
    end_date =  Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    submission_periods = relationship("SubmissionPeriod", back_populates="financial_year", cascade="all, delete-orphan")

    
    
class SubmissionPeriod(Base):
    __tablename__ = "submission_period"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    fy_id = Column(Integer, ForeignKey("financial_year.id"), nullable=False)
    period_code = Column(ENUM(PeriodCodeEnum), name="period_code")
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    
    financial_year = relationship("FinancialYear", back_populates="submission_periods")

