from typing import List
from src.services.sms_service import sms_service
from uuid import UUID
from fastapi import  Depends, HTTPException, status , Request, UploadFile, File
from sqlalchemy.orm import Session 
from sqlalchemy import or_, and_, func
from src.database import get_db 
from src.models import Firm, State, User, PlantFirmMapping, Entity, AEA, EntityFirmAuditorMapping
from src.schemas import (
    EntityWithAuditorOut,
    FirmResponse,
    FirmListForUsersResponse,
    RegisteredFirmResponse,
    FirmSearchResponse,
    FirmCreateRequest, 
    FirmUpdateRequest, 
    FirmUserRegisterRequest,
    EntityFirmMappingRequest,
    EntityAuditorFirmMappingRequest
)
from src.utils.security import hash_password, generate_password, verify_user_access
from src.utils.user_generation import generate_registration_number, generateOrg_code, financial_year
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

# --- Router Initialization ---

router = TrackingRouter(
    tags=["Firms"]
)

# Create new Firm
@router.post("/firms/create-firm", response_model=FirmResponse, status_code=status.HTTP_201_CREATED)
def create_firm(
    request: Request,
    payload: FirmCreateRequest,
    db: Session = Depends(get_db)
):
    logger.info("[CREATE_FIRM] Request received")
    # ---- Admin Check ----
    access_roles ={"ADM"}
    verify_user_access(request, access_roles, db)

    required_fields = ["firm_name", "state_code", "full_name", "valid_from"]
    for field in required_fields:
        if not getattr(payload, field):
            raise HTTPException(
                status_code=400,
                detail=f"{field.replace('_', ' ').title()} is required"
            )

    
    existing_firm = db.query(Firm).filter(Firm.firm_name == payload.firm_name).first()
    if existing_firm:
        logger.warning(f"[CREATE_FIRM] Firm already exists: {payload.firm_name}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Firm '{payload.firm_name}' already exists."
        )

    
    try:
        new_firm = Firm(**payload.model_dump())
        db.add(new_firm)
        db.commit()
        db.refresh(new_firm)

    except Exception as e:
        db.rollback()
        logger.error("[CREATE_FIRM] Failed to create firm", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Something went wrong")

    logger.info("[CREATE_FIRM] Firm created successfully")
    return new_firm


# Registration of Firm User
@router.post("/firms/register", status_code=status.HTTP_201_CREATED)
def register_firm_user(request: FirmUserRegisterRequest, db: Session = Depends(get_db)):
    sms_service.verify_otp(request.mobile, request.otp)
      
    firm = db.query(Firm).filter(Firm.firm_name == request.firm_name).first()
    if not firm:
        logger.warning(f"[REGISTER_FIRM_USER] Firm not found: {request.firm_name}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Firm '{request.firm_name}' does not exist."
        )
    state_code = firm.state_code
    
    org_code = generateOrg_code(request.firm_name)
    registration_number = generate_registration_number("NOBE", org_code, state_code, "FIRM", db)
    
    existing_entity = db.query(Entity).filter(Entity.org_name == request.firm_name, Entity.entity_reg_no == registration_number).first()
    if existing_entity:
        logger.warning(f"[REGISTER_FIRM_USER] Entity already exists for firm: {request.firm_name}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Entity with Firm name {request.firm_name} already exists."
        )
    
    new_entity = Entity(
        entity_reg_no = registration_number,
        org_name=request.firm_name,
        org_code=org_code,
        state_code=state_code,
        sector_code="FIRM",
        entity_type="NOBE",
        address=request.address,
        applicability_flag=True,
        registration_year = financial_year(),
        is_master=False,
        parent_entity_id=None,
        document_flag=1,
        payment_flag=False
    )

    db.add(new_entity)
    db.flush()
        
    existing_user = db.query(User).filter(or_(User.primary_email == request.email , User.mobile == request.mobile)).first()
    if existing_user:
        logger.warning(f"[REGISTER_FIRM_USER] User already exists with email/mobile: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with same email-'{request.email}' or mobile-'{request.mobile}' already exists."
        )
        
    new_user = User(
        full_name=request.full_name,
        primary_email=request.email,
        mobile=request.mobile,
        entity_id=new_entity.id,
        designation="Firm Head",
        role_code="FIRM",
        applicable_fy=financial_year(),
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    context = {"var": [request.full_name]}
    sms_service.send_template('document_approval', request.mobile, context, db)

    logger.info("[REGISTER_FIRM_USER] Firm user registered successfully")
    return {
        "message": "Audit Firm registration initiated successfully. Please proceed for payment",
        "user_id": new_user.id,
        "firm_name": firm.firm_name,
        "username": firm.firm_name
    }

# Map Entity with Firm
@router.post("/firms/entity-firm-mapping", status_code=status.HTTP_201_CREATED)
def entity_firm_mapping(request: Request, payload : EntityFirmMappingRequest, db: Session = Depends(get_db)):
    logger.info("[ENTITY_FIRM_MAPPING] Request received")
    entity_id = request.state.entity_id
    role_code = request.state.role_code
    if role_code != "SLR":
        logger.warning("[ENTITY_FIRM_MAPPING] Forbidden - not authorized")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden : You are not authorized to perform this action.")
    
    if entity_id is None :
         logger.warning("[ENTITY_FIRM_MAPPING] Entity ID not found")
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entity ID not found")
    
    existing_firm = db.query(Firm).filter(Firm.firm_id == payload.firm_id).first()
    if not existing_firm:
        logger.warning("[ENTITY_FIRM_MAPPING] Firm not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Firm not found"
        )
    
    existing_entity = db.query(PlantFirmMapping).filter(
        and_(
            PlantFirmMapping.entity_id == entity_id,
            PlantFirmMapping.fy == payload.fy_id
        )
    ).first()
    
    if existing_entity :
        logger.warning("[ENTITY_FIRM_MAPPING] Entity already registered with a Firm for this financial year")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This Entity is already registered with a Firm for this financial year."
        )
    
    try:
        new_firm_entity = PlantFirmMapping(
            entity_id = entity_id,
            firm_id = payload.firm_id,
            fy = payload.fy_id
        )
        db.add(new_firm_entity)
        db.commit()

        logger.info("[ENTITY_FIRM_MAPPING] Entity mapped with audit firm successfully")
        return {"message":"Entity is Registered with Audit Firm"}
    except Exception as e:
        logger.error("[ENTITY_FIRM_MAPPING] Mapping failed", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# Master Data of Firms for Admin Control
@router.get("/firms/get-firms", response_model=List[FirmResponse], status_code=status.HTTP_200_OK)
def get_all_firms(request: Request, db: Session = Depends(get_db)):
    access_roles ={"ADM"}
    verify_user_access(request, access_roles, db)
    firms = db.query(Firm).all()
    return firms

# Get all firm list those are registered
@router.get("/firms/listed", response_model=List[RegisteredFirmResponse], status_code=status.HTTP_200_OK)
def get_all_registered_firms(request: Request, db: Session = Depends(get_db)):
        if request.state.role_code != "SLR" and request.state.role_code != "AEA":
            logger.warning("[GET_ALL_REGISTERED_FIRMS] Forbidden - not authorized")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden : You are not authorized to access this particular data.")
    
        firms = db.query(Firm).join(Entity, Firm.firm_name == Entity.org_name).filter(Entity.payment_flag==True).all()
        return firms

# get registered audit firms Details for admin view 
@router.get("/firms/registered", status_code=status.HTTP_200_OK)
def get_all_audit_firms(request: Request, db: Session = Depends(get_db)):
    role_code = request.state.role_code
    if( role_code not in {"ADM", "SNA", "SPA"}):
        logger.warning("[GET_ALL_AUDIT_FIRMS] Access forbidden: Admins only")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admins only"
        )

    registered_firms = (
        db.query(
            Entity.org_name.label("firm_name"),
            Entity.state_code.label("state_code"),
            Entity.entity_reg_no.label("entity_reg_no"),
            Entity.payment_flag.label("payment_flag"),
            User.username.label("username"),
            User.primary_email.label("email"),
            User.mobile.label("mobile"),
            User.full_name.label("full_name"),
        )
        .join(User, User.entity_id == Entity.id)
        .filter(User.role_code == "FIRM")
        .all()
    )

    return [dict(row._mapping) for row in registered_firms]

# Get Firm names for dynamic dropdown
@router.get("/firms/names", response_model=List[str], status_code=status.HTTP_200_OK)
def get_firm_names(request: Request, db: Session = Depends(get_db)):
    firm_names = db.query(Firm.firm_name).all()
    return [name for (name,) in firm_names]

# Search firm by Firm Name
@router.get("/firms/firm_id/{firm_name}", response_model=FirmSearchResponse, status_code=status.HTTP_200_OK)
def get_firm_by_id(firm_name: str, db: Session = Depends(get_db)):
    firm = db.query(Firm).filter(Firm.firm_name == firm_name).first()

    if not firm:
        logger.warning(f"[GET_FIRM_BY_ID] Firm not found: {firm_name}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="firm_name does not exist")
    return firm

# Get the firm detail which is mapped with an entity
@router.get("/firms/entity_id", status_code=status.HTTP_200_OK)
def get_firms_by_entity_id(request : Request, db: Session = Depends(get_db)):
    entity_id = request.state.entity_id
    role_code = request.state.role_code
    
    if role_code != 'SLR' and entity_id is None :
         logger.warning("[GET_FIRMS_BY_ENTITY_ID] Forbidden - not authorized")
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden : You are not authorized to access this data.")
    
    firms = (
        db.query(Firm, PlantFirmMapping.fy)
        .join(PlantFirmMapping, PlantFirmMapping.firm_id == Firm.firm_id)
        .filter(PlantFirmMapping.entity_id == entity_id)
        .all()
    )

    if not firms:
        logger.warning("[GET_FIRMS_BY_ENTITY_ID] No Audit Firm enlisted for this entity")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Audit Firm is enlisted for this entity"
        )

    return [
        {
            "firm_name": firm.firm_name,
            "full_name": firm.full_name,
            "address": firm.address,
            "fy": fy
        }
        for firm, fy in firms
    ]
    
# Get the entities detail which is mapped with a firm
@router.get("/firms/mapped-entities", response_model=List[EntityWithAuditorOut], status_code=status.HTTP_200_OK)
def get_entity_by_firm_id(request : Request, fy_id : int, db: Session = Depends(get_db)):
    if request.state.role_code != "FIRM":
        logger.warning("[GET_ENTITIES_BY_FIRM_ID] Forbidden - not authorized")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden : You are not authorized to access this data.")
    
    entity_id = request.state.entity_id
    loggedInfirm = db.query(Entity).filter(Entity.id == entity_id).first()
    
    firm = db.query(Firm).filter(Firm.firm_name == loggedInfirm.org_name).first()
    
    if not firm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Firm not found")

    # Query entities with auditors
    entities_with_auditors = (
        db.query(
            Entity.id.label("entity_id"),
            Entity.org_name.label("entity_name"),
            AEA.full_name.label("auditor_name"),
            PlantFirmMapping.fy.label("fy_id")
        )
        .join(PlantFirmMapping, PlantFirmMapping.entity_id == Entity.id)
        .outerjoin(EntityFirmAuditorMapping,
            and_(
                EntityFirmAuditorMapping.entity_id == Entity.id,
                EntityFirmAuditorMapping.fy == fy_id
            )
        )
        .outerjoin(AEA,
            AEA.id == EntityFirmAuditorMapping.auditor_id
        )
        .filter(
            PlantFirmMapping.firm_id == firm.firm_id,
            PlantFirmMapping.fy == fy_id
        )
        .all()
    )

    return entities_with_auditors

@router.put("/firms/update-firms/{firm_id}", response_model=FirmResponse)
def update_firm(
    firm_id: UUID,
    request: Request,
    payload: FirmUpdateRequest,
    db: Session = Depends(get_db)
):
    logger.info("[UPDATE_FIRM] Request received")
    """
    Update an existing firm's details. Firm name cannot be updated.
    """
    access_roles ={"ADM"}
    verify_user_access(request, access_roles, db)
    
    firm = db.query(Firm).filter(Firm.firm_id == firm_id).first()
    if not firm:
        logger.warning(f"[UPDATE_FIRM] Firm not found with id: {firm_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Firm not found")
   
    update_data = payload.model_dump(exclude_unset=True)

    # Ensure firm_id and firm_name are never updated
    update_data.pop("firm_id", None)
    update_data.pop("firm_name", None)

    for key, value in update_data.items():
        setattr(firm, key, value)
        
    db.commit()
    db.refresh(firm)
    logger.info("[UPDATE_FIRM] Firm updated successfully")
    return firm


@router.delete("/delete-firms/{empanelment_no}", status_code=status.HTTP_204_NO_CONTENT)
def delete_firm_by_empanelment_no(request: Request ,empanelment_no: str, db: Session = Depends(get_db)):
    logger.info("[DELETE_FIRM] Request received")
    access_roles ={"ADM"}
    verify_user_access(request, access_roles, db)
    firm = db.query(Firm).filter(Firm.bee_empanelment_no == empanelment_no).first()
    if not firm:
        logger.warning(f"[DELETE_FIRM] Firm not found with empanelment number: {empanelment_no}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Firm not found with the given empanelment number"
        )
    
    db.delete(firm)
    db.commit()
    logger.info("[DELETE_FIRM] Firm deleted successfully")
    return None

@router.post("/firms/entity-firm-auditor-mapping", status_code=status.HTTP_201_CREATED)
def entity_auditor_firm_mapping(
    request : Request,
    Payload : EntityAuditorFirmMappingRequest, 
    db: Session = Depends(get_db)
    ):
    logger.info("[ENTITY_AUDITOR_FIRM_MAPPING] Request received")
    if request.state.role_code != "FIRM":
        logger.warning("[ENTITY_AUDITOR_FIRM_MAPPING] Forbidden - not authorized")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden : You are not authorized to perform this action.")
    
    loggedInfirm = db.query(Entity).filter(Entity.id ==request.state.entity_id).first()
    firm_name =loggedInfirm.org_name
    
    firm = db.query(Firm).filter(Firm.firm_name == firm_name).first()
    if not firm:
            logger.warning("[ENTITY_AUDITOR_FIRM_MAPPING] Firm not found")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Firm not found")
   
    valid_mapping = db.query(PlantFirmMapping).filter(
     PlantFirmMapping.firm_id == firm.firm_id,
     PlantFirmMapping.entity_id == Payload.entity_id,
     PlantFirmMapping.fy == Payload.fy_id
    )
    
    if valid_mapping :
        existing_entity = db.query(EntityFirmAuditorMapping).filter(
            EntityFirmAuditorMapping.entity_id == Payload.entity_id,
            EntityFirmAuditorMapping.fy == Payload.fy_id
        ).first()
        if existing_entity :
            logger.warning("[ENTITY_AUDITOR_FIRM_MAPPING] Entity already mapped")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This Entity is already mapped."
            )
        new_entity_auditor_firm = EntityFirmAuditorMapping(
            auditor_id = Payload.auditor_id,
            firm_id = firm.firm_id,
            entity_id = Payload.entity_id,
            fy=Payload.fy_id
        )
        
        db.add(new_entity_auditor_firm)
        db.commit()

        logger.info("[ENTITY_AUDITOR_FIRM_MAPPING] Entity, auditor and firm mapped successfully")
        return {"message":"Entity, Auditor and Firm is mapped for this financial year"}
            
    else:  
        logger.warning("[ENTITY_AUDITOR_FIRM_MAPPING] Entity not mapped with the Firm")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entity not mapped with the Firm")

# Audit Firm Bulk Upload

TEMPLATE_HEADERS = [
    "Firm Name",
    "Auditor Name",
    "Address",
    "Mobile",
    "Email",
    "State Code",
    "Valid From (YYYY-MM-DD)",
    "Valid_To(YYYY-MM-DD)",
]

HEADER_TO_FIELD = {
    "Firm Name": "firm_name",
    "Auditor Name": "auditor_name",
    "Address": "address",
    "Mobile": "mobile",
    "Email": "email",
    "State Code": "state_code",
    "Valid From (YYYY-MM-DD)": "valid_from",
    "Valid_To(YYYY-MM-DD)": "valid_to",
}

MAX_UPLOAD_ROWS = 5000


@router.post("/firms/upload-excel")
def upload_firm_excel(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    access_roles ={"ADM"}
    verify_user_access(request, access_roles, db)

    non_empty_rows = read_excel_upload(
        file=file,
        template_headers=TEMPLATE_HEADERS,
        max_upload_rows=MAX_UPLOAD_ROWS,
        logger=logger,
        log_prefix="[UPLOAD_FIRM_EXCEL] ",
    )

    valid_state_codes = {
        row.state_code
        for row in db.query(State.state_code).all()
    }


    validation_errors = []
    validated_rows = []
    uploaded_firms = set()

    for row_number, excel_row in enumerate(
        non_empty_rows,
        start=2
    ):

        row_data = map_excel_row(
           headers= TEMPLATE_HEADERS,
           header_to_field= HEADER_TO_FIELD,
           excel_row=excel_row
        )

        firm_name = clean_string(
            row_data.get("firm_name")
        )
        state_code = clean_string(
            row_data.get("state_code")
        )
        valid_from = parse_excel_date(
            row_data.get("valid_from")
        )
        valid_to = parse_excel_date(
            row_data.get("valid_to")
        )

        row_has_errors = False


        if not firm_name:
            validation_errors.append(
                f"Row {row_number}: Firm Name is required."
            )
            row_has_errors = True
        else:
            firm_key = firm_name.lower()

            if firm_key in uploaded_firms:
                validation_errors.append(
                    f"Row {row_number}: Duplicate firm_name "
                    f"'{firm_name}' found."
                )
                row_has_errors = True


        if not state_code:
            validation_errors.append(
                f"Row {row_number}: State Code is required."
            )
            row_has_errors = True
        elif state_code not in valid_state_codes:
            validation_errors.append(
                f"Row {row_number}: Invalid state_code "
                f"'{state_code}'. "
                f"Please provide a valid state code."
            )
            row_has_errors = True


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
                f"Row {row_number}: valid_from cannot be "
                f"greater than valid_to."
            )
            row_has_errors = True


        if row_has_errors:
            continue

        uploaded_firms.add(firm_name.lower())

        validated_rows.append(
            {
                "firm_name": firm_name,
                "full_name": clean_string(
                    row_data.get("auditor_name")
                ),
                "address": clean_string(
                    row_data.get("address")
                ) or "",
                "mobile": clean_string(
                    row_data.get("mobile")
                ),
                "email": clean_string(
                    row_data.get("email")
                ),
                "state_code": state_code,
                "valid_from": valid_from,
                "valid_to": valid_to,
            }
        )


    if validation_errors:
        logger.warning(f"[UPLOAD_FIRM_EXCEL] Validation failed with {len(validation_errors)} errors")
        raise_validation_errors(validation_errors)

    inserted_count = 0
    updated_count = 0

    try:
        validated_firm_names_lower = [
            r["firm_name"].lower()
            for r in validated_rows
        ]

        existing_firms_map = {
            f.firm_name.lower(): f
            for f in db.query(Firm)
            .filter(
                func.lower(Firm.firm_name).in_(
                    validated_firm_names_lower
                )
            )
            .all()
        }

        for row in validated_rows:

            existing_firm = existing_firms_map.get(
                row["firm_name"].lower()
            )

            if existing_firm:
                existing_firm.full_name = row["full_name"]
                existing_firm.address = row["address"]
                existing_firm.mobile = row["mobile"]
                existing_firm.email = row["email"]
                existing_firm.state_code = row["state_code"]
                existing_firm.valid_from = row["valid_from"]
                existing_firm.valid_to = row["valid_to"]

                updated_count += 1

            else:

                db.add(
                    Firm(
                        firm_name=row["firm_name"],
                        full_name=row["full_name"],
                        address=row["address"],
                        mobile=row["mobile"],
                        email=row["email"],
                        state_code=row["state_code"],
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
        logger.error(f"Audit Firm bulk upload failed - {str(e)}")

        raise HTTPException(
            status_code=500,
            detail="Failed to process uploaded file."
        )

    logger.info(f"[UPLOAD_FIRM_EXCEL] Audit firms uploaded successfully - inserted: {inserted_count}, updated: {updated_count}")
    return {
        "message": "Audit firms uploaded successfully.",
        "inserted_count": inserted_count,
        "updated_count": updated_count,
    }