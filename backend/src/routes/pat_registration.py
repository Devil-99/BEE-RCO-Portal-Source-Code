from fastapi import APIRouter, Depends, HTTPException, Request, status,Query
from sqlalchemy.orm import Session
from src.models.pat_registration import PatRegistration
from typing import List, Dict, Any
from src.database import get_db
from src.schemas import PatRegistrationCreate, PatRegistrationResponse, PatListResponse,PatRegistrationPaginatedResponse
from src.utils.TrackingRouter import TrackingRouter
from src.database import get_db
from src.utils.security import verify_user_access

import logging
logger = logging.getLogger(__name__)

router = TrackingRouter(tags=["PAT Registration"])

@router.post("/create-pat-registration", response_model=PatRegistrationResponse)
def create_registration(
    request: Request,
    data: PatRegistrationCreate,
    db: Session = Depends(get_db)
):
    # ---- Admin Check ----
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)


    required_fields = [
        "state_code",
        "sector_code",
        "registration_number",
        "organisation_name",
        "address",
        "plant_head_name",
        "plant_head_email"
    ]

    for field in required_fields:
        if not getattr(data, field):
            raise HTTPException(
                status_code=400,
                detail=f"{field.replace('_', ' ').title()} is required"
            )


    existing = db.query(PatRegistration).filter(
        PatRegistration.registration_number == data.registration_number
    ).first()

    if existing:
        logger.warning(f"[CREATE_PAT_REGISTRATION] Registration already exists with number: {data.registration_number}")
        raise HTTPException(
            status_code=400,
            detail="Registration with this registration_number already exists"
        )


    try:
        db_obj = PatRegistration(**data.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

    except Exception as e:
        db.rollback()
        logger.error("[CREATE_PAT_REGISTRATION] Failed to create PAT registration", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Something went wrong")

    logger.info("[CREATE_PAT_REGISTRATION] PAT registration created successfully")
    return db_obj

@router.get("/get-pat-registrations",
    response_model=PatRegistrationPaginatedResponse)     # 🆕 Added this
def list_registrations(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    # ---- Admin Check ----
    # access_roles= {"ADM"}
    # verify_user_access(request, access_roles, db)

    query = db.query(PatRegistration)

    total = query.count()

    offset = (page - 1) * page_size

    registrations = (
        query
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }

@router.get("/pat-registration/list", response_model=list[PatListResponse])
def list_registration_numbers(sectorType: str, db: Session = Depends(get_db)):
    results = db.query(PatRegistration.registration_number).filter(PatRegistration.sector_code == sectorType).all()
    return results

@router.get("/search-pat-registration/{reg_no}", response_model=PatRegistrationResponse)
def get_registration(reg_no: str, db: Session = Depends(get_db)):
    result = db.query(PatRegistration).filter(PatRegistration.registration_number == reg_no).first()
    if not result:
        logger.warning(f"[GET_PAT_REGISTRATION] PAT not found with registration number: {reg_no}")
        raise HTTPException(status_code=404, detail="PAT not found")
    return result

@router.put("/update-pat-registration/{reg_no}", response_model=PatRegistrationResponse)
def update_registration(request: Request, reg_no: str, data: Dict[str, Any], db: Session = Depends(get_db)):
    logger.info("[UPDATE_PAT_REGISTRATION] Request received")
    # Find by registration_number (was using reg_no attribute previously)
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)
    reg = db.query(PatRegistration).filter(PatRegistration.registration_number == reg_no).first()
    if not reg:
        logger.warning(f"[UPDATE_PAT_REGISTRATION] Registration not found with number: {reg_no}")
        raise HTTPException(status_code=404, detail="Registration not found")

    # Accept partial updates from the frontend (avoids 422 from Pydantic when registration_number is not sent)
    updatable_fields = {
        "organisation_name",
        "address",
        "plant_head_name",
        "telephone_number",
        "plant_head_email",
        "plant_head_recovery_email",
        "mobile_number",
        "sector_code",
        "state_code",
    }

    for key, value in data.items():
        if key in updatable_fields:
            setattr(reg, key, value)

    db.commit()
    db.refresh(reg)
    logger.info("[UPDATE_PAT_REGISTRATION] PAT registration updated successfully")
    return reg
