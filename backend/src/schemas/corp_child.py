from pydantic import BaseModel, constr, UUID4
from typing import Optional
from datetime import datetime

class CorpChildBase(BaseModel):
    id: UUID4
    parent_entity_name: str
    child_entity_name: str
    fy_id: int
    status: bool
    associated_at: datetime
    created_by: UUID4
    
class EntitiesBase(BaseModel):
    id: UUID4
    reg_no: str
    org_name: str

class MappedEntitiesDetails(BaseModel):
    id: UUID4
    reg_no: str
    org_name: str
    entity_type: str
    status: Optional[str] = None
    is_closed: Optional[int] = None
    surplus_deficit: Optional[float] = None
    surplus_deficit_percentage: Optional[float] = None
    total_recs: Optional[int] = None
    buyout_request: Optional[bool] = None
    
    class Config:
        orm_mode = True

class CorpChildMappingRequest(BaseModel):
    selected_entity_id: UUID4
    fy_id: int

    class Config:
        orm_mode = True
        
class CorpChildMappingApproveRequest(BaseModel):
    mapping_id: UUID4
    action: str

    class Config:
        orm_mode = True

class CorpChildBuyoutSummary(BaseModel):
    total_entities: int
    closed_entities: int
    pending_entities: int
    all_submissions_closed: bool
    cumulative_surplus_deficit: Optional[float] = None
    total_recs: Optional[int] = None
    total_shortfall: Optional[float] = None

    class Config:
        orm_mode = True