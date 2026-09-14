from fastapi import HTTPException, status, Depends, Request
from sqlalchemy.orm import Session
from typing import List

from src.utils.TrackingRouter import TrackingRouter
from src.database import get_db
from src.models import RCOTargetCategory
from src.schemas.category import CategoryCreate, CategoryOut
from src.utils.security import verify_user_access

import logging
logger = logging.getLogger(__name__)

router = TrackingRouter(tags=["Categories"])


@router.get("/category-all", response_model=List[CategoryOut])
def get_all_categories(request: Request, db: Session = Depends(get_db)):
    access_roles = {"ADM"}
    verify_user_access(request, access_roles, db)

    categories = db.query(RCOTargetCategory).order_by(RCOTargetCategory.id).all()
    return categories

@router.post(
    "/categories/create",
    response_model=CategoryOut,
    status_code=status.HTTP_201_CREATED
)
def create_category(
    payload: CategoryCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    access_roles= {'ADM'}
    verify_user_access(request, access_roles, db)

    existing = (
        db.query(RCOTargetCategory)
        .filter(RCOTargetCategory.category == payload.category)
        .first()
    )

    if existing:
        logger.warning(f"[CREATE_CATEGORY] Category already exists: {payload.category}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{payload.category}' already exists."
        )

    try:
        category = RCOTargetCategory(
            category=payload.category.strip()
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        logger.info("[CREATE_CATEGORY] Category created successfully")
        return category

    except Exception:
        db.rollback()
        logger.error("[CREATE_CATEGORY] Failed to create category", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create category."
        )