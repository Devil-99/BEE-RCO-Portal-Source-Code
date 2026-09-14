from fastapi import APIRouter, Depends, HTTPException, status , Request
from sqlalchemy.orm import Session
from src.utils.TrackingRouter import TrackingRouter
from src.database import get_db
from src.models import SubmissionPeriod
from src.schemas.submission_period import SubmissionPeriodCreate, SubmissionPeriodUpdate, SubmissionPeriodOut
from typing import List
from src.models.financial_year import SubmissionPeriod
from src.schemas.submission_period import (
    SubmissionPeriodCreate, SubmissionPeriodOut, SubmissionPeriodUpdate
)
from src.utils.security import verify_user_access
from sqlalchemy import and_

import logging
logger = logging.getLogger(__name__)

router = TrackingRouter(tags=["Submission Period"])

    
@router.post("/create-submission-period", response_model=SubmissionPeriodOut)
def create_submission_period(
    request: Request, 
    payload: SubmissionPeriodCreate, 
    db: Session = Depends(get_db)
):
    # ---- Admin Access Check ----
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)

   
    required_fields = ["fy_id", "period_code", "start_date", "end_date"]
    
    for field in required_fields:
        if not getattr(payload, field):
            raise HTTPException(
                status_code=400, 
                detail=f"{field.replace('_', ' ').title()} is required"
            )

    
    exists = db.query(SubmissionPeriod).filter(
        and_(
            SubmissionPeriod.fy_id == payload.fy_id,
            SubmissionPeriod.period_code == payload.period_code
        )
    ).first()

    if exists:
        logger.warning(f"[CREATE_SUBMISSION_PERIOD] Period '{payload.period_code}' already exists for FY")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Period '{payload.period_code}' already exists for this Financial Year"
        )


    try:
        submission_period = SubmissionPeriod(**payload.dict())
        db.add(submission_period)
        db.commit()
        db.refresh(submission_period)

    except Exception as e:
        db.rollback()
        logger.error("[CREATE_SUBMISSION_PERIOD] Failed to create submission period", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Something went wrong")

    logger.info("[CREATE_SUBMISSION_PERIOD] Submission period created successfully")
    return submission_period


# Get all submission periods
@router.get("/get-submission-periods", response_model=List[SubmissionPeriodOut])
def get_all_submission_periods(db: Session = Depends(get_db)):
    return db.query(SubmissionPeriod).order_by(SubmissionPeriod.id).all()

# Update submission period
@router.put("/update-submission-period/{submission_period_id}", response_model=SubmissionPeriodOut)
def update_submission_period(submission_period_id: int, payload: SubmissionPeriodUpdate, request: Request, db: Session = Depends(get_db)):
    logger.info("[UPDATE_SUBMISSION_PERIOD] Request received")
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)
    submission_period = db.query(SubmissionPeriod).filter_by(id=submission_period_id).first()
    if not submission_period:
        logger.warning(f"[UPDATE_SUBMISSION_PERIOD] Submission period not found with id: {submission_period_id}")
        raise HTTPException(status_code=404, detail="Submission period not found")

    # Prevent duplicate for same FY and period_code (ignore self)
    exists = db.query(SubmissionPeriod).filter(
        and_(
            SubmissionPeriod.fy_id == payload.fy_id,
            SubmissionPeriod.period_code == payload.period_code,
            SubmissionPeriod.id != submission_period_id
        )
    ).first()
    if exists:
        logger.warning(f"[UPDATE_SUBMISSION_PERIOD] Period '{payload.period_code}' already exists for FY")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Period '{payload.period_code}' already exists for this Financial Year"
        )

    for key, value in payload.dict().items():
        setattr(submission_period, key, value)

    db.commit()
    db.refresh(submission_period)
    logger.info("[UPDATE_SUBMISSION_PERIOD] Submission period updated successfully")
    return submission_period

# Delete submission period
@router.delete("/delete-submission-period/{submission_period_id}")
def delete_submission_period(submission_period_id: int, request: Request, db: Session = Depends(get_db)):
    logger.info("[DELETE_SUBMISSION_PERIOD] Request received")
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)
    submission_period = db.query(SubmissionPeriod).filter_by(id=submission_period_id).first()
    if not submission_period:
        logger.warning(f"[DELETE_SUBMISSION_PERIOD] Submission period not found with id: {submission_period_id}")
        raise HTTPException(status_code=404, detail="Submission period not found")
    
    db.delete(submission_period)
    db.commit()
    logger.info("[DELETE_SUBMISSION_PERIOD] Submission period deleted successfully")
    return {"detail": "Submission period deleted successfully"}
