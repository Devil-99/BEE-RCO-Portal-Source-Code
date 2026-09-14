from typing import List, Optional
from src.services.sms_service import sms_service
from fastapi import APIRouter, Depends, HTTPException, status, Query , Request, UploadFile, File
from sqlalchemy.orm import Session
from src.models import AEA , User, FirmAuditorMapping, Firm, EntityFirmAuditorMapping, Entity, User
from src.schemas import AEAResponse, RegisteredAEAResponse, AEARegisterRequest, AEAUpdateRequest, AEACreateRequest, AuditorFirmMappingRequest, MappedFirmResponse, MappedAeaResponse, EntityAuditorFirmMappingRequest, ApproveAuditorRequest, MappedEntityResponse
from src.utils.security import hash_password, generate_password, verify_user_access
from datetime import datetime
from sqlalchemy import or_
from src.utils.TrackingRouter import TrackingRouter
from src.utils.excel_upload import (
    clean_string,
    parse_excel_date,
    read_excel_upload,
    map_excel_row,
    raise_validation_errors,
)
from src.database import get_db

import logging
logger = logging.getLogger(__name__)

router = TrackingRouter( tags=["Audits"])

# Get all aea list      
@router.get("/get-aeas", response_model=List[AEAResponse])
def get_user(
    request : Request ,
    aea_id: Optional[str] = Query(None, description="Filter users by aea_id"),
    db: Session = Depends(get_db)
):
    access_roles ={"ADM"}
    verify_user_access(request,access_roles, db)
    if aea_id is not None:
        aeas = db.query(AEA).filter(AEA.aea_id == aea_id).all()
    else:
        aeas = db.query(AEA).all()
    return aeas

# Get registered aea list
@router.get("/get-registered-aeas", response_model=List[RegisteredAEAResponse])
def get_registered_aeas(
    request: Request,
    db: Session = Depends(get_db)
):
    role_code = request.state.role_code
    if( role_code not in {"ADM", "SNA", "SPA"}):
        logger.warning("[GET_REGISTERED_AEAS] Access forbidden: Admins only")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admins only"
        )
    
    aeas = db.query(AEA.aea_id, User.id, User.full_name, User.primary_email, User.mobile, User.updated_at).join(AEA, User.username == AEA.aea_id).all()
    
    return aeas

