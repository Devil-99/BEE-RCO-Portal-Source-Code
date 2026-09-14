from fastapi import APIRouter, HTTPException, Depends, Request, status
from sqlalchemy.orm import Session
from src.utils.TrackingRouter import TrackingRouter
from src.models import Sectors
from src.schemas import SectorTypeBase, SectorTypeCreate, SectorTypeUpdate
from src.database import get_db
from src.utils.security import verify_user_access

import logging
logger = logging.getLogger(__name__)

router = TrackingRouter(tags=["Sectors"])

    
# Create
@router.post("/create-sector_type", response_model=SectorTypeBase)
def create_sector(
    request: Request, 
    sector: SectorTypeCreate, 
    db: Session = Depends(get_db)
):
    # Admin authentication
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)

    
    required_fields = ["sector_code", "sector_name", "entity_type"]
    for field in required_fields:
        if not getattr(sector, field):
            raise HTTPException(status_code=400, detail=f"{field} is required")

    
    existing_sector = db.query(Sectors).filter(
        Sectors.sector_code == sector.sector_code
    ).first()

    if existing_sector:
        logger.warning(f"[CREATE_SECTOR] Sector type already exists with code: {sector.sector_code}")
        raise HTTPException(
            status_code=400, 
            detail="Sector Type with this code already exists"
        )

    # ---- Create Sector ----
    try:
        new_sector = Sectors(**sector.dict())
        db.add(new_sector)
        db.commit()
        db.refresh(new_sector)

    except Exception as e:
        logger.error("[CREATE_SECTOR] Failed to create sector", exc_info=True)
        print(f"Error creating sector: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Something went wrong")

    logger.info("[CREATE_SECTOR] Sector created successfully")
    return new_sector


# Read All
@router.get("/get-sector_types", response_model=list[SectorTypeBase])
def get_all_sectors(db: Session = Depends(get_db)):
    return db.query(Sectors).order_by(Sectors.sector_code).all()

# Update
@router.put("/update-sector_type/{sector_code}", response_model=SectorTypeBase)
def update_sector(request: Request, sector_code: str, updates: SectorTypeUpdate, db: Session = Depends(get_db)):
    logger.info("[UPDATE_SECTOR] Request received")
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)
    sector = db.query(Sectors).filter(Sectors.sector_code == sector_code).first()
    if not sector:
        logger.warning(f"[UPDATE_SECTOR] Sector not found with code: {sector_code}")
        raise HTTPException(status_code=404, detail="Sector Type not found")

    for field, value in updates.dict(exclude_unset=True).items():
        setattr(sector, field, value)

    db.commit()
    db.refresh(sector)
    logger.info("[UPDATE_SECTOR] Sector updated successfully")
    return sector

