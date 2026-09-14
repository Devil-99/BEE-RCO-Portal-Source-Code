
from pydantic import BaseModel
from typing import Optional
from src.utils.enums import FormTypeEnum

class CPPFormSectionBase(BaseModel):
    title: str

class CPPFormSectionResponse(CPPFormSectionBase):
    id: int
    class Config:
        orm_mode = True

class CPPFormBase(BaseModel):
    section_id: int
    serial: int
    field_name: str
    acronym: str
    unit: str
    type: FormTypeEnum
    logic: Optional[str] = None

class CPPFormResponse(CPPFormBase):
    id: int
    class Config:
        orm_mode = True

class CPPFormCreate(BaseModel):
    section_id: int
    field_name: str
    acronym: str
    unit: str
    type: FormTypeEnum
    logic: Optional[str] = None
    serial: int
