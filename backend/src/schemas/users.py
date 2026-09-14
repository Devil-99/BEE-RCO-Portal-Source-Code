from pydantic import BaseModel, UUID4, Field, validator
from typing import Optional
from datetime import datetime

class login_otp_request(BaseModel):
    username: str
    password: str = Field(..., min_length=8)

class verify_usercreds_request(BaseModel):
    username: str
    otp: str = Field(..., min_length=6, max_length=6)

class reset_password_request(BaseModel):
    new_password: str = Field(..., min_length=8)
    token: str
    
class change_password_request(BaseModel):
    current_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)

class login_request(BaseModel):
    username: str
    password: str = Field(..., min_length=8)
    verificationCode: str = Field(..., min_length=6, max_length=6)

class login_response(BaseModel):
    token: str
    user_id: int
    username: str
    message: str
    role_name: str


class user_response(BaseModel):
    username: str
    full_name: str
    mobile: str
    primary_email: str
    secondary_email: Optional[str] = None
    role_name: str
    designation: str
    id: Optional[UUID4] = None

class add_user_request(BaseModel):
    full_name: str = Field(..., min_length=1)
    primary_email: str = Field(..., min_length=1)
    secondary_email: Optional[str] 
    mobile: str = Field(..., min_length=1)
    role_code: str = Field(..., min_length=1)
    designation: Optional[str]

    @validator("full_name", "primary_email", "mobile", "role_code", pre=True)
    def empty_string_check(cls, v):
        if isinstance(v, str) and not v.strip():
            raise ValueError("Mandatory Field cannot be empty")
        return v

class update_user_request(BaseModel):
    primary_email: str = Field(None, min_length=1)
    secondary_email: Optional[str] = None
    mobile: str = Field(None, min_length=10)

    @validator("primary_email", "mobile", pre=True)
    def empty_string_check(cls, v):
        if v is not None and isinstance(v, str) and not v.strip():
            raise ValueError("Mandatory Field cannot be empty")
        return v

class track_status_response(BaseModel):
    entity_id: UUID4
    user_id: UUID4
    entity_type: str
    sector_type: str
    username: str
    payment_flag: bool
    document_flag: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

class energy_manager_response(BaseModel):
    registration_number: str
    name: str

    class Config:
        orm_mode = True

class create_energy_manager_request(BaseModel):
    registration_number: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=255)

class update_energy_manager_request(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)

class energy_manager_paginated_response(BaseModel):
    items: list[energy_manager_response]
    total: int
    page: int
    page_size: int
    total_pages: int
