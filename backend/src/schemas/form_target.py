from pydantic import BaseModel, UUID4
from ..utils.enums import RCOSourceEnum

class TargetPercentageResponse(BaseModel):
    id: UUID4
    fy_id: int
    category: str
    source: RCOSourceEnum
    target_pct: float
    class Config:
        orm_mode = True
        fields = {'target_pct': 'target_percentage'}