from pydantic import BaseModel

class CategoryCreate(BaseModel):
    category: str

class CategoryOut(BaseModel):
    id: int
    category: str
    class Config:
        orm_mode = True
