from pydantic import BaseModel

class state_request(BaseModel):
    state_code: str  # e.g., 'MH', 'UP'
    state_name: str  # e.g., 'Maharashtra'
