from fastapi import APIRouter, HTTPException, Depends , Request, status
from sqlalchemy.orm import Session
from src.utils.TrackingRouter import TrackingRouter
from src.database import SessionLocal
from src.models.state import State
from src.schemas.state import StateCreate, StateOut
from typing import List
from src.database import get_db
from src.utils.security import verify_user_access

import logging
logger = logging.getLogger(__name__)

router = TrackingRouter(tags=["States"])

    
@router.post("/create-state", response_model=StateOut)
def create_state(
    state_data: StateCreate, 
    request: Request, 
    db: Session = Depends(get_db)
):
    # Admin access check
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)

    required_fields = ["state_code", "state_name"]
    for field in required_fields:
        if not getattr(state_data, field):
            raise HTTPException(status_code=400, detail=f"{field} is required")

    # Validate state_code length
    if len(state_data.state_code) != 2:
        raise HTTPException(status_code=400, detail="State code must be exactly 2 characters long")

    existing_state = db.query(State).filter(
        State.state_code == state_data.state_code
    ).first()

    if existing_state:
        logger.warning(f"[CREATE_STATE] State already exists with code: {state_data.state_code}")
        raise HTTPException(status_code=400, detail="State already exists")

   
    try:
        new_state = State(**state_data.dict())
        db.add(new_state)
        db.commit()
        db.refresh(new_state)

    except Exception as e:
        db.rollback()
        logger.error("[CREATE_STATE] Failed to create state", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Something went wrong")

    logger.info("[CREATE_STATE] State created successfully")
    return new_state


@router.get("/get-states", response_model=List[StateOut])
def get_all_states(db: Session = Depends(get_db)):
    return db.query(State).order_by(State.state_code).all()

@router.put("/update-state/{state_code}", response_model=StateOut)
def update_state(state_code: str, state_data: StateCreate, request: Request, db: Session = Depends(get_db)):
    logger.info("[UPDATE_STATE] Request received")
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)
    state = db.query(State).filter(State.state_code == state_code).first()
    if not state:
        logger.warning(f"[UPDATE_STATE] State not found with code: {state_code}")
        raise HTTPException(status_code=404, detail="State not found")
    
    state.state_name = state_data.state_name
    state.category = state_data.category
    db.commit()
    db.refresh(state)
    logger.info("[UPDATE_STATE] State updated successfully")
    return state
