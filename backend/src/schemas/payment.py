from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# Schema for the request body when initiating a payment
class OrderCreationRequest(BaseModel):
    user_id: UUID
    entity_id: UUID
    amount: float

class PaymentInitiationRequest(BaseModel):
    order_id: UUID
    pay_mode: str

class PaymentOrderDetailsResponse(BaseModel):
    order_id: UUID
    amount: float
    status: str
    gateway_status: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime
    verified_at: datetime

# Schema for Payment Analytics Response
class PaymentAnalyticsResponse(BaseModel):
    total_payments: int
    total_amount: float
    total_buyout_amount: float
    success_count: int
    pending_count: int
    failed_count: int
    status_breakdown: dict
    entity_wise: list
    user_wise: list
    monthly_trend: list
    payment_mode_breakdown: dict
    entity_list: list
    user_list: list


# Schema for Payment List Item
class PaymentListItem(BaseModel):
    order_id: UUID
    user_name: str
    mobile: str
    entity_id : UUID
    entity_name: str
    entity_reg_no: str
    category: str
    payment_amount: float
    payment_status: str
    gateway_status: Optional[str] = None
    payment_mode: Optional[str] = None
    transaction_ref_id: Optional[str] = None
    bank_ref_number: Optional[str] = None
    transaction_date: Optional[str] = None
    verified_at: Optional[datetime] = None
    entity_type: Optional[str] = None
    state_code: Optional[str] = None


class PaymentListResponse(BaseModel):
    payments: List[PaymentListItem]
    total_count: int
    page: int
    page_size: int
    total_pages: int

class PaymentDetailResponse(BaseModel):
    order_id: UUID
    amount: float
    status: str
    gateway_status: Optional[str] = None
    transaction_id: Optional[str] = None
    payment_mode: Optional[str] = None
    bank_ref_number: Optional[str] = None
    challan_number: Optional[str] = None
    transaction_date: Optional[str] = None
    double_verified_at: Optional[datetime] = None
    reason: Optional[str] = None
    username: Optional[str] = None
    entity_registration_number: Optional[str] = None