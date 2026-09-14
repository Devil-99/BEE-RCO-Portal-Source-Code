from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import select, exists
from src.utils.TrackingRouter import TrackingRouter
from src.models import Organization_Option, Entity
from src.schemas.organization_option import OrganizationOptionBase, OrganizationOptionResponse
from src.database import get_db
from src.utils.security import verify_user_access


import logging
logger = logging.getLogger(__name__)

router = TrackingRouter(tags=["Organizations"])


@router.get("/get-organization_options", response_model=list[OrganizationOptionResponse])
def get_all_organizations(db: Session = Depends(get_db)):
    return db.query(Organization_Option).order_by(Organization_Option.organization_code).all()

@router.post("/create-organization_option", response_model=OrganizationOptionResponse)
def create_organization(
    request: Request,
    org: OrganizationOptionBase,
    db: Session = Depends(get_db)
):
    """
    Create a new organization option.
    Only admins can create.
    """
    # Admin check
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)

    # Check for existing organization_code
    existing_org = db.query(Organization_Option).filter(
        Organization_Option.organization_code == org.organization_code
    ).first()
    if existing_org:
        logger.warning(f"[CREATE_ORGANIZATION] Organization already exists with code: {org.organization_code}")
        raise HTTPException(status_code=400, detail="Organization already exists")

    # Ensure required fields are provided
    required_fields = ["entity_type", "state_code", "organization_name", "sector_type", "organization_code"]
    for field in required_fields:
        if not getattr(org, field):
            raise HTTPException(status_code=400, detail=f"{field} is required")

    # Create new organization
    try:
        new_org = Organization_Option(
            entity_type=org.entity_type,
            state_code=org.state_code,
            organization_name=org.organization_name,
            sector_type=org.sector_type,
            organization_code=org.organization_code,
            address=org.address
        )

        db.add(new_org)
        db.commit()
        db.refresh(new_org)

    except Exception as e:
        db.rollback()  # rollback on error
        logger.error("[CREATE_ORGANIZATION] Failed to create organization", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Something went wrong")

    logger.info("[CREATE_ORGANIZATION] Organization created successfully")
    return new_org


@router.put("/update-organization_option/{id}", response_model=OrganizationOptionResponse)
def update_organization(request: Request, id: UUID, org_update: OrganizationOptionBase, db: Session = Depends(get_db)):
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)
    org = db.query(Organization_Option).filter(Organization_Option.id == id).first()
    if not org:
        logger.warning(f"[UPDATE_ORGANIZATION] Organization not found with code: {org_code}")
        raise HTTPException(status_code=404, detail="Organization not found")

    existing_entity = db.scalar(
        select(exists().where(Entity.org_code == org_update.organization_code))
    )
    if existing_entity:
        raise HTTPException(status_code=400, detail="Organization code is already in use by an entity")

    org.entity_type = org_update.entity_type
    org.state_code = org_update.state_code
    org.organization_name = org_update.organization_name
    org.sector_type = org_update.sector_type
    org.organization_code = org_update.organization_code
    org.address = org_update.address

    db.commit()
    db.refresh(org)
    logger.info("[UPDATE_ORGANIZATION] Organization updated successfully")
    return org