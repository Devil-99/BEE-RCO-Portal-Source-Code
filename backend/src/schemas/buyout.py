from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel
from typing import Optional, List, Literal
from ..utils.enums import ComplianceStatusEnum, BuyoutRequestStatusEnum, BuyoutTypeEnum

    
class RECPurchaseRequest(BaseModel):
    fy_id: int
    number_of_recs: int
    purchase_date: datetime

class PurchasedRecItemResponse(BaseModel):
    id: UUID
    entity_id: UUID
    fy_id: int
    target: float
    number_of_recs: int
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class PurchasedRecsResponse(BaseModel):
    data: list[PurchasedRecItemResponse]

class BuyoutRequestActionPayload(BaseModel):
    action: Literal["APPROVE", "REJECT"]
    remarks: Optional[str] = None

class BuyoutStatusResponse(BaseModel):
    status: ComplianceStatusEnum
    buyout_request_id: Optional[UUID] = None
    utr_number: Optional[str] = None
    payment_date: Optional[date] = None
    buyout_type: Optional[str] = None
    submitted_by: Optional[UUID] = None
    document_url: Optional[str] = None
    submitted_on: Optional[datetime] = None
    approved_on: Optional[datetime] = None
    remarks: Optional[str] = None


class BuyoutRequestListItemResponse(BaseModel):
    buyout_request_id: UUID
    entity_id: UUID
    entity_reg_no: str
    entity_name: str
    sector_type: str
    state_code: str
    fy_id: int
    buyout_type: BuyoutTypeEnum
    shortfall_amount: float
    payable_amount: float
    utr_number: str
    payment_date: date
    status: BuyoutRequestStatusEnum
    created_at: datetime
    submitted_by: UUID
    document_url: str
    approved_at: Optional[datetime] = None