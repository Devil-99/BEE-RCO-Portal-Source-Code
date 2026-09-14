from pydantic import BaseModel
from typing import Optional,List

class PatRegistrationBase(BaseModel):
    organisation_name: str
    address: Optional[str] = None
    sector_code: str
    plant_head_name: str
    telephone_number: Optional[str] = None
    plant_head_email: str
    plant_head_recovery_email: Optional[str] = None
    mobile_number: str
    state_code: str

class PatRegistrationCreate(PatRegistrationBase):
    registration_number: str  # Required for creation

class PatListResponse(BaseModel):
    registration_number: str

    class Config:
        from_attributes = True  # For ORM compatibility in Pydantic v2
class PatRegistrationResponse(PatRegistrationBase):
    registration_number: str

    class Config:
        from_attributes = True  # For ORM compatibility in Pydantic v2

class PatRegistrationPaginatedResponse(BaseModel):
    items: List[PatRegistrationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int