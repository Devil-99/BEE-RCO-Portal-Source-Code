
from fastapi import Body, HTTPException, status, APIRouter, Depends, Request
from sqlalchemy.orm import Session
from src.utils.TrackingRouter import TrackingRouter
from src.database import SessionLocal
from src.schemas import TargetPercentageResponse
from src.models import TargetPercentage, State, RCOTargetCategory
from src.utils.enums import RCOSourceEnum
from typing import List, Dict, Any
from decimal import Decimal
from src.database import get_db
from sqlalchemy.exc import IntegrityError
from src.utils.security import verify_user_access

import logging
logger = logging.getLogger(__name__)

router = TrackingRouter(tags=["Form Fields"])

# Master access for Admin only.    
@router.get("/rco-targets/all", response_model=List[TargetPercentageResponse])
def get_all_target_percentages(request: Request, db: Session = Depends(get_db)):
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)
    rows = db.query(TargetPercentage).order_by(TargetPercentage.fy_id, TargetPercentage.category).all()
    return [
        TargetPercentageResponse(
            id=row.id,
            fy_id=row.fy_id,
            category=row.category,
            source=row.source,
            target_pct=float(row.target_pct)
        ) for row in rows
    ]

# Fetch RCO Target for a particular FY and State category
@router.get("/rco-targets", response_model=List[TargetPercentageResponse])
def get_target_percentages(fy_id: int, state: str, db: Session = Depends(get_db)):
    state_category = db.query(State.category).filter(State.state_code == state).scalar()
    
    rows = db.query(TargetPercentage).filter(
        TargetPercentage.category == state_category,
        TargetPercentage.fy_id == fy_id
    ).order_by(TargetPercentage.id).all()
   
    return [
        TargetPercentageResponse(
            id=getattr(row, 'id'),
            fy_id=getattr(row, 'fy_id'),
            category=getattr(row, 'category'),
            source=getattr(row, 'source'),
            target_pct=float(getattr(row, 'target_pct', 0.0))
        ) for row in rows
    ]


@router.post("/rco-targets/fy-{fy_id}", status_code=status.HTTP_201_CREATED)
def create_target_percentages(
    request: Request,
    fy_id: int,
    targets: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    logger.info("[CREATE_TARGET_PERCENTAGES] Request received")
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)
    valid_sources = ["Wind", "Hydro", "Distributed", "Others"]

    source_map = {
        "Wind": RCOSourceEnum.WIND,
        "Hydro": RCOSourceEnum.HYDRO,
        "Distributed": RCOSourceEnum.DISTRIBUTED,
        "Others": RCOSourceEnum.OTHERS,
    }

    category = targets.get("category")
    if not category:
        logger.warning("[CREATE_TARGET_PERCENTAGES] Category is required")
        raise HTTPException(status_code=400, detail="Category is required.")

    cat_exists = db.query(RCOTargetCategory).filter(RCOTargetCategory.category == category).first()
    if not cat_exists:
        logger.warning(f"[CREATE_TARGET_PERCENTAGES] Category '{category}' not found")
        raise HTTPException(status_code=400, detail=f"Category '{category}' not found.")

    for src in valid_sources:
        if src not in targets:
            logger.warning(f"[CREATE_TARGET_PERCENTAGES] Missing target value for '{src}'")
            raise HTTPException(status_code=400, detail=f"Missing target value for '{src}'")

    try:
        new_rows = []
        for src in valid_sources:
            row = TargetPercentage(
                category=category,
                fy_id=fy_id,
                source=source_map[src],
                target_pct=Decimal(str(targets[src]))
            )
            new_rows.append(row)

        db.add_all(new_rows)
        db.commit()

        logger.info(f"[CREATE_TARGET_PERCENTAGES] Targets saved for FY-{fy_id}")
        return {"message": f"Targets saved for FY-{fy_id}", "rows": len(new_rows)}

    except IntegrityError:
        db.rollback()
        logger.warning(f"[CREATE_TARGET_PERCENTAGES] Targets already exist for FY-{fy_id}, category '{category}'")
        raise HTTPException(
            status_code=400,
            detail=f"Targets already exist for FY-{fy_id}, category '{category}'."
        )

    except Exception as e:
        db.rollback()
        print("DB ERROR:", str(e))
        raise HTTPException(status_code=500, detail=f"Something went wrong")


@router.put("/update-target/fy-{fy_id}", status_code=status.HTTP_200_OK)
def update_target_percentages(
    request: Request,
    fy_id: int,
    targets: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    logger.info("[UPDATE_TARGET_PERCENTAGES] Request received")
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)
    valid_sources = ["Wind", "Hydro", "Distributed", "Others"]

    source_map = {
            "Wind": RCOSourceEnum.WIND,
            "Hydro": RCOSourceEnum.HYDRO,
            "Distributed": RCOSourceEnum.DISTRIBUTED,
            "Others": RCOSourceEnum.OTHERS,
        }

    category = targets.get("category")
    if not category:
        logger.warning("[UPDATE_TARGET_PERCENTAGES] Category is required")
        raise HTTPException(status_code=400, detail="Category is required.")

    for src in valid_sources:
        if src not in targets:
            logger.warning(f"[UPDATE_TARGET_PERCENTAGES] Missing target value for '{src}'")
            raise HTTPException(status_code=400, detail=f"Missing target value for '{src}'")

    try:
        existing_rows = {
            row.source: row
            for row in db.query(TargetPercentage).filter(
                TargetPercentage.fy_id == fy_id,
                TargetPercentage.category == category
            ).all()
        }
        if not existing_rows:
            logger.warning(f"[UPDATE_TARGET_PERCENTAGES] No targets found for FY-{fy_id}, category '{category}'")
            raise HTTPException(
                status_code=404,
                detail=f"No targets found for FY-{fy_id}, category '{category}'."
            )

        is_changed = False

        for src in valid_sources:
            source = source_map[src]
            row = existing_rows.get(source)
            incoming = Decimal(str(targets[src]))

            if row and row.target_pct != incoming:
                row.target_pct = incoming
                is_changed = True

        if not is_changed:
            logger.warning("[UPDATE_TARGET_PERCENTAGES] No changes detected")
            raise HTTPException(
                status_code=400,
                detail="No changes detected. Target values are already up to date."
            )

        db.commit()

        logger.info(f"[UPDATE_TARGET_PERCENTAGES] Targets updated for FY-{fy_id}, category '{category}'")
        return {"message": f"Targets updated for FY-{fy_id}, category '{category}'"}

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        print("DB ERROR:", str(e))
        raise HTTPException(status_code=500, detail=f"Something went wrong")
