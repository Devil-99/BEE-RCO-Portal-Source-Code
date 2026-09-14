from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# ---------- Create / Update ----------
class WorkflowCreate(BaseModel):
    name: str
    form_type: Optional[str] = None
    fy_id: int
    default: int
    steps: Optional[List[int]] = Field(default_factory=list)

# ---------- Response ----------
class WorkflowOut(BaseModel):
    id: int
    name: str
    form_type: Optional[str]
    fy_id: int
    default: int
    steps_json: Optional[List[int]]
    created_at: Optional[datetime]
    class Config:
        from_attributes = True