from typing import Optional
from pydantic import BaseModel, Field
from datetime import date

class FinancialYearBase(BaseModel):
    fy_code: str = Field(..., min_length = 4)
    start_date: date
    end_date: date

class FinancialYearCreate(FinancialYearBase):
    pass  # just these 3 fields as input

class FinancialYearUpdate(BaseModel):
    fy_code: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class FinancialYearResponse(BaseModel):
    id: int
    fy_code: str
    start_date: date
    end_date: date


    class Config:
        orm_mode = True
