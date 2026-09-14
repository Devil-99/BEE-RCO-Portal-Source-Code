from pydantic import BaseModel,Field, constr, UUID4
from typing import Optional
from datetime import date, datetime

# Response model
class AEAResponse(BaseModel):
    id: UUID4
    aea_id: str
    full_name: str
    email: str
    mobile: Optional[str]
    valid_from: date
    valid_to: Optional[date]
    source_type: Optional[str]

    class Config:
        orm_mode = True
        
class RegisteredAEAResponse(BaseModel):
    id: UUID4
    aea_id: str
    full_name: str
    primary_email: str
    mobile: str
    updated_at: datetime

    class Config:
        orm_mode = True
        
class AEACreateRequest(BaseModel):
    aea_id: str
    full_name: str
    email: Optional[str]
    mobile: Optional[constr(min_length=10, max_length=10)]
    valid_from: date
    valid_to: date
    source_type: Optional[str]
    
    class Config:
        orm_mode = True
        
class AEARegisterRequest(BaseModel):
    aea_id: str
    full_name: str
    email: str
    mobile: Optional[constr(min_length=10, max_length=10)]
    otp: str = Field(..., max_length=6)
    
    class Config:
        orm_mode = True

class AEAUpdateRequest(BaseModel):
    aea_id: str
    full_name: str
    email: str
    mobile: Optional[constr(min_length=10, max_length=10)]
    valid_from: date
    valid_to: Optional[date]
    source_type: Optional[str]

    class Config:
        orm_mode = True
        

class AuditorFirmMappingRequest(BaseModel):
    firm_id: UUID4

    
class MappedFirmResponse(BaseModel):
    firm_name: str
    status: bool
    
class ApproveAuditorRequest(BaseModel):
    auditor_id: str
    
class MappedAeaResponse(BaseModel):
    id: UUID4
    aea_id: str
    full_name: str
    status: bool

class MappedEntityResponse(BaseModel):
    id: UUID4
    entity_reg_no: str
    entity_name: str
    entity_type: str
    fy_id: int