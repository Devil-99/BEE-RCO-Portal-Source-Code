from pydantic import BaseModel, validator

# Define Pydantic models to create and return state objects

class StateCreate(BaseModel):
    state_code: str
    state_name: str
    category: str

    @validator('state_code')
    def validate_state_code_length(cls, v):
        if not v or len(v) != 2:
            raise ValueError('State code must be exactly 2 characters long')
        return v

class StateOut(StateCreate):
    class Config:
        orm_mode = True  
