from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import List, Optional

class FormSubmissionBase(BaseModel):
    acronym : str
    value: float
    entity_id: UUID4
    period_id: int
    fy_id: int
    user_id: UUID4
    uploads: Optional[List[str]] = None
    
class SubmissionDetailResponse(BaseModel):
    id: int
    submission_id: UUID4
    acronym: str
    value: float


class SubmissionMasterResponse(BaseModel):
    id: UUID4
    entity_id: UUID4
    period_id: int
    fy_id: int
    is_closed: int
    status: str
    updated_at: datetime
    status: str
    stage: str
    position: str
    state_code: str
    entity_name: str
    entity_type: str
    reg_no: str
    pat_reg_number: Optional[str] = None
    uploads: Optional[List[str]] = None

    class Config:
        orm_mode = True
        
class SubmissionStageHistoryResponse(BaseModel):
    id: int
    submission_id: UUID4
    stage_number: int
    action_status: str
    comments: Optional[str]
    action_by: UUID4
    action_at: datetime
    attachments: Optional[List[str]]

    role_name: Optional[str]

    class Config:
        orm_mode = True

class PaginatedSubmissionResponse(BaseModel):
    items: List[SubmissionMasterResponse]
    total: int
    page: int
    page_size: int
    total_pages: int