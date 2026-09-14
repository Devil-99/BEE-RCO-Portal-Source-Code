from src.utils.TrackingRouter import TrackingRouter
from src.utils.security import verify_user_access
from fastapi import Request, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, exists, select
from src.database import get_db
from src.schemas import CorpChildBase, CorpChildMappingRequest, CorpChildMappingApproveRequest, EntitiesBase, MappedEntitiesDetails, CorpChildBuyoutSummary
from src.models import CorpChild, Entity, SubmissionMaster, SubmissionDetails, FinancialYear, SubmissionPeriod, Role, RECMaster, BuyoutRequest

router = TrackingRouter(tags=["corp_child"])

import logging
logger = logging.getLogger(__name__)

@router.post("/corp_child/mapping", status_code=status.HTTP_201_CREATED)
async def add_corp_child_mapping(request: Request, payload:CorpChildMappingRequest,  db: Session = Depends(get_db)):
    access_roles = {"CORP", "SLR"}
    verify_user_access(request, access_roles, db)

    entity_exists = db.scalar(
        select(exists().where(Entity.id == payload.selected_entity_id))
    )

    fy_exists = db.scalar(
        select(exists().where(FinancialYear.id == payload.fy_id))
    )

    if not entity_exists:
        raise HTTPException(
            status_code=404,
            detail="Entity does not exist."
        )

    if not fy_exists:
        raise HTTPException(
            status_code=404,
            detail="Financial year does not exist."
        )

    user_entity_id = request.state.entity_id
    role_code = request.state.role_code
    approvalStatus = True
    
    if role_code == "CORP":
        parent_entity_id = user_entity_id
        child_entity_id = payload.selected_entity_id
    elif role_code == "SLR":
        parent_entity_id = payload.selected_entity_id
        child_entity_id = user_entity_id
        approvalStatus = False
    else:
        parent_entity_id = None

    if role_code == "CORP":
        existing_mapping = db.query(CorpChild).filter(
            CorpChild.parent_entity_id == parent_entity_id,
            CorpChild.child_entity_id == child_entity_id,
            CorpChild.fy_id == payload.fy_id
        ).first()
    elif role_code == "SLR":
        existing_mapping = db.query(CorpChild).filter(
            CorpChild.child_entity_id == child_entity_id,
            CorpChild.fy_id == payload.fy_id
        ).first()
    
    if existing_mapping:
        logger.warning("[CREATE_CORP_CHILD_MAPPING] Entity already mapped for the given financial year")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Entity already mapped for the given financial year.")
    
    # Logic to create new CorpChild mapping goes here
    try:
        new_mapping = CorpChild(
            parent_entity_id=parent_entity_id,
            child_entity_id=child_entity_id,
            fy_id=payload.fy_id,
            status=approvalStatus,
            created_by=request.state.user_id
        )
        db.add(new_mapping)
        db.commit()
        logger.info("[CREATE_CORP_CHILD_MAPPING] Mapping created successfully")
        return {"message": "Entity mapped successfully."}
    except Exception as e:
        logger.error("[CREATE_CORP_CHILD_MAPPING] Mapping failed", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail = "Something went wrong"
        )
    

