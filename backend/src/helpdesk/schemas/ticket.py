from pydantic import BaseModel, Field, UUID4
from datetime import datetime

class TicketCreateSchema(BaseModel):
    user_id: str
    category: int
    subcategory: int
    title: str
    description: str | None = None
    priority: str

class TicketResolveSchema(BaseModel):
    resolution_comment: str = Field(..., min_length=5)

class TicketResponseSchema(BaseModel):
    ticket_id: UUID4
    user_id: str
    category: str
    subcategory: str
    title: str
    description: str | None = None
    priority: str
    status: str
    assigned_to: str | None = None
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None = None

class RecentTicketResponseSchema(BaseModel):
    user_id: str
    title: str
    description: str | None = None
    priority: str
    status: str
    assigned_to: str | None = None
    created_at: datetime
    category: str
    subcategory: str