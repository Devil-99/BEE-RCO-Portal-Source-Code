from pydantic import BaseModel, UUID4
from typing import Optional
from src.utils.enums import FormTypeEnum


# ---------- ANNUAL FORM SECTION SCHEMA ----------
class AnnualCPPFormSectionBase(BaseModel):
    title: str


class AnnualCPPFormSectionResponse(AnnualCPPFormSectionBase):
    id: int

    class Config:
        orm_mode = True


# ---------- ANNUAL FORM FIELD SCHEMA ----------
class AnnualCPPFormBase(BaseModel):
    section_id: int
    serial: int
    field_name: str
    acronym: str
    unit: str
    type: FormTypeEnum
    logic: Optional[str] = None


class AnnualCPPFormResponse(AnnualCPPFormBase):
    id: int

    class Config:
        orm_mode = True


# ---------- ANNUAL FORM SUBMISSION ----------
class AnnualCPPFormSubmissionBase(BaseModel):
    entity_id: UUID4
    fy_id: int
    user_id: int
    acronym: str
    value: float


class AnnualCPPSubmissionDetailResponse(BaseModel):
    id: int
    acronym: str
    value: float

    class Config:
        orm_mode = True


class AnnualCPPSubmissionMasterResponse(BaseModel):
    id: int
    entity_id: UUID4
    fy_id: int
    status: str
    created_by: int
    logic_snapshot: Optional[dict]
    derived_from_quarters: Optional[dict]

    class Config:
        orm_mode = True
