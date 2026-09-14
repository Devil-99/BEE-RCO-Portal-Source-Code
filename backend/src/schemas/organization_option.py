from pydantic import BaseModel, UUID4, Field
from typing import Optional
from src.utils.enums import EntityTypeEnum

class OrganizationOptionBase(BaseModel):
    entity_type: EntityTypeEnum
    state_code: str
    organization_name: str
    sector_type: str
    organization_code: str
    address: Optional[str]

class OrganizationOptionCreate(OrganizationOptionBase):
    pass

class OrganizationOptionResponse(OrganizationOptionBase):
    id: UUID4

    class Config:
        orm_mode = True
