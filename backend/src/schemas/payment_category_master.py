from pydantic import BaseModel, Field, UUID4
from typing import Optional
from src.utils.enums import PaymentCategoryCodeEnum, EntityTypeEnum

class PaymentCategoryMasterCreate(BaseModel):
    category_code: PaymentCategoryCodeEnum
    title: str = Field(..., min_length=1, max_length=100)
    fy_id: int
    sector_type: Optional[str] = Field(None, max_length=4)
    entity_type: Optional[EntityTypeEnum] = None
    amount: float = Field(..., gt=0)
    is_default: bool = False

class PaymentCategoryMasterUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    fy_id: Optional[int] = None
    sector_type: Optional[str] = Field(None, max_length=4)
    entity_type: Optional[EntityTypeEnum] = None
    amount: Optional[float] = Field(None, gt=0)
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None

class PaymentCategoryMasterOut(BaseModel):
    id: UUID4
    category_code: PaymentCategoryCodeEnum
    title: str
    fy_id: int
    sector_type: Optional[str] = None
    entity_type: Optional[EntityTypeEnum] = None
    amount: float
    is_default: bool
    is_active: bool

    class Config:
        orm_mode = True
