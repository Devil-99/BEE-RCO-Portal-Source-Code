from typing import List
from uuid import UUID
from src.services.sms_service import sms_service
from fastapi import APIRouter, Depends, HTTPException, Request, Query, Body, status
from src.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError
from src.models import User, Entity, EnergyManagerMaster, Role
from src.schemas import user_response, add_user_request, update_user_request, track_status_response, energy_manager_response, create_energy_manager_request, update_energy_manager_request, energy_manager_paginated_response
from src.utils.security import hash_password, generate_password, verify_user_access
from src.utils.user_generation import generate_username, financial_year
from src.utils.TrackingRouter import TrackingRouter

import logging
logger = logging.getLogger(__name__)

router = TrackingRouter(tags=["Users"])

@router.get("/get-user-list", response_model=List[user_response], response_model_exclude_none=True)
def get_admin_user_list(
    request: Request,
    db: Session = Depends(get_db)
):
    role_code = request.state.role_code
    entity_id = request.state.entity_id
    user_id = request.state.user_id
    
    if role_code == "SLR" or role_code == "USR":
        users = (
            db.query(User, Role.role_name)
                .join(Role, User.role_code == Role.role_code)
                .filter(User.entity_id == entity_id)
                .all()
        )
    elif role_code == 'ADM': 
        users = (
            db.query(User, Role.role_name)
                .join(Role, User.role_code == Role.role_code)
                .filter(User.role_code.in_(['ADM', 'SPA', 'SNA']))
                .all()
        )
    else:
        logger.warning("[GET_USER_LIST] Access forbidden for role: %s", role_code)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden : You are not authorized to access this data.")

    if not users:
        logger.warning("[GET_USER_LIST] No users found")
        raise HTTPException(status_code=404, detail="No admin users found")

    response = []
    for user, role_name in users:
        response.append({
            "username": user.username,
            "full_name": user.full_name,
            "mobile": user.mobile,
            "primary_email": user.primary_email,
            "secondary_email": user.secondary_email,
            "role_name": role_name,
            "designation": user.designation,
            "id": user.id
        })
        
    return response