@router.put("/corp_child/mapping-approve", status_code=status.HTTP_200_OK)
async def approve_corp_child_mapping(request: Request, payload:CorpChildMappingApproveRequest, db: Session = Depends(get_db)):
    access_roles = {"CORP"}
    verify_user_access(request, access_roles, db)

    user_entity_id = request.state.entity_id
    
    existing_mapping = db.query(CorpChild).filter(
        CorpChild.id == payload.mapping_id,
        CorpChild.parent_entity_id == user_entity_id
    ).first()
    
    if not existing_mapping :
        logger.warning("[APPROVE_CORP_CHILD_MAPPING] Forbidden - not authorized")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden : You are not authorized to perform this action.")

    try:
        if payload.action == "approve":
            existing_mapping.status = True
            db.commit()
            logger.info("[APPROVE_CORP_CHILD_MAPPING] Mapping approved successfully")
            return {"message": "Mapping approved successfully."}
        elif payload.action == "reject":
            db.delete(existing_mapping)
            db.commit()
            logger.info("[APPROVE_CORP_CHILD_MAPPING] Mapping rejected and deleted successfully")
            return {"message": "Mapping rejected and deleted successfully."}
        else:
            logger.warning("[APPROVE_CORP_CHILD_MAPPING] Invalid action")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action. Use 'approve' or 'reject'.")
    except Exception as e:
        logger.error("[APPROVE_CORP_CHILD_MAPPING] Action failed", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get("/corp_child/mapped_list", response_model=list[CorpChildBase])
async def get_corp_child_mappings(request: Request, db: Session = Depends(get_db)):
    access_roles = {"CORP", "SLR"}
    verify_user_access(request, access_roles, db)

    user_entity_id = request.state.entity_id
    role_code = request.state.role_code
    
    if role_code == "CORP":
        mappings = db.query(CorpChild).filter(CorpChild.parent_entity_id == user_entity_id).all()
    elif role_code == "SLR":
        mappings = db.query(CorpChild).filter(CorpChild.child_entity_id == user_entity_id).all()

    
    entity_details_map = {}
    entities_id_name_details = db.query(Entity).all()
    
    for entity in entities_id_name_details:
        entity_details_map[entity.id]=entity.org_name
        
    return [
        CorpChildBase(
            id=entity.id,
            parent_entity_name=entity_details_map[entity.parent_entity_id],
            child_entity_name=entity_details_map[entity.child_entity_id],
            fy_id= entity.fy_id,
            status= entity.status,
            associated_at= entity.associated_at,
            created_by= entity.created_by
        )
        for entity in mappings
    ]

@router.get("/corp_child/mapped_entities_details", response_model=list[MappedEntitiesDetails])
async def get_mapped_entities_details(request: Request, fy_id: int = None, db: Session = Depends(get_db)):
    access_roles = {"CORP"}
    verify_user_access(request, access_roles, db)

    user_entity_id = request.state.entity_id
    mappings = db.query(CorpChild).filter(CorpChild.parent_entity_id == user_entity_id, CorpChild.status == True).all()
    
    child_entity_ids = [mapping.child_entity_id for mapping in mappings]
    entities = db.query(Entity).filter(Entity.id.in_(child_entity_ids)).all()
    
    result = []
    
    for entity in entities:
        # Get submission data for this entity
        submission_data = None
        submission_details_dict = {}
        total_recs = 0
        stage = None
        is_closed = None
        buyout_request = False
        
        if fy_id:
            rec_data = db.query(func.sum(RECMaster.number_of_recs).label("total_recs")).filter(
                RECMaster.entity_id == entity.id,
                RECMaster.fy_id == fy_id
            ).scalar()
            total_recs = rec_data if rec_data else 0
            
            individual_buyout_request = db.query(
                BuyoutRequest
            ).filter(
                BuyoutRequest.entity_id == entity.id,
                BuyoutRequest.fy_id == fy_id,
                BuyoutRequest.buyout_type == 'INDIVIDUAL'
             ).first()
            
            if individual_buyout_request:
                buyout_request = True

            # Get the period for ANNUAL submission
            period_data = db.query(SubmissionPeriod).filter(
                SubmissionPeriod.fy_id == fy_id, 
                SubmissionPeriod.period_code == 'ANNUAL'
            ).first()
            
            if period_data:
                # Get submission master
                submission_data = db.query(SubmissionMaster, Role.role_name).join(
                    Role, SubmissionMaster.stage == Role.id
                ).filter(
                    SubmissionMaster.entity_id == entity.id,
                    SubmissionMaster.period_id == period_data.id,
                    SubmissionMaster.fy_id == fy_id
                ).first()
                
                if submission_data:
                    submission_master, role_name = submission_data
                    stage = role_name
                    is_closed = submission_master.is_closed
                    
                    # Get submission details
                    submission_details = db.query(SubmissionDetails).filter(
                        SubmissionDetails.submission_id == submission_master.id
                    ).all()
                    
                    # Convert to dictionary: {acronym: value}
                    submission_details_dict = {row.acronym: float(row.value) for row in submission_details}

        # Extract surplus_deficit and surplus_deficit_percentage based on entity_type
        surplus_deficit = None
        surplus_deficit_percentage = None
        
        if entity.entity_type == "INDUSTRY":
            surplus_deficit = submission_details_dict.get("C2")
            surplus_deficit_percentage = submission_details_dict.get("E2")
        elif entity.entity_type == "DISCOM":
            surplus_deficit = submission_details_dict.get("EE")
            surplus_deficit_percentage = submission_details_dict.get("GTT")
        
        result.append(
            MappedEntitiesDetails(
                id=entity.id,
                reg_no=entity.entity_reg_no,
                org_name=entity.org_name,
                entity_type=entity.entity_type,
                status=stage,
                is_closed=is_closed,
                buyout_request=buyout_request,
                surplus_deficit=surplus_deficit,
                surplus_deficit_percentage=surplus_deficit_percentage,
                total_recs=total_recs
            )
        )
    
    return result

@router.get("/corp_child/corporate_buyout_summary", response_model=CorpChildBuyoutSummary)
async def get_corporate_buyout_summary(request: Request, fy_id: int = None, db: Session = Depends(get_db)):
    access_roles = {"CORP"}
    verify_user_access(request, access_roles, db)

    user_entity_id = request.state.entity_id
    
    mappings = db.query(CorpChild).filter(CorpChild.parent_entity_id == user_entity_id, CorpChild.status == True).all()
    child_entity_ids = [mapping.child_entity_id for mapping in mappings]
    entities = db.query(Entity).filter(Entity.id.in_(child_entity_ids)).all() if child_entity_ids else []

    total_entities = len(entities)
    closed_entities = 0
    pending_entities = 0
    all_submissions_closed = True
    cumulative_surplus_deficit = 0.0
    total_recs = 0

    for entity in entities:
        if not fy_id:
            all_submissions_closed = False
            pending_entities += 1
            continue
        
        individual_buyout_request = db.query(
                BuyoutRequest
            ).filter(
                BuyoutRequest.entity_id == entity.id,
                BuyoutRequest.fy_id == fy_id,
                BuyoutRequest.buyout_type == 'INDIVIDUAL'
             ).first()
        if individual_buyout_request:
            continue

        period_data = db.query(SubmissionPeriod).filter(
            SubmissionPeriod.fy_id == fy_id,
            SubmissionPeriod.period_code == 'ANNUAL'
        ).first()

        if not period_data:
            all_submissions_closed = False
            pending_entities += 1
            continue

        submission_data = db.query(SubmissionMaster, Role.role_name).join(
            Role, SubmissionMaster.stage == Role.id
        ).filter(
            SubmissionMaster.entity_id == entity.id,
            SubmissionMaster.period_id == period_data.id,
            SubmissionMaster.fy_id == fy_id
        ).first()

        if not submission_data:
            all_submissions_closed = False
            pending_entities += 1
            continue

        submission_master, role_name = submission_data

        if not submission_master.is_closed:
            all_submissions_closed = False
            pending_entities += 1
            continue

        closed_entities += 1
        submission_details = db.query(SubmissionDetails).filter(
            SubmissionDetails.submission_id == submission_master.id
        ).all()
        submission_details_dict = {row.acronym: float(row.value) for row in submission_details}

        if entity.entity_type == "INDUSTRY":
            cumulative_surplus_deficit += submission_details_dict.get("C2", 0)
        elif entity.entity_type == "DISCOM":
            cumulative_surplus_deficit += submission_details_dict.get("EE", 0)
        else:
            cumulative_surplus_deficit += 0

        rec_data = db.query(func.sum(RECMaster.number_of_recs).label("total_recs")).filter(
                RECMaster.entity_id == entity.id,
                RECMaster.fy_id == fy_id
            ).scalar()
        total_recs += rec_data if rec_data else 0

    if not entities:
        all_submissions_closed = True

    total_shortfall = (
        (abs(cumulative_surplus_deficit) * 1000) - total_recs
        if all_submissions_closed and cumulative_surplus_deficit < 0
        else 0.0
    ) if all_submissions_closed else None

    cumulative_surplus_deficit = cumulative_surplus_deficit if all_submissions_closed else None

    return CorpChildBuyoutSummary(
        total_entities=total_entities,
        closed_entities=closed_entities,
        pending_entities=pending_entities,
        all_submissions_closed=all_submissions_closed,
        cumulative_surplus_deficit=cumulative_surplus_deficit,
        total_recs=total_recs,
        total_shortfall=total_shortfall
    )

@router.get("/corp_child/all_list", response_model=list[EntitiesBase])
async def get_all_entities_list(request:Request, db: Session = Depends(get_db)):
    access_roles = {"CORP", "SLR"}
    verify_user_access(request, access_roles, db)

    role_code = request.state.role_code
   
    if role_code == "CORP":
        entities = db.query(Entity).filter(
            Entity.entity_type.in_(["DISCOM", "INDUSTRY"]),
            Entity.payment_flag == True,
            Entity.document_flag == 1,
        ).all()

    elif role_code == "SLR":
        entities = db.query(Entity).filter(Entity.sector_code == "CORP").all()
    
    return [
        EntitiesBase(
            id=entity.id,
            reg_no=entity.entity_reg_no,
            org_name=entity.org_name,
        )
        for entity in entities
    ]