from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from src.database import get_db
from src.models import User
from src.utils.security import hash_password, verify_password

import logging
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Users"])

@router.post("/change-password/")
def change_password(
    user_id: int = Body(...),
    old_password: str = Body(...),
    new_password: str = Body(...),
    db: Session = Depends(get_db)
):
    logger.info("[CHANGE_PASSWORD] Request received")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.warning("[CHANGE_PASSWORD] User not found")
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(old_password, user.password_hash):
        logger.warning("[CHANGE_PASSWORD] Old password is incorrect")
        raise HTTPException(status_code=400, detail="Old password is incorrect")
    user.password_hash = hash_password(new_password)
    db.add(user)
    db.commit()
    logger.info("[CHANGE_PASSWORD] Password changed successfully")
    return {"message": "Password changed successfully"}
