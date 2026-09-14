
from pydantic import BaseModel
from typing import List, Optional
from ..utils.enums import FormTypeEnum 

class DiscomFormSectionBase(BaseModel):
    title: str

class DiscomFormSectionResponse(DiscomFormSectionBase):
    id: int
    class Config:
        orm_mode = True

class DiscomFormFieldBase(BaseModel):
    section_id: int
    serial: int
    field_name: str
    acronym: str
    unit: str
    type: FormTypeEnum
    logic: Optional[str] = None

class DiscomFormFieldResponse(DiscomFormFieldBase):
    id: int
    class Config:
        orm_mode = True

class DiscomFormCreate(BaseModel):
    section_id: int
    field_name: str
    acronym: str
    unit: str
    type: FormTypeEnum
    logic: Optional[str] = None
    serial: int

