from math import ceil
import os
from datetime import datetime
from src.services.sms_service import sms_service
from fastapi import Depends, HTTPException, Form, UploadFile, File, Query, status, Request
from typing import Optional, List
from uuid import UUID
from sqlalchemy import or_, exists, func, case
from sqlalchemy.orm import Session
from src.utils.TrackingRouter import TrackingRouter
from src.models import Entity, User, Organization_Option, AEA, EntityFirmAuditorMapping
from src.schemas import RegisteredEntityUserOut, EntityDetailResponse
from src.utils.enums import EntityTypeEnum
from src.utils.validation import validate_file
from src.utils.security import verify_user_access
from src.database import get_db
from src.schemas.entity import DocumentApprovalUpdate, EntityListResponse, EntityOut, UpdateEntityRequest
from src.utils.user_generation import generateOrg_code, generateOrg_code, generate_registration_number, financial_year
from src.services.registration_service import _update_document_status, mark_payment
from src.services.storage_service import get_storage, StorageService

import logging
logger = logging.getLogger(__name__)

router = TrackingRouter( tags=["Entity"])

@router.post("/register")
def signup(
    organization_name: str = Form(..., max_length=100),
    entity_type: EntityTypeEnum = Form(...),
    state: str = Form(..., max_length=2),
    address: str = Form(..., max_length=255),
    sector_type: str = Form(..., max_length=4),
    is_pat: str = Form(..., max_length=4),
    pat_registration_number: Optional[str] = Form(None, max_length=50),
    doc_one: Optional[UploadFile] = File(None),
    doc_two: Optional[UploadFile] = File(None),
    other_doc: Optional[UploadFile] = File(None),
    contact_name: str = Form(..., max_length=100),
    designation: Optional[str] = Form(None, max_length=50),
    contact_number: str = Form(..., max_length=15),
    primary_email: str = Form(None, max_length=100),
    secondary_email: Optional[str] = Form(None),
    otp: Optional[str] = Form(None, max_length=6),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage)
):   
    # OTP bypass for PAT registered entities, as they are already verified by BEE
    if is_pat == 'Yes' and pat_registration_number is not None and otp is None:
        logger.info(f"[REGISTER] OTP verification bypassed for PAT registered entity: {pat_registration_number}")
        verified = True
    else:
        verified = sms_service.verify_otp(contact_number, otp)
        
    if not verified:
        logger.warning(f"[LOGIN] OTP verification failed for registration.")
        raise HTTPException(status_code=401, detail="Invalid OTP Provided")
    
    entity_type = entity_type.value
    required_fields = {
        "organization_name": organization_name,
        "entity_type": entity_type,
        "state": state,
        "address": address,
        "sector_type": sector_type,
        "contact_name": contact_name,
        "contact_number": contact_number,
        "primary_email": primary_email,
    }

    for name, value in required_fields.items():
        if value is None or str(value).strip() == "":
            logger.warning("[REGISTER] Missing required field: %s", name)
            raise HTTPException(
                status_code=400,
                detail=f"{name} is required"
            )
    if is_pat == 'No' and (entity_type == "DISCOM" or entity_type == "INDUSTRY"):
        if doc_one is None and doc_two is None:
            logger.warning("[REGISTER] Documents required for DISCOM/INDUSTRY without PAT")
            raise HTTPException(
                status_code=400, 
                detail="Documents are required"
            )
    try:
        # Organization name and code logic
        if entity_type == 'INDUSTRY' or len(organization_name) > 4:
            org_name = organization_name
            org_code = generateOrg_code(organization_name)
        else:
            org_name = db.query(Organization_Option.organization_name).filter(Organization_Option.organization_code == organization_name, Organization_Option.sector_type == sector_type).scalar()
            org_code = organization_name
        
        # Check for already registered Entity
        if pat_registration_number:
            existing_entity = db.query(Entity).filter(
                Entity.pat_reg_number == pat_registration_number
            ).first()
            
            if existing_entity:
                logger.warning("[REGISTER] Entity already exists with PAT: %s", pat_registration_number)
                raise HTTPException(status_code=400, detail=f"Entity already exists with ID: {existing_entity.id}")
        else:
            pat_registration_number = None
  
        # Check for already registered user with same email and contact number
        if db.query(User).filter(or_(User.mobile == contact_number, User.primary_email == primary_email)).first():
            logger.warning("[REGISTER] Contact number or email already exists")
            raise HTTPException(status_code=402, detail="Contact Number or Email already exists")

        registration_no = generate_registration_number(entity_type, org_code, state, sector_type, db)
        
        entity = Entity(
            entity_reg_no = registration_no,
            org_name=org_name,
            org_code=org_code,
            state_code=state,
            sector_code=sector_type,
            entity_type=entity_type,
            pat_reg_number = pat_registration_number,
            address=address,
            applicability_flag=True,
            registration_year = financial_year(),
            is_master=False,
            parent_entity_id=None,
            document_flag=0,
            payment_flag=False
        )

        # Validate file types + size
        if doc_one:
            validate_file(doc_one, 5)
        if doc_two:
            validate_file(doc_two, 5)
        if other_doc:
            validate_file(other_doc, 5)

        # Read file bytes before storing (StorageService expects bytes, not UploadFile)
        if doc_one:
            doc_one.file.seek(0)
            doc_one_bytes = doc_one.file.read()
            entity.doc_one = storage.save_file(doc_one_bytes, doc_one.filename)
        else:
            entity.doc_one = None

        if doc_two:
            doc_two.file.seek(0)
            doc_two_bytes = doc_two.file.read()
            entity.doc_two = storage.save_file(doc_two_bytes, doc_two.filename)
        else:
            entity.doc_two = None

        if other_doc:
            other_doc.file.seek(0)
            other_doc_bytes = other_doc.file.read()
            entity.other_doc = storage.save_file(other_doc_bytes, other_doc.filename)
        else:
            entity.other_doc = None

        db.add(entity)
        db.flush()

        code = "SLR"
        if entity_type == "NOBE":
            if sector_type == "SLDC":
                code = "SLDC"
            elif sector_type == "SDA":
                code = "SDA"
            elif sector_type == "MOP":
                code = "MOP"
            elif sector_type == "CORP":
                code = "CORP"
            else:
                code = "ADM"        

        user = User(
            full_name=contact_name,
            primary_email=primary_email,
            secondary_email=secondary_email,
            mobile=contact_number,
            entity_id=entity.id,
            designation=designation,
            role_code=code,
            applicable_fy=financial_year(),
            is_active=True
        )
         
        db.add(user)
        db.commit()
        db.refresh(user)
        
        response_message = f"Entity {org_name} registered successfully. "
        
        if (is_pat == "Yes" and pat_registration_number != ""):
            response = _update_document_status(
                entity_id=entity.id,
                document_flag=1,
                remarks="Registration through PAT number. Documents are validated and auto-approved",
                db=db
                )
        elif (entity_type == "NOBE" and (sector_type == "ADM" or sector_type == "MOP")):
            response = _update_document_status(
                entity_id=entity.id,
                document_flag=1,
                remarks="",
                db=db
                )
        else:
            response = {"message": "Registration pending approval from BEE.", "username": None}
            
        response_message += response.get("message", "")
        username_part = response.get("username", None)
         
        return {
            "message": response_message,
            "entity_id": entity.id,
            "username": username_part
        }

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        db.rollback()
        logger.error("Error during entity registration: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Something went wrong")


