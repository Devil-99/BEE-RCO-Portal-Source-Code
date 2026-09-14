
from pydantic import BaseModel, Field, UUID4
from typing import Any, Optional
from datetime import datetime
from ..utils.enums import EntityTypeEnum


class EntityBase(BaseModel):
    org_name: str = Field(..., max_length=255)
    state_code: str = Field(..., max_length=2)
    sector_code: str = Field(..., max_length=3)
    entity_type: EntityTypeEnum
    pat_reg_number: Optional[str] = None
    address: str = Field(..., max_length=255)
    document_flag: Optional[int] = None  # 0 = pending, 1 = approved, 2 = rejected


class EntityCreate(EntityBase):
    doc_one: Optional[str] = None
    doc_two: Optional[str] = None
    other_doc: Optional[str] = None


class DocumentApprovalUpdate(BaseModel):
    document_flag: int  # 0 = pending, 1 = approved, 2 = rejected
    remarks: Optional[str] = None


class EntityOut(BaseModel):
    id: UUID4
    user_id: UUID4
    entity_reg_no: Optional[str]
    org_name: str
    state_code: str
    org_code: Optional[str]
    sector_code: Optional[str]
    entity_type: Optional[str] = Field(..., alias="entity_type")
    primary_email: Optional[str] = None
    secondary_email: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    pat_reg_number: Optional[str]
    address: Optional[str]
    registration_year: Optional[int]
    is_master: bool
    doc_one: Optional[str]
    doc_two: Optional[str]
    other_doc: Optional[str]
    extra_docs: Optional[list[str]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    payment_flag: bool
    document_flag: int  # Consistent type
    remarks: Optional[str] = None

    class Config:
        orm_mode = True
        
    def dict(self, *args, **kwargs):
        data = super().dict(*args, **kwargs)
    # override payment_flag serialization
        data['payment_flag'] = 1 if data.get('payment_flag') else 0
        return data
    
class EntityDetailResponse(BaseModel):
    id: UUID4
    entity_reg_no: Optional[str]
    org_name: str
    state_code: str
    sector_code: Optional[str]
    entity_type: Optional[str] = Field(..., alias="entity_type")
    pat_reg_number: Optional[str]
    address: Optional[str]

class EntityListResponse(BaseModel):
    data: list[EntityOut]
    page: int
    page_size: int
    total: int
    total_pages: int    

class SubmissionDetailResponse(BaseModel):
    id: int
    # Add other common fields from your detail tables
    # e.g., field_acronym: str
    value: Optional[Any] = None

    class Config:
        from_attributes = True

class UpdateEntityRequest(BaseModel):
    full_name: Optional[str] = None
    primary_email: Optional[str] = None
    secondary_email: Optional[str] = None
    mobile: Optional[str] = None

class RegisteredEntityUserOut(BaseModel):
    entity_reg_no: str
    org_name: str
    state_code: str
    payment_flag: bool
    entity_type: str

    role: str
    username: str
    full_name: str
    mobile: str
    primary_email: str
    secondary_email: Optional[str]