from pydantic import BaseModel, Field
from typing import Optional
    
class get_all_roles_response(BaseModel):
    id: int
    role_name: str
    role_code: str
    description: Optional[str] = None
    is_stage: Optional[bool] = False

    class Config:
        orm_mode = True

class create_role_request(BaseModel):
    role_code: str = Field(..., min_length=1, max_length=4)
    role_name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None