# search by aea_id
@router.get("/search-aea-by-id", response_model=AEAResponse)
def search_Aea_by_id(aea_id: str,db: Session = Depends(get_db)):
    aea = db.query(AEA).filter(AEA.aea_id == aea_id).first()
    if not aea:
        logger.warning(f"[SEARCH_AEA_BY_ID] AEA not found: {aea_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="aea_id does not exist")
    return aea

@router.get("/aea/mapped-firms", response_model=List[MappedFirmResponse])
def get_mapped_firms(
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        # Step 1: Get logged-in user
        user = db.query(User).filter(User.id == request.state.user_id).first()

        if not user:
            logger.warning("[GET_MAPPED_FIRMS] User not found")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User not found"
            )

        # Step 2: Extract AEA NAME from username
        aea_name = user.username   # This is string

        # Step 3: Find AEA record by aea_name
        auditor = db.query(AEA).filter(AEA.aea_id == aea_name).first()

        if not auditor:
            logger.warning("[GET_MAPPED_FIRMS] Auditor (AEA) not found")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Auditor (AEA) not found"
            )

        # Step 4: Fetch mapped firms using auditor.id or auditor.aea_id?
        firms = (
            db.query(Firm.firm_name, FirmAuditorMapping.status)
            .join(FirmAuditorMapping, Firm.firm_id == FirmAuditorMapping.firm_id)
            .filter(FirmAuditorMapping.auditor_id == auditor.id)   # or auditor.aea_id
            .all()
        )

        return [
            MappedFirmResponse(firm_name=name, status=status)
            for name, status in firms
        ]

    except Exception as e:
        logger.error("[GET_MAPPED_FIRMS] Failed to fetch mapped firms", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post("/aea/approve-auditor", status_code=status.HTTP_200_OK)
def approve_auditor(request: Request, payload: ApproveAuditorRequest, db: Session = Depends(get_db)):
    logger.info("[APPROVE_AUDITOR] Request received")
    if request.state.role_code != "FIRM":
        logger.warning("[APPROVE_AUDITOR] Forbidden - not authorized")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden : You are not authorized to perform this action.")
    
    entity_id = request.state.entity_id
    user_id = request.state.user_id
    
    entity = db.query(Entity).filter(Entity.id == entity_id, Entity.payment_flag==True).first()
    if not entity:
        logger.warning("[APPROVE_AUDITOR] Entity not found")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Entity not found"
        )

    def get_auditor_id(_id):
        return db.query(AEA).filter(AEA.aea_id == _id).first()
    
    def get_audit_firm_id(_name):
        return db.query(Firm).filter(Firm.firm_name == _name).first()
    
    target_auditor = get_auditor_id(payload.auditor_id)
    logged_audit_firm = get_audit_firm_id(entity.org_name)
        
    mapping = db.query(FirmAuditorMapping).filter(
        FirmAuditorMapping.auditor_id == target_auditor.id,
        FirmAuditorMapping.firm_id == logged_audit_firm.firm_id
    ).first()
    
    if not mapping:
        logger.warning("[APPROVE_AUDITOR] Mapping between Auditor and Firm not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mapping between Auditor and Firm not found"
        )
        
    if mapping.status:
        logger.warning("[APPROVE_AUDITOR] Auditor already approved for this firm")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Auditor is already approved for this firm"
        )
    
    mapping.reviewed_by = user_id
    mapping.approved_at = datetime.now()
    mapping.status = True
    db.commit()
    
    logger.info(f"[APPROVE_AUDITOR] Auditor {payload.auditor_id} approved for firm {entity.org_name}")
    return {"message": f"Auditor {payload.auditor_id} approved for firm {entity.org_name}"}

@router.post("/aea/reject-auditor",status_code = status.HTTP_200_OK)
def reject_editor(request: Request, payload: ApproveAuditorRequest, db:Session = Depends(get_db)):
    logger.info("[REJECT_AUDITOR] Request received")
    if request.state.role_code != "FIRM":
        logger.warning("[REJECT_AUDITOR] Forbidden - not authorized")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden : You are not authorized to perform this action.")
    
    entity_id = request.state.entity_id
    user_id = request.state.user_id
    
    entity = db.query(Entity).filter(Entity.id == entity_id, Entity.payment_flag==True).first()
    if not entity:
        logger.warning("[REJECT_AUDITOR] Entity not found")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Entity not found"
        )

    def get_auditor_id(_id):
        return db.query(AEA).filter(AEA.aea_id == _id).first()
    
    def get_audit_firm_id(_name):
        return db.query(Firm).filter(Firm.firm_name == _name).first()
    
    target_auditor = get_auditor_id(payload.auditor_id)
    logged_audit_firm = get_audit_firm_id(entity.org_name)
        
    mapping = db.query(FirmAuditorMapping).filter(
        FirmAuditorMapping.auditor_id == target_auditor.id,
        FirmAuditorMapping.firm_id == logged_audit_firm.firm_id
    ).first()
    
    if not mapping:
        logger.warning("[REJECT_AUDITOR] Mapping between Auditor and Firm not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mapping between Auditor and Firm not found"
        )
    
    db.delete(mapping)  
    db.commit()
    
    logger.info(f"[REJECT_AUDITOR] Auditor {payload.auditor_id} rejected for firm {entity.org_name}")
    return {"message": f"Auditor {payload.auditor_id} rejected for firm {entity.org_name}"}

@router.get("/aea/mapped-aeas", response_model=List[MappedAeaResponse], status_code=status.HTTP_200_OK)
def get_aeas_by_firm_id(request: Request, db: Session = Depends(get_db)):
    entity = db.query(Entity).filter(Entity.id == request.state.entity_id).first()

    if not entity:
        logger.warning("[GET_AEAS_BY_FIRM_ID] Entity not found")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Entity not found"
        )

    # Step 2: Extract AEA NAME from username
    firm_name = entity.org_name   # This is string

    firm = db.query(Firm).filter(Firm.firm_name == firm_name).first()
    
    if not firm:
        logger.warning("[GET_AEAS_BY_FIRM_ID] Firm not found")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Firm not found")
    
    aea_list = (
        db.query(
            AEA.id,
            AEA.aea_id,
            AEA.full_name,
            FirmAuditorMapping.status
        )
        .join(FirmAuditorMapping, FirmAuditorMapping.auditor_id == AEA.id)
        .filter(FirmAuditorMapping.firm_id == firm.firm_id)
        .all()
    )
    
    return [
        MappedAeaResponse(id=id_, aea_id=aea_id, full_name=full_name, status=status)
        for id_, aea_id, full_name, status in aea_list
    ]
    
@router.get("/aea/mapped-entities", response_model=List[MappedEntityResponse], status_code=status.HTTP_200_OK)
def get_entites_by_aea_id(request: Request ,  db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.state.user_id).first()
    if not user:
            logger.warning("[GET_ENTITIES_BY_AEA_ID] User not found")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User not found"
            )

        # Step 2: Extract AEA NAME from username
    aea_name = user.username   # This is string

        # Step 3: Find AEA record by aea_name
    auditor = db.query(AEA).filter(AEA.aea_id == aea_name).first()
    if not auditor:
        logger.warning("[GET_ENTITIES_BY_AEA_ID] Auditor not found")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Auditor not found with this id"
        )
    entities = (
            db.query(
                Entity.id.label("id"),
                Entity.entity_reg_no.label("entity_reg_no"),
                Entity.org_name.label("entity_name"),
                Entity.entity_type.label("entity_type"),
                EntityFirmAuditorMapping.fy.label("fy_id")
            )
            .join(EntityFirmAuditorMapping, EntityFirmAuditorMapping.entity_id == Entity.id)
            .filter(EntityFirmAuditorMapping.auditor_id == auditor.id)
            .all()
        )
    
    return entities


## ADMIN ROLE NEEDED ##
@router.post("/aea/create-aea", response_model=AEAResponse, status_code=status.HTTP_201_CREATED)
def create_aea(
    request: Request, 
    Payload: AEACreateRequest, 
    db: Session = Depends(get_db)
):
    logger.info("[CREATE_AEA] Request received")
    # ---- Admin Check ----
    access_roles ={"ADM"}
    verify_user_access(request, access_roles, db)
    
    required_fields = ["aea_id", "full_name", "email", "valid_from"]
    for field in required_fields:
        if not getattr(Payload, field):
            raise HTTPException(
                status_code=400, 
                detail=f"{field.replace('_', ' ').title()} is required"
            )

    
    if db.query(AEA).filter(AEA.aea_id == Payload.aea_id).first():
        logger.warning(f"[CREATE_AEA] AEA with this ID already exists: {Payload.aea_id}")
        raise HTTPException(status_code=400, detail="AEA with this ID already exists")
    if db.query(AEA).filter(AEA.email == Payload.email).first():
        logger.warning(f"[CREATE_AEA] AEA with this email already exists: {Payload.email}")
        raise HTTPException(status_code=400, detail="AEA with this email already exists")
    if Payload.mobile and db.query(AEA).filter(AEA.mobile == Payload.mobile).first():
        logger.warning(f"[CREATE_AEA] AEA with this mobile already exists: {Payload.mobile}")
        raise HTTPException(status_code=400, detail="AEA with this mobile already exists")

    
    try:
        new_aea = AEA(
            aea_id=Payload.aea_id,
            full_name=Payload.full_name,
            email=Payload.email,
            mobile=Payload.mobile,
            valid_from=Payload.valid_from,
            valid_to=Payload.valid_to,
            source_type=Payload.source_type,
            is_active=True
        )
        db.add(new_aea)
        db.commit()
        db.refresh(new_aea)

    except Exception as e:
        db.rollback()
        logger.error("[CREATE_AEA] Failed to create AEA", exc_info=True)
        print(e)
        raise HTTPException(status_code=500, detail=f"")

    logger.info("[CREATE_AEA] AEA created successfully")
    return new_aea


@router.put("/aea/update-aea", response_model=AEAResponse)
def update_aea(request_data: AEAUpdateRequest, db: Session = Depends(get_db), request: Request = None):
    logger.info("[UPDATE_AEA] Request received")
    # Check role
    access_roles ={"ADM"}
    verify_user_access(request, access_roles, db)
    # Fetch AEA by aea_id
    aea = db.query(AEA).filter(AEA.aea_id == request_data.aea_id).first()
    if not aea:
        logger.warning(f"[UPDATE_AEA] AEA not found: {request_data.aea_id}")
        raise HTTPException(status_code=404, detail="AEA not found")

    # Email/mobile conflicts
    if request_data.email != aea.email:
        if db.query(AEA).filter(AEA.email == request_data.email).first():
            logger.warning(f"[UPDATE_AEA] Another AEA with this email exists: {request_data.email}")
            raise HTTPException(status_code=400, detail="Another AEA with this email exists")
    if request_data.mobile != aea.mobile:
        if db.query(AEA).filter(AEA.mobile == request_data.mobile).first():
            logger.warning(f"[UPDATE_AEA] Another AEA with this mobile exists: {request_data.mobile}")
            raise HTTPException(status_code=400, detail="Another AEA with this mobile exists")

    # Update fields
    aea.full_name = request_data.full_name
    aea.email = request_data.email
    aea.mobile = request_data.mobile
    aea.valid_from = request_data.valid_from
    aea.valid_to = request_data.valid_to
    aea.source_type = request_data.source_type
    aea.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(aea)

    # Update linked User record
    user = db.query(User).filter(User.username == request_data.aea_id).first()
    if user:
        user.full_name = request_data.full_name
        user.primary_email = request_data.email
        user.mobile = request_data.mobile
        db.commit()
        db.refresh(user)

    logger.info("[UPDATE_AEA] AEA updated successfully")
    return aea

        

@router.delete("/aea/delete-aea", status_code=status.HTTP_200_OK)
def delete_aea(request : Request, db: Session = Depends(get_db)):
 logger.info("[DELETE_AEA] Request received")
 if request.state.role_code == "ADM":
    aea = db.query(AEA).filter(AEA.aea_id == request.aea_id).first()
    if not aea:
        logger.warning(f"[DELETE_AEA] AEA not found: {request.aea_id}")
        raise HTTPException(status_code=404, detail="AEA not found")

    db.delete(aea)
    db.commit()
    logger.info(f"[DELETE_AEA] AEA with ID {request.aea_id} deleted successfully")
    return {"detail": f"AEA with ID {request.aea_id} deleted successfully"}
 else :   
     logger.warning("[DELETE_AEA] Forbidden - not authorized")
     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden : You are not authorized to perform this action.")

@router.post("/aea/register", status_code = status.HTTP_201_CREATED)
def add_user(request: AEARegisterRequest, db: Session = Depends(get_db)):
    sms_service.verify_otp(request.mobile, request.otp)

    aea_exists = db.query(AEA).filter(AEA.aea_id == request.aea_id).first()
    if not aea_exists:
        logger.warning(f"[REGISTER_AEA] Energy Manager ID does not exist: {request.aea_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Energy Manager ID does not exists")
    
    existing_aea_id = db.query(User).filter(User.username == request.aea_id).first()
    if existing_aea_id:
        logger.warning(f"[REGISTER_AEA] AEA with this ID already exists: {request.aea_id}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="AEA with this ID already exists")
    
    existing_user = db.query(User).filter(or_(User.primary_email == request.email , User.mobile == request.mobile)).first()
    if existing_user:
        logger.warning(f"[REGISTER_AEA] User with this mobile/email already exists: {request.email}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User with this mobile/email already exists")

    generated_password = generate_password(8)
    hashed_password = hash_password(generated_password)
    
    new_user = User(
        username=request.aea_id,
        password_hash=hashed_password,
        full_name=request.full_name,
        primary_email=request.email,
        mobile=request.mobile,
        designation="Accredited Energy Auditor",
        role_code="AEA",
        applicable_fy=str(datetime.now().year)[-2:],
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    context = {"var": [request.full_name, " ", request.aea_id, generated_password]}
    sms_service.send_template('login_credentials', request.mobile, context, db)

    logger.info("[REGISTER_AEA] AEA registered successfully")
    return {
        "message": "Accredited Energy Auditor registered successfully.",
        "username": new_user.username,
        "user_id": new_user.id
    }
    
@router.post("/aea/auditor-firm-mapping", status_code=status.HTTP_201_CREATED)
def auditor_firm_mapping(request: Request , Payload : AuditorFirmMappingRequest, db: Session = Depends(get_db)):
    logger.info("[AUDITOR_FIRM_MAPPING] Request received")
    if request.state.role_code != 'AEA':
        logger.warning("[AUDITOR_FIRM_MAPPING] Forbidden - not authorized")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden : You are not authorized to perform this action.")
     
    user = db.query(User).filter(User.id == request.state.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )

        # Step 2: Extract AEA NAME from username
    aea_name = user.username   # This is string

        # Step 3: Find AEA record by aea_name
    auditor = db.query(AEA).filter(AEA.aea_id == aea_name).first()

    if not auditor:
        logger.warning("[AUDITOR_FIRM_MAPPING] Auditor not found")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Auditor not found with this id"
        )
        
    existing_firm = db.query(FirmAuditorMapping).filter(FirmAuditorMapping.firm_id==Payload.firm_id , FirmAuditorMapping.auditor_id == auditor.id).first()

    if existing_firm :
        logger.warning("[AUDITOR_FIRM_MAPPING] This Firm is already mapped with this Auditor")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This Firm is already mapped with this Auditor."
        )
        
    new_firm_entity = FirmAuditorMapping(
        auditor_id = auditor.id,
        firm_id = Payload.firm_id
    )
    
    db.add(new_firm_entity)
    db.commit()

    logger.info("[AUDITOR_FIRM_MAPPING] Auditor firm mapping created successfully")
    return {"message":"Entity is Registered with Audit Firm"}


#Energy Auditor Bulk Upload

TEMPLATE_HEADERS = [
    "AEA ID",
    "Auditor Name",
    "Email",
    "Mobile",
    "Valid_From (YYYY-MM-DD)",
    "Valid_To(YYYY-MM-DD)",
]

HEADER_TO_FIELD = {
    "AEA ID": "aea_id",
    "Auditor Name": "full_name",
    "Email": "email",
    "Mobile": "mobile",
    "Valid_From (YYYY-MM-DD)": "valid_from",
    "Valid_To(YYYY-MM-DD)": "valid_to",
}

MAX_UPLOAD_ROWS = 5000


@router.post("/aea/upload-excel")
def upload_aea_excel(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    access_roles = {"ADM"}
    verify_user_access(request, access_roles, db)

    non_empty_rows = read_excel_upload(
        file=file,
        template_headers=TEMPLATE_HEADERS,
        max_upload_rows=MAX_UPLOAD_ROWS,
        logger=logger,
        log_prefix="UPLOAD_AEA_EXCEL ",
)

    # Validation

    validation_errors = []
    validated_rows = []
    uploaded_aeas = set()

    for row_number, excel_row in enumerate(
        non_empty_rows,
        start=2
    ):

        row_data = map_excel_row(
            headers=TEMPLATE_HEADERS,
            header_to_field=HEADER_TO_FIELD,
            excel_row=excel_row,
        )

        aea_id = clean_string(
            row_data.get("aea_id")
        )

        full_name = clean_string(
            row_data.get("full_name")
        )

        email = clean_string(
            row_data.get("email")
        )

        mobile = clean_string(
            row_data.get("mobile")
        )

        valid_from = parse_excel_date(
            row_data.get("valid_from")
        )

        valid_to = parse_excel_date(
            row_data.get("valid_to")
        )

        row_has_errors = False

        # AEA ID Validation

        if not aea_id:
            validation_errors.append(
                f"Row {row_number}: AEA ID is required."
            )
            row_has_errors = True

        else:
            aea_key = aea_id.lower()

            if aea_key in uploaded_aeas:
                validation_errors.append(
                    f"Row {row_number}: Duplicate AEA ID "
                    f"'{aea_id}' found."
                )
                row_has_errors = True

        # Auditor Name Validation

        if not full_name:
            validation_errors.append(
                f"Row {row_number}: Auditor Name is required."
            )
            row_has_errors = True

        # Email Validation

        if not email:
            validation_errors.append(
                f"Row {row_number}: Email is required."
            )
            row_has_errors = True

        # Date Validation

        if not valid_from:
            validation_errors.append(
                f"Row {row_number}: Invalid valid_from."
            )
            row_has_errors = True

        if not valid_to:
            validation_errors.append(
                f"Row {row_number}: Invalid valid_to."
            )
            row_has_errors = True

        if (
            valid_from
            and valid_to
            and valid_from > valid_to
        ):
            validation_errors.append(
                f"Row {row_number}: valid_from cannot be greater than valid_to."
            )
            row_has_errors = True

        if row_has_errors:
            continue

        uploaded_aeas.add(
            aea_id.lower()
        )

        validated_rows.append(
            {
                "aea_id": aea_id,
                "full_name": full_name,
                "email": email,
                "mobile": mobile,
                "valid_from": valid_from,
                "valid_to": valid_to,
            }
        )
    # Validation Errors

    if validation_errors:
        logger.warning(
            f"UPLOAD_AEA_EXCEL Validation failed with "
            f"{len(validation_errors)} errors"
        )
        raise_validation_errors(validation_errors)

    inserted_count = 0
    updated_count = 0

    # Insert / Update

    try:

        validated_aea_ids = [
            row["aea_id"]
            for row in validated_rows
        ]

        existing_aeas_map = {
            aea.aea_id: aea
            for aea in db.query(AEA)
            .filter(
                AEA.aea_id.in_(
                    validated_aea_ids
                )
            )
            .all()
        }

        for row in validated_rows:

            existing_aea = existing_aeas_map.get(
                row["aea_id"]
            )

            if existing_aea:

                existing_aea.full_name = row["full_name"]
                existing_aea.email = row["email"]
                existing_aea.mobile = row["mobile"]
                existing_aea.valid_from = row["valid_from"]
                existing_aea.valid_to = row["valid_to"]

                updated_count += 1

            else:

                db.add(
                    AEA(
                        aea_id=row["aea_id"],
                        full_name=row["full_name"],
                        email=row["email"],
                        mobile=row["mobile"],
                        valid_from=row["valid_from"],
                        valid_to=row["valid_to"],
                        source_type="BEE",
                        is_active=True,
                    )
                )

                inserted_count += 1

        db.commit()

    except Exception as e:

        db.rollback()

        logger.error(
            f"Energy Auditor bulk upload failed - {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to process uploaded file."
        )

    logger.info(
        f"UPLOAD_AEA_EXCEL Energy Auditors uploaded successfully "
        f"- inserted: {inserted_count}, updated: {updated_count}"
    )

    return {
        "message": "Energy Auditors uploaded successfully.",
        "inserted_count": inserted_count,
        "updated_count": updated_count,
    }