@router.post("/entity/document-status/{entity_id}")
def update_document_status(
    request: Request,
    entity_id: UUID,
    update: DocumentApprovalUpdate,
    db: Session = Depends(get_db)
):
    access_roles =  {"ADM"}
    verify_user_access(request, access_roles, db)

    return _update_document_status(
        entity_id=entity_id,
        document_flag=update.document_flag,
        remarks=update.remarks,
        db=db
    )

@router.get("/entity/get-review-comment")
def get_review_comment(
    entity_id: UUID,
    db: Session = Depends(get_db)
):
    entity_detail = db.query(Entity).filter(Entity.id == entity_id).first()

    if not entity_detail:
        logger.warning("[GET_REVIEW_COMMENT] Entity not found: %s", entity_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entity not found")
    
    return {
        "comment": entity_detail.remarks,
        "message": "Review message fetched successfully"
    }


@router.post("/make-payment/{user_id}")
def mark_payment_and_generate_reg(
    user_id: UUID,
    amount: int = 15000,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.warning("[MAKE_PAYMENT] User not found: %s", user_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    entity_id = user.entity_id

    combined_resp = mark_payment(entity_id, db, amount)

    response = {
        "message": combined_resp.get("message", ""),
        "entity_id": entity_id,
        "username": combined_resp.get("username", None)
    }

    return response

@router.get("/entities", response_model=EntityListResponse, status_code=status.HTTP_200_OK)
def get_all_entities(
    request: Request,
    page: int = Query(1, ge=1, description="Page number for pagination"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    document_flag: Optional[int] = Query(None, ge=0, le=2, description="Filter by document approval status"),
    payment_flag: Optional[bool] = Query(None, description="Filter by payment status"),
    org_name: Optional[str] = Query(None, description="Search by organization name"),
    username: Optional[str] = Query(None, description="Search by username"),
    pat_reg_number: Optional[str] = Query(None, description="Search by PAT registration number"),
    entity_reg_no: Optional[str] = Query(None, description="Search by entity registration number"),
    db: Session = Depends(get_db)
):
    access_roles = {"ADM"}
    verify_user_access(request, access_roles, db)

    user_subq = (
        db.query(
            User.id.label("user_id"),
            User.entity_id,
            User.primary_email.label("primary_email"),
            User.secondary_email.label("secondary_email"),
            User.mobile,
            User.full_name,
            User.username,
            func.row_number().over(
                partition_by=User.entity_id,
                order_by=User.created_at.asc()
            ).label("rn")
        ).subquery()
    )

    filters = []
    if entity_type:
        filters.append(Entity.entity_type == entity_type)
    if document_flag is not None:
        filters.append(Entity.document_flag == document_flag)
    if payment_flag is not None:
        filters.append(Entity.payment_flag.is_(payment_flag))
    if org_name and org_name.strip():
        search_term = f"%{org_name.strip().lower()}%"
        filters.append(func.lower(Entity.org_name).like(search_term))
    if username and username.strip():
        search_term = f"%{username.strip().lower()}%"
        filters.append(func.lower(user_subq.c.username).like(search_term))
    if pat_reg_number and pat_reg_number.strip():
        search_term = f"%{pat_reg_number.strip().lower()}%"
        filters.append(func.lower(Entity.pat_reg_number).like(search_term))
    if entity_reg_no and entity_reg_no.strip():
        search_term = f"%{entity_reg_no.strip().lower()}%"
        filters.append(func.lower(Entity.entity_reg_no).like(search_term))

    base_query = (
        db.query(
            Entity,
            user_subq.c.user_id,
            user_subq.c.primary_email,
            user_subq.c.secondary_email,
            user_subq.c.mobile,
            user_subq.c.full_name,
            user_subq.c.username
        )
        .outerjoin(user_subq, user_subq.c.entity_id == Entity.id)
        .filter(user_subq.c.rn == 1)
    )

    filtered_query = base_query
    if filters:
        filtered_query = filtered_query.filter(*filters)

    total_query = (
        db.query(Entity.id)
        .outerjoin(user_subq, user_subq.c.entity_id == Entity.id)
        .filter(user_subq.c.rn == 1)
    )
    if filters:
        total_query = total_query.filter(*filters)

    total = total_query.count()
    offset = (page - 1) * page_size

    query = (
        filtered_query
        .order_by(Entity.updated_at.desc(), Entity.created_at.desc())
        .limit(page_size)
        .offset(offset)
        .all()
    )

    results = [
        EntityOut(
            id=entity.id,
            user_id=user_id,
            entity_reg_no=entity.entity_reg_no,
            org_name=entity.org_name,
            state_code=entity.state_code,
            org_code=entity.org_code,
            sector_code=entity.sector_code,
            entity_type=entity.entity_type,
            pat_reg_number=entity.pat_reg_number,
            address=entity.address,
            registration_year=entity.registration_year,
            is_master=entity.is_master,
            doc_one=entity.doc_one,
            doc_two=entity.doc_two,
            other_doc=entity.other_doc,
            extra_docs=entity.extra_docs,
            payment_flag=entity.payment_flag,
            document_flag=entity.document_flag,
            remarks=entity.remarks,
            primary_email=primary_email,
            secondary_email=secondary_email,
            mobile=mobile,
            full_name=full_name,
            username=username,
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )
        for entity, user_id, primary_email, secondary_email, mobile, full_name, username in query
    ]

    total_pages = ceil(total / page_size) if total else 1

    return {
        "data": results,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
    }

@router.get("/get-entity-by-id", response_model = EntityDetailResponse, status_code=status.HTTP_200_OK)
def get_entity_by_id(request: Request, entity_id: UUID, db: Session = Depends(get_db)):
    user_role_code = request.state.role_code
    user_id = request.state.user_id
    user_entity_id = request.state.entity_id
    
    allowed = False
    
    # -----------------------------------------------------
    # Helper: Safe fetchers (prevent NoneType exceptions)
    # -----------------------------------------------------
    def get_entity_safe(_id):
        return db.query(Entity).filter(Entity.id == _id).first()
    
    def get_user_safe(_id):
        return db.query(User).filter(User.id == _id).first()
    
    # -----------------------------------------------------
    # Access Control Logic
    # -----------------------------------------------------
    if user_role_code in {"SLR", "USR"}:
        allowed = (str(entity_id) == user_entity_id)
    elif user_role_code in {"SLDC", "SDA"}:
        # Compare state_code of logged-in entity and requested entity
        logged_entity = get_entity_safe(user_entity_id)
        target_entity = get_entity_safe(entity_id)

        if logged_entity and target_entity:
            allowed = (logged_entity.state_code == target_entity.state_code)
    elif user_role_code == "AEA":
        logged_user = get_user_safe(user_id)
        if logged_user:
            aea_record = db.query(AEA).filter(AEA.aea_id == logged_user.username).first()
            if aea_record:
                allowed = db.query(
                    exists().where(
                        EntityFirmAuditorMapping.entity_id == entity_id,
                        EntityFirmAuditorMapping.auditor_id == aea_record.id
                    )
                ).scalar()

    elif user_role_code in {"ADM", "SNA", "SPA"}:
        allowed = True
          
    # -----------------------------------------------------
    # Access Denied
    # -----------------------------------------------------
    if not allowed:
        logger.warning("[GET_ENTITY_BY_ID] Access denied for user with role: %s", user_role_code)
        raise HTTPException(
            status_code=403,
            detail="Forbidden : You are not authorized to access this data."
        )
          
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    
    if not entity:
        logger.warning("[GET_ENTITY_BY_ID] Entity not found: %s", entity_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Entity not found with this id"
        )
    
    return entity

# Re-upload documents endpoint
# Not connected and final yet
@router.post("/entity/reupload-docs/{entity_id}", status_code=status.HTTP_200_OK)
async def reupload_rejected_documents(
    entity_id: UUID,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage)
):
    entity = db.query(Entity).filter(Entity.id == entity_id).first()

    if not entity:
        logger.warning("[REUPLOAD_DOCS] Entity not found: %s", entity_id)
        raise HTTPException(status_code=404, detail="Entity not found")
    
    # Validate uploaded files
    if not files or len(files) == 0:
        logger.warning("[REUPLOAD_DOCS] No files provided")
        raise HTTPException(status_code=400, detail="At least one document must be uploaded.")

    uploaded_paths = []

    try:
        if len(files) > 5 :
            logger.warning("[REUPLOAD_DOCS] Too many files uploaded: %d", len(files))
            raise HTTPException(status_code=400, detail="Too much files.(Limit 5)")

        for selectedFile in files:
            validate_file(selectedFile)
            selectedFile.file.seek(0)
            selectedFile_bytes = selectedFile.file.read()
            saved_file_path = storage.save_file(selectedFile_bytes, selectedFile.filename)
            uploaded_paths.append(saved_file_path)
    except Exception as e:
        logger.error("Registration document Re-Upload error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to upload documents.")

    # Merge with existing
    existing = entity.extra_docs or []
    entity.extra_docs = existing + uploaded_paths

    # Reset flag back to pending so admin can review again
    entity.document_flag = 0

    db.commit()
    db.refresh(entity)

    return {
        "message": "Documents re-uploaded successfully.",
        "files": uploaded_paths
    }


#update entity details 
@router.put("/entity/update/{id}")
def update_entity(
    id: UUID,
    payload: UpdateEntityRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        access_roles = {"ADM"}
        verify_user_access(request, access_roles, db)
       
        # fetching user to update based on id and then updating the details based on the payload received. 
        user = db.query(User).filter(User.id == id).first()

        if not user:
            logger.warning("[UPDATE_ENTITY] User not found: %s", id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Check duplicate credentials if exists.
        duplicate_user = (
            db.query(User)
            .filter(
                User.id != id,
                or_(
                    User.primary_email == payload.primary_email,
                    User.mobile == payload.mobile
                )
            )
            .first()
        )

        if duplicate_user:
            if (
                payload.primary_email is not None
                and duplicate_user.primary_email == payload.primary_email
            ):
                logger.warning("[UPDATE_ENTITY] Primary email already exists: %s", payload.primary_email)
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Primary email already exists."
                )

            if (
                payload.mobile is not None
                and duplicate_user.mobile == payload.mobile
            ):
                logger.warning("[UPDATE_ENTITY] Mobile number already exists: %s", payload.mobile)
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Mobile number already exists."
                )
            
        custom_message = "Details updated - "
        # user can update only one or more of these fields - full_name, primary_email, secondary_email, mobile
        if payload.full_name is not None:
            user.full_name = payload.full_name
            custom_message += "Name"

        if payload.primary_email is not None:
            user.primary_email = payload.primary_email
            custom_message += "Primary Email"

        if payload.secondary_email is not None:
            user.secondary_email = payload.secondary_email
            custom_message += "Secondary Email"

        if payload.mobile is not None:
            user.mobile = payload.mobile
            custom_message += "Mobile Number"

        db.commit()
        db.refresh(user)

        logger.info("[UPDATE_ENTITY] User %s updated successfully", id)
        return {
            "message": custom_message
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()
        logger.error("UPDATE ENTITY ERROR: %s", repr(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

# end point without pagination which will work in the entity tabs inside the user side bar page 
@router.get("/entities/all", response_model=List[EntityOut], status_code=status.HTTP_200_OK)
def get_all_entities_no_pagination(
    request: Request,
    db: Session = Depends(get_db)
):
    access_roles = {"ADM", "SNA", "SPA"}
    verify_user_access(request, access_roles, db)
    
    user_subq = (
        db.query(
            User.id.label("user_id"),
            User.entity_id,
            User.primary_email.label("primary_email"),
            User.secondary_email.label("secondary_email"),
            User.mobile,
            User.full_name,
            User.username,
            func.row_number().over(
                partition_by=User.entity_id,
                order_by=User.created_at.asc()
            ).label("rn")
        ).subquery()
    )

    query = (
        db.query(
            Entity,
            user_subq.c.user_id,
            user_subq.c.primary_email,
            user_subq.c.secondary_email,
            user_subq.c.mobile,
            user_subq.c.full_name,
            user_subq.c.username
        )
        .outerjoin(user_subq, user_subq.c.entity_id == Entity.id)
        .filter(user_subq.c.rn == 1)
        .order_by(Entity.updated_at.desc())
        .all()
    )

    results = [
        EntityOut(
            id=entity.id,
            user_id=user_id,
            entity_reg_no=entity.entity_reg_no,
            org_name=entity.org_name,
            state_code=entity.state_code,
            org_code=entity.org_code,
            sector_code=entity.sector_code,
            entity_type=entity.entity_type,
            pat_reg_number=entity.pat_reg_number,
            address=entity.address,
            registration_year=entity.registration_year,
            is_master=entity.is_master,
            doc_one=entity.doc_one,
            doc_two=entity.doc_two,
            other_doc=entity.other_doc,
            extra_docs=entity.extra_docs,
            payment_flag=entity.payment_flag,
            document_flag=entity.document_flag,
            remarks=entity.remarks,
            primary_email=primary_email,
            secondary_email=secondary_email,
            mobile=mobile,
            full_name=full_name,
            username=username,
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )
        for entity, user_id, primary_email, secondary_email, mobile, full_name, username in query
    ]

    return results

@router.get("/get-registered-entity-users", response_model=List[RegisteredEntityUserOut], status_code=status.HTTP_200_OK)
def get_all_registered_entity_users(
    request: Request,
    db: Session = Depends(get_db)
):
    access_roles = {"ADM", "SNA", "SPA"}
    verify_user_access(request, access_roles, db)

    query = (
        db.query(
            Entity.entity_reg_no,
            Entity.org_name,
            Entity.state_code,
            Entity.payment_flag,
            Entity.entity_type,

            User.role_code,
            User.username,
            User.full_name,
            User.mobile,
            User.primary_email,
            User.secondary_email,
        )
        .join(User, User.entity_id == Entity.id)
        .filter(
            Entity.payment_flag.is_(True),

            Entity.entity_type.in_([
                EntityTypeEnum.DISCOM,
                EntityTypeEnum.INDUSTRY,
            ]),

            User.role_code.in_(["SLR", "USR"]),

            User.username.isnot(None)
        )
        .order_by(
            Entity.updated_at.desc(),

            # Keep all users of one entity together
            Entity.id,

            # SLR first, then USRs
            case(
                (User.role_code == "SLR", 0),
                else_=1
            ),

            User.full_name.asc()
        )
        .all()
    )

    results = [
        RegisteredEntityUserOut(
            entity_reg_no=entity_reg_no,
            org_name=org_name,
            state_code=state_code,
            payment_flag=payment_flag,
            entity_type=entity_type,

            role=role_code,
            username=username,
            full_name=full_name,
            mobile=mobile,
            primary_email=primary_email,
            secondary_email=secondary_email,
        )
        for (
            entity_reg_no,
            org_name,
            state_code,
            payment_flag,
            entity_type,
            role_code,
            username,
            full_name,
            mobile,
            primary_email,
            secondary_email,
        ) in query
    ]

    return results

@router.get("/get-registered-nobe-users", response_model=List[RegisteredEntityUserOut], status_code=status.HTTP_200_OK)
def get_all_registered_nobe_users(
    request: Request,
    db: Session = Depends(get_db)
):
    access_roles = {"ADM", "SNA", "SPA"}
    verify_user_access(request, access_roles, db)

    query = (
        db.query(
            Entity.entity_reg_no,
            Entity.org_name,
            Entity.state_code,
            Entity.payment_flag,
            Entity.entity_type,

            User.role_code,
            User.username,
            User.full_name,
            User.mobile,
            User.primary_email,
            User.secondary_email,
        )
        .join(User, User.entity_id == Entity.id)
        .filter(
            Entity.payment_flag.is_(True),

            Entity.entity_type == EntityTypeEnum.NOBE,
            Entity.sector_code != 'FIRM',

            User.username.isnot(None)
        )
        .order_by(
            Entity.updated_at.desc(),
            Entity.id,
            User.role_code.asc(),
            User.full_name.asc()
        )
        .all()
    )

    results = [
        RegisteredEntityUserOut(
            entity_reg_no=entity_reg_no,
            org_name=org_name,
            state_code=state_code,
            payment_flag=payment_flag,
            entity_type=entity_type,

            role=role_code,
            username=username,
            full_name=full_name,
            mobile=mobile,
            primary_email=primary_email,
            secondary_email=secondary_email,
        )
        for (
            entity_reg_no,
            org_name,
            state_code,
            payment_flag,
            entity_type,
            role_code,
            username,
            full_name,
            mobile,
            primary_email,
            secondary_email,
        ) in query
    ]

    return results