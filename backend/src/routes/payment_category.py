from fastapi import APIRouter, HTTPException, Depends, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from src.utils.TrackingRouter import TrackingRouter
from src.database import get_db
from src.models import PaymentCategoryMaster, Entity
from src.schemas.payment_category_master import PaymentCategoryMasterCreate, PaymentCategoryMasterUpdate, PaymentCategoryMasterOut
from src.utils.enums import PaymentCategoryCodeEnum, EntityTypeEnum
from src.utils.security import verify_user_access

import logging
logger = logging.getLogger(__name__)

router = TrackingRouter(prefix="/payment-category", tags=["Payment Category"])


@router.post("/create", response_model=PaymentCategoryMasterOut, status_code=status.HTTP_201_CREATED)
def create_payment_category(
    payload: PaymentCategoryMasterCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)

    existing = db.query(PaymentCategoryMaster).filter(
        PaymentCategoryMaster.category_code == payload.category_code,
        PaymentCategoryMaster.fy_id == payload.fy_id,
        PaymentCategoryMaster.sector_type == payload.sector_type,
        PaymentCategoryMaster.entity_type == payload.entity_type
    ).first()
    if existing:
        logger.warning("[CREATE_PAYMENT_CATEGORY] Category already exists: %s", payload.category_code.value)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{payload.category_code.value}' already exists for this FY, sector, and entity type."
        )

    try:
        category = PaymentCategoryMaster(**payload.dict())
        db.add(category)
        db.commit()
        db.refresh(category)
        logger.info("[CREATE_PAYMENT_CATEGORY] Category created successfully: %s", category.id)
        return category
    except Exception:
        db.rollback()
        logger.error("Failed to create payment category", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create payment category.")

@router.get("/list", response_model=List[PaymentCategoryMasterOut])
def list_payment_categories(
    request: Request,
    db: Session = Depends(get_db)
):
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)

    return (
        db.query(PaymentCategoryMaster)
        .order_by(
            PaymentCategoryMaster.fy_id.desc(),
            PaymentCategoryMaster.category_code
        )
        .all()
    )

# Open endpoint for all users who make payment for registration before login
@router.get("/resolve-amount")
def resolve_amount(
    category_code: PaymentCategoryCodeEnum,
    entity_id: UUID,
    fy_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    entity_existance_check = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity_existance_check:
        raise HTTPException(
                status_code=403,
                detail="You are not authorized to access this data."
            )
    
    query = db.query(PaymentCategoryMaster).filter(
        PaymentCategoryMaster.category_code == category_code,
        PaymentCategoryMaster.is_active == True
    )

    # Registration
    if category_code == PaymentCategoryCodeEnum.REGISTRATION:
        query = query.filter(
            PaymentCategoryMaster.is_default == True
        )

    # Buyout
    elif category_code == PaymentCategoryCodeEnum.BUYOUT:
        if not fy_id:
            logger.warning("[RESOLVE_AMOUNT] Financial Year required for BUYOUT")
            raise HTTPException(
                status_code=400,
                detail="Financial Year is required for BUYOUT."
            )

        query = query.filter(
            PaymentCategoryMaster.fy_id == fy_id
        )

    result = query.first()

    if not result:
        logger.warning("[RESOLVE_AMOUNT] Payment category not found for: %s", category_code)
        raise HTTPException(
            status_code=404,
            detail="Payment category not found."
        )

    return {
        "amount": float(result.amount),
        "title": result.title,
        "is_default": result.is_default
    }

@router.put("/{category_id}", response_model=PaymentCategoryMasterOut)
def update_payment_category(
    category_id: int,
    payload: PaymentCategoryMasterUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)
    logger.info("[UPDATE_PAYMENT_CATEGORY] Update request received for category: %s", category_id)

    category = db.query(PaymentCategoryMaster).filter(PaymentCategoryMaster.id == category_id).first()
    if not category:
        logger.warning("[UPDATE_PAYMENT_CATEGORY] Category not found: %s", category_id)
        raise HTTPException(status_code=404, detail="Payment category not found.")

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)

    try:
        db.commit()
        db.refresh(category)
        logger.info("[UPDATE_PAYMENT_CATEGORY] Category %s updated successfully", category_id)
        return category
    except Exception:
        db.rollback()
        logger.error("Failed to update payment category", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update payment category.")
