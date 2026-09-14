# src/schemas.py

from pydantic import BaseModel, Field, validator
from typing import Optional
from src.utils.enums import EntityTypeEnum

class SectorTypeBase(BaseModel):
    sector_code: str
    sector_name: str 
    entity_type: EntityTypeEnum
    description: Optional[str] = None

    class Config:
        orm_mode = True

class SectorTypeCreate(SectorTypeBase):
    @validator('sector_code')
    def validate_sector_code_length(cls, v):
        if not v or len(v) != 4:
            raise ValueError('Sector code must be exactly 4 characters long')
        return v

class SectorTypeUpdate(BaseModel):
    sector_name: Optional[str]
    entity_type: Optional[str]
    description: Optional[str]

    class Config:
        orm_mode = True
