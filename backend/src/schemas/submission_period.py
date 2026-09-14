from pydantic import BaseModel, Field, validator
from datetime import date
from typing import Optional
from .financial_year import FinancialYearResponse

class SubmissionPeriodBase(BaseModel):
    fy_id: int
    period_code: str
    start_date: date
    end_date: date

    # @validator("start_date")
    # def validate_start_date(cls, v):
    #     if v < date.today():
    #         raise ValueError("Start date must be today or in the future.")
    #     return v

    # @validator("end_date")
    # def validate_end_date(cls, v, values):
    #     if "start_date" in values and v < values["start_date"]:
    #         raise ValueError("End date must not be earlier than start date.")
    #     return v

class SubmissionPeriodCreate(SubmissionPeriodBase):
    pass

class SubmissionPeriodUpdate(SubmissionPeriodBase):
    pass

class SubmissionPeriodOut(SubmissionPeriodBase):
    id: int
    financial_year: Optional[FinancialYearResponse]

    class Config:
        orm_mode = True