@router.post("/create-user", status_code=status.HTTP_201_CREATED)
def create_user(request: Request , Payload: add_user_request, db: Session = Depends(get_db)):
    try:
        entity_id = request.state.entity_id
        role_code = request.state.role_code
        authorized = False
        
        access_roles = {"SLR", "ADM"}
        verify_user_access(request, access_roles, db)
       
        if role_code == "SLR" and entity_id is not None and Payload.role_code == "USR":
            authorized = True
        if role_code == "ADM" and entity_id is not None and Payload.role_code in ["ADM", "SPA", "SNA"]:
            authorized = True
            
        if not authorized:
            logger.warning("[CREATE_USER] Not authorized to perform this action")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden : You are not authorized to perform this action.")
        
        existing_user = db.query(User).filter(
            or_(
                User.primary_email == Payload.primary_email,
                User.mobile == Payload.mobile
            )
        ).first()

        if existing_user:
            logger.warning("[CREATE_USER] User with this email or mobile already exists")
            raise HTTPException(status_code=400, detail="User with this email or mobile number already exists")

        entity = db.query(Entity).filter(Entity.id == entity_id).first()

        if not entity:
            logger.warning("[CREATE_USER] Entity not found: %s", entity_id)
            raise HTTPException(status_code=404, detail="Entity not found")
        
        generated_password = generate_password(8)
        hashed_password = hash_password(generated_password)
        final_username = generate_username(entity, Payload, db)
        
        new_user = User(
            username=final_username,
            password_hash=hashed_password,
            full_name=Payload.full_name,
            primary_email=Payload.primary_email,
            secondary_email = Payload.secondary_email,
            mobile=Payload.mobile,
            designation=Payload.designation,
            role_code=Payload.role_code,
            applicable_fy=financial_year(),
            entity_id=entity_id,
            is_active=True
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        
        name = new_user.full_name if new_user.full_name else "User"
        mobile = new_user.mobile
        entity_reg_no = entity.entity_reg_no
        username = new_user.username
        password = generated_password

        context = { "var" : [name, entity_reg_no, username, password]}
        sms_service.send_template('energy_manager_creation', mobile, context, db)

        logger.info("[CREATE_USER] User created successfully: %s", final_username)
        return {
            "message": "User added successfully and Password sent via SMS"
        }
    except HTTPException:
        # Re-raise FastAPI handled exceptions
        raise
    except SQLAlchemyError as e:
        db.rollback()
        print("Database error in Energy Manager creation:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Database error while creating Energy Manager"
        )

    except Exception as e:
        db.rollback()
        logger.error("Unexpected error in Energy Manager creation: %s", str(e), exc_info=True)

        raise HTTPException(
            status_code=500,
            detail="Unexpected error in Energy Manager creation"
        )

@router.put("/update-user/{user_id}", status_code=status.HTTP_200_OK)
def update_user(
    request: Request,
    user_id: UUID,
    Payload: update_user_request,
    db: Session = Depends(get_db)
):
    role_code = request.state.role_code
    access_roles = {"SLR", "ADM"}
    verify_user_access(request, access_roles, db)

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    permission = False

    if role_code == "SLR":
        if user.role_code == "USR" or str(user.entity_id) == request.state.entity_id:
            permission = True
    elif role_code == "ADM":
        if user.role_code == "AEA":
            permission = True

    if not permission:
        raise HTTPException(status_code=403, detail="Forbidden: You are not authorized to update this user")

    # Update user details
    user.primary_email = Payload.primary_email
    user.secondary_email = Payload.secondary_email
    user.mobile = Payload.mobile

    db.commit()
    db.refresh(user)

    return {
        "message": "User updated successfully"
    }

@router.get("/track-status", response_model=track_status_response)
def track_status(
    mobile: str = Query(..., min_length = 10, max_length=10, description="Mobile number of the user"),
    otp: str = Query(..., min_length = 6, max_length = 6),
    db: Session = Depends(get_db)
):
    try:
        otp_verified = sms_service.verify_otp(mobile, otp)
        if otp_verified :
            user = db.query(User).filter(User.mobile == mobile).first()
            if not user:
                logger.warning("[TRACK_STATUS] User not found for mobile: %s", mobile)
                raise HTTPException(status_code=404, detail="User with this mobile number not found")
            entity = db.query(Entity).filter(Entity.id == user.entity_id).first()
            if not entity:
                logger.warning("[TRACK_STATUS] Associated entity not found for user: %s", user.id)
                raise HTTPException(status_code=404, detail="Associated entity not found")

            return {
                "entity_id": entity.id,
                "user_id": user.id,
                "entity_type": entity.entity_type,
                "sector_type": entity.sector_code,
                "username": user.username if user.username else "",
                "payment_flag": entity.payment_flag,
                "document_flag": entity.document_flag,
                "created_at": entity.created_at,
                "updated_at": entity.updated_at
            }
            
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error("[TRACK_STATUS] Error fetching track status", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error")

# Router for search energy managers by registration number
@router.get("/energy-managers/search/", response_model=List[energy_manager_response])
def search_energy_managers(
    request: Request,
    registration_number: str = Query(..., description="Registration number to search for"),
    db: Session = Depends(get_db)
):
    access_roles = {"SLR"}
    verify_user_access(request, access_roles, db)
    energy_managers = db.query(EnergyManagerMaster).filter(
        EnergyManagerMaster.registration_number.ilike(f"%{registration_number}%")
    ).all()
    return energy_managers


@router.get(
    "/admin/energy-managers",
    response_model=energy_manager_paginated_response
)
def get_energy_manager(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    search: str = Query(default=None, description="Search by name or registration number"),
    db: Session = Depends(get_db),
):
    access_roles = {"ADM"}
    verify_user_access(request, access_roles, db)

    query = db.query(EnergyManagerMaster)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                EnergyManagerMaster.name.ilike(pattern),
                EnergyManagerMaster.registration_number.ilike(pattern),
            )
        )

    total = query.count()

    offset = (page - 1) * page_size

    energy_managers = (
        query
        .order_by(EnergyManagerMaster.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return {
        "items": [
            {
                "registration_number": em.registration_number,
                "name": em.name,
            }
            for em in energy_managers
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }

@router.post("/admin/energy-manager", status_code=status.HTTP_201_CREATED, response_model=energy_manager_response)
def create_energy_manager(
    request: Request,
    payload: create_energy_manager_request,
    db: Session = Depends(get_db)
):
    logger.info("[CREATE_ENERGY_MANAGER] Request received")
    access_roles = {"ADM"}
    verify_user_access(request, access_roles, db)

    existing = db.query(EnergyManagerMaster).filter(
        EnergyManagerMaster.registration_number == payload.registration_number
    ).first()
    if existing:
        logger.warning("[CREATE_ENERGY_MANAGER] Energy manager already exists: %s", payload.registration_number)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Energy manager with this registration number already exists.")

    new_em = EnergyManagerMaster(
        registration_number=payload.registration_number,
        name=payload.name
    )
    db.add(new_em)
    db.commit()
    db.refresh(new_em)
    logger.info("[CREATE_ENERGY_MANAGER] Energy manager created successfully: %s", new_em.registration_number)
    return new_em


@router.put("/admin/energy-manager/{registration_number:path}", response_model=energy_manager_response)
def update_energy_manager(
    request: Request,
    registration_number: str,
    payload: update_energy_manager_request,
    db: Session = Depends(get_db)
):
    logger.info("[UPDATE_ENERGY_MANAGER] Request received")
    access_roles = {"ADM"}
    verify_user_access(request, access_roles, db)

    em = db.query(EnergyManagerMaster).filter(
        EnergyManagerMaster.registration_number == registration_number
    ).first()
    if not em:
        logger.warning(f"[UPDATE_ENERGY_MANAGER] Energy manager not found with registration number: {registration_number}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Energy manager not found.")

    em.name = payload.name
    db.commit()
    db.refresh(em)
    logger.info("[UPDATE_ENERGY_MANAGER] Energy manager %s updated successfully", registration_number)
    return em