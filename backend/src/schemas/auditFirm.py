# src/schemas.py

from pydantic import BaseModel, Field, UUID4
from typing import Optional
from datetime import date, datetime

# Base schema with fields common to creating and reading
class FirmBase(BaseModel):
    firm_name: str
    state_code: str
    address: str
    full_name: Optional[str] = None
    valid_from: date
    valid_to: date
    email: Optional[str] = None
    mobile: Optional[str] = None
    source_type: Optional[str] = 'Manual Upload'

# Schema for creating a new firm (request body for POST)
class FirmCreateRequest(FirmBase):
    pass

# Schema for reading a firm (response body for GET)
class FirmResponse(FirmBase):
    firm_id: UUID4
    class Config:
        orm_mode = True

class FirmListForUsersResponse(BaseModel):
    firm_name: str
    state_name: str
    address: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None

class EntityWithAuditorOut(BaseModel):
    entity_id: UUID4
    entity_name: str
    auditor_name: Optional[str]
    fy_id: int

# Schema for updating a firm (request body for PUT)
# All fields are optional for partial updates.
class FirmUpdateRequest(BaseModel):
    firm_name: Optional[str] = None
    bee_empanelment_no: Optional[str] = None
    state_code: Optional[str] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    is_active: Optional[bool] = None
    source_type: Optional[str] = None
    address: Optional[str] = None   
    full_name: Optional[str] = None   

class RegisteredFirmResponse(BaseModel):
    firm_id: UUID4
    firm_name: str

    class Config:
        orm_mode = True  # <-- corrected from_attributes to orm_mode

class FirmSearchResponse(BaseModel):
    firm_name: str
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    address: str
    state_code: str

class FirmUserRegisterRequest(BaseModel):
    firm_name: str
    full_name: str
    address: str
    email: str
    mobile: str = Field(..., max_length=10)
    otp: str = Field(..., max_length=6)

class EntityFirmMappingRequest(BaseModel):
    firm_id: UUID4
    fy_id: int

class EntityAuditorFirmMappingRequest(BaseModel):
    entity_id: UUID4
    auditor_id: UUID4
    fy_id: int
  
