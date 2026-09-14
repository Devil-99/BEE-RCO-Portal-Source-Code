from pydantic import BaseModel, UUID4
from typing import Optional, Dict
from src.utils.enums import FormTypeEnum, SubmissionStatusEnum


# ---------- DISCOM ANNUAL FORM SECTION SCHEMA ----------
class DiscomAnnualFormSectionBase(BaseModel):
    title: str


class DiscomAnnualFormSectionResponse(DiscomAnnualFormSectionBase):
    id: int

    class Config:
        orm_mode = True


# ---------- DISCOM ANNUAL FORM FIELD SCHEMA ----------
class DiscomAnnualFormBase(BaseModel):
    section_id: int
    serial: int
    field_name: str
    acronym: str
    unit: str
    type: FormTypeEnum
    logic: Optional[str] = None


class DiscomAnnualFormResponse(DiscomAnnualFormBase):
    id: int

    class Config:
        orm_mode = True


# ---------- DISCOM ANNUAL FORM SUBMISSION ----------
class DiscomAnnualSubmissionBase(BaseModel):
    entity_id: UUID4
    fy_id: int
    user_id: int
    acronym: str
    value: float


class DiscomAnnualSubmissionDetailResponse(BaseModel):
    id: int
    acronym: str
    value: float

    class Config:
        orm_mode = True


class DiscomAnnualSubmissionMasterResponse(BaseModel):
    id: int
    entity_id: UUID4
    fy_id: int
    status: str
    created_by: int
    logic_snapshot: Optional[Dict]
    derived_from_quarters: Optional[Dict]

    class Config:
        orm_mode = True