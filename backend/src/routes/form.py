import re
from fastapi import APIRouter, Depends, HTTPException, status , Query , Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session 
from sqlalchemy import exists, case, or_, and_
from datetime import datetime, timezone
from fastapi import Body
from uuid import UUID
from src.utils.enums import FormTypeEnum, SubmissionStatusEnum, StageActionStatusEnum
from src.database import get_db
from src.schemas import FormSubmissionBase, SubmissionDetailResponse , SubmissionMasterResponse, SubmissionStageHistoryResponse,PaginatedSubmissionResponse
from src.models import  SubmissionPeriod, SubmissionDetails, SubmissionMaster, Role, Entity, DiscomFormField , AEA , CPPFormField, User, EntityFirmAuditorMapping, SubmissionStageHistory
from typing import Dict, List , Any , Union, Optional
from math import ceil
from src.models.workflow import Workflow
from sqlalchemy.exc import SQLAlchemyError
from src.utils.TrackingRouter import TrackingRouter
from src.services.form_excel_exporter import export_submission_excel
import json

import logging
logger = logging.getLogger(__name__)

router = TrackingRouter( tags=["Form Submission"])

# ----------------- Form Submission API -----------------
@router.post("/form/cpp/submit", status_code=status.HTTP_201_CREATED)
def submit_cpp_form_data( request: Request,  form_data_list: List[FormSubmissionBase], db: Session = Depends(get_db)):
    logger.info("[SUBMIT_CPP_FORM] CPP form submission request received")
    if not form_data_list:
        logger.warning("[SUBMIT_CPP_FORM] No data provided")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No data provided.")
    
    first = form_data_list[0]
    
    if (first.entity_id) is None or (first.fy_id) is None or (first.period_id) is None:
        logger.warning("[SUBMIT_CPP_FORM] Missing or invalid parameters")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing or invalid parameters.")
    
    entity_id, fy_id, period_id, user_id = first.entity_id, first.fy_id, first.period_id, first.user_id

    # normalize and debug types before comparison
    session_eid = request.state.entity_id

    payload_s = str(entity_id) if entity_id is not None else None
    session_s = str(session_eid) if session_eid is not None else None

    if payload_s != session_s:
        logger.warning("[SUBMIT_CPP_FORM] Forbidden - entity mismatch")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden : You are not authorized to perform this action.")

    try:
       
        input_values = {entry.acronym: float(entry.value) for entry in form_data_list}

        all_fields = db.query(CPPFormField).all()

        logic_fields = [f for f in all_fields if f.type == FormTypeEnum.LOGIC]
    
        all_acronyms = {f.acronym for f in all_fields}
   
        computed = input_values.copy()


        def safe_get(acronym):
            val = float(computed.get(acronym, 0.0))
            # print(f"[DEBUG] safe_get({acronym}) = {val}")
            return val

        def safe_eval(expr: str):
            # print(f"[DEBUG] safe_eval input: {expr}")
            try:
                # Replace all field acronyms in the expression with their numeric values
                tokens = re.findall(r'\b[a-zA-Z_][a-zA-Z0-9_]*\b', expr)
                for token in tokens:
                    if token in all_acronyms:
                        expr = expr.replace(token, str(safe_get(token)))
                if re.search(r'/\s*0(\.0+)?([^\d]|$)', expr):
                    return 0.0
                try:
                    result = round(eval(expr, {"__builtins__": None}, {}), 3)
                  
                    return result
                except ZeroDivisionError:
                   
                    return 0.0
            except Exception as e:
              
                return None

        # Iteratively calculate until all logic fields are stable
        for _ in range(10): # Safety break to prevent infinite loops
            stable = True
         
            for field in logic_fields:
                logic_expr = getattr(field, 'logic', None)
                acronym = str(getattr(field, 'acronym', ''))
                if not logic_expr:
                    continue
          
                result = safe_eval(str(logic_expr))
         
                if result is not None and computed.get(acronym) != result:
                   
                    computed[acronym] = result
                    stable = False
            if stable:
                break

        # --- Snapshot and Database Storage ---
        import math
        logic_snapshot_values = {}
        for f in logic_fields:
            acronym = str(getattr(f, 'acronym', ''))
            val = computed.get(acronym)
            # Clean NaN/infinite for logic_snapshot
            if val is None:
                logic_snapshot_values[acronym] = 0.0
            else:
                try:
                    valf = float(val)
                    if math.isnan(valf) or math.isinf(valf):
                       
                        valf = 0.0
                    logic_snapshot_values[acronym] = valf
                except Exception as e:
                  
                    logic_snapshot_values[acronym] = 0.0
       
        # Find workflow for this form type and year
        workflow = db.query(Workflow).filter(
            and_(
                Workflow.form_type == "INDUSTRY",
                Workflow.default == 1
                )
            ).first()
        if not workflow:
            logger.warning("[SUBMIT_CPP_FORM] No workflow defined for INDUSTRY form type")
            raise HTTPException(status_code=400, detail="No workflow defined for this form type and year")
        
        existing_submission = db.query(SubmissionMaster).filter(
            and_(
                SubmissionMaster.entity_id == entity_id,
                SubmissionMaster.fy_id == fy_id,
                SubmissionMaster.period_id == period_id
                )
            ).first()
        
        # collect uploads from payload (allow multiple uploads across entries)
        uploads_set = set()
        for e in form_data_list:
            for u in (getattr(e, 'uploads') or []):
                if u:
                    uploads_set.add(u)
        uploads_list = list(uploads_set) if uploads_set else None

        if existing_submission:
            master = existing_submission
            # delete the submission details associated with this master record
            db.query(SubmissionDetails).filter(SubmissionDetails.submission_id == master.id).delete()
            # update the updated_at timestamp and logic_snapshot in submission master
            setattr(master, 'updated_at', datetime.now(timezone.utc))
            setattr(master, 'logic_snapshot', logic_snapshot_values)
            # merge/replace uploads (only if incoming uploads present)
            if uploads_list is not None:
                setattr(master, 'uploads', uploads_list)
        else:
            master = SubmissionMaster(
                entity_id=entity_id,
                fy_id=fy_id,
                period_id=period_id,
                status=SubmissionStatusEnum.DRAFT,
                created_by=user_id,
                created_at=datetime.now(timezone.utc),
                stage=1,
                logic_snapshot=logic_snapshot_values,
                workflow_id=workflow.id,
                uploads=uploads_list
            )

        db.add(master)
        db.flush()
    
        # Add first stage history entry - Form filled by Energy Manager
        stage_history = SubmissionStageHistory(
            submission_id=master.id,
            stage_number=master.stage,
            action_status=StageActionStatusEnum.APPROVED,
            comments="Form filled by Energy Manager",
            action_by=user_id,
            action_at=datetime.now(timezone.utc)
        )
        db.add(stage_history)

        # Save all submitted fields to the detail table
        import math
        details_to_add = []
        for entry in form_data_list:
            # Convert value to float and handle NaN/infinite
            try:
                val = float(entry.value)
                if math.isnan(val) or math.isinf(val):
                    val = 0.0
            except Exception as e:
                val = 0.0
            
            details_to_add.append(
                SubmissionDetails(
                    submission_id=master.id,
                    acronym=entry.acronym,
                    value=val
                )
            )
        # ensure uploads are persisted on master (in case master was newly created earlier without uploads)
        if getattr(master, 'uploads', None) is None and uploads_list:
            master.uploads = uploads_list
        db.add_all(details_to_add)
        db.commit()
        
        logger.info("[SUBMIT_CPP_FORM] CPP form submitted successfully, submission_id: %s", master.id)
        return {"message": "CPP form submitted successfully.", "submission_id": master.id}
    except Exception as e:
        logger.error("[SUBMIT_CPP_FORM] Exception occurred: %s", e, exc_info=True)
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An internal error occurred")


@router.post("/form/discom/submit", status_code=status.HTTP_201_CREATED)
def submit_discom_form_data(request: Request, form_data_list: List[FormSubmissionBase], db: Session = Depends(get_db)):
    logger.info("[SUBMIT_DISCOM_FORM] DISCOM form submission request received")
    if not form_data_list:
        logger.warning("[SUBMIT_DISCOM_FORM] No data provided")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No data provided.")
    
    first = form_data_list[0]
    
    if (first.entity_id) is None or (first.fy_id) is None or (first.period_id) is None:
        logger.warning("[SUBMIT_DISCOM_FORM] Missing or invalid parameters")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing or invalid parameters.")
    
    entity_id, fy_id, period_id, user_id = first.entity_id, first.fy_id, first.period_id, first.user_id

    # normalize and debug types before comparison
    session_eid = request.state.entity_id

    payload_s = str(entity_id) if entity_id is not None else None
    session_s = str(session_eid) if session_eid is not None else None

    if payload_s != session_s:
        logger.warning("[SUBMIT_DISCOM_FORM] Forbidden - entity mismatch")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden : You are not authorized to perform this action.")

    try:
       
        input_values = {entry.acronym: float(entry.value) for entry in form_data_list}
       
        all_fields = db.query(DiscomFormField).all()
   
        logic_fields = [f for f in all_fields if f.type == FormTypeEnum.LOGIC]
    
        all_acronyms = {f.acronym for f in all_fields}
   
        computed = input_values.copy()


        def safe_get(acronym):
            val = float(computed.get(acronym, 0.0))
            # print(f"[DEBUG] safe_get({acronym}) = {val}")
            return val

        def safe_eval(expr: str):
            # print(f"[DEBUG] safe_eval input: {expr}")
            try:
                # Replace all field acronyms in the expression with their numeric values
                tokens = re.findall(r'\b[a-zA-Z_][a-zA-Z0-9_]*\b', expr)
                for token in tokens:
                    if token in all_acronyms:
                        expr = expr.replace(token, str(safe_get(token)))
                if re.search(r'/\s*0(\.0+)?([^\d]|$)', expr):
                    return 0.0
                try:
                    result = round(eval(expr, {"__builtins__": None}, {}), 3)
                  
                    return result
                except ZeroDivisionError:
                   
                    return 0.0
            except Exception as e:
              
                return None

        # Iteratively calculate until all logic fields are stable
        for _ in range(10): # Safety break to prevent infinite loops
            stable = True
         
            for field in logic_fields:
                logic_expr = getattr(field, 'logic', None)
                acronym = str(getattr(field, 'acronym', ''))
                if not logic_expr:
                    continue
          
                result = safe_eval(str(logic_expr))
         
                if result is not None and computed.get(acronym) != result:
                   
                    computed[acronym] = result
                    stable = False
            if stable:
                break

        # --- Snapshot and Database Storage ---
        import math
        logic_snapshot_values = {}
        for f in logic_fields:
            acronym = str(getattr(f, 'acronym', ''))
            val = computed.get(acronym)
            # Clean NaN/infinite for logic_snapshot
            if val is None:
                logic_snapshot_values[acronym] = 0.0
            else:
                try:
                    valf = float(val)
                    if math.isnan(valf) or math.isinf(valf):
                       
                        valf = 0.0
                    logic_snapshot_values[acronym] = valf
                except Exception as e:
                  
                    logic_snapshot_values[acronym] = 0.0
        
        # ---- Workflow check ----
        workflow = db.query(Workflow).filter(
            and_(
                Workflow.form_type == "DISCOM",
                Workflow.default == 1
                )
            ).first()
        
        if not workflow:
            logger.warning("[SUBMIT_DISCOM_FORM] No workflow defined for DISCOM form type")
            raise HTTPException(status_code=400, detail="No workflow defined for this form type and year")
        
        # --- Validation ---
        existing_submission = db.query(SubmissionMaster).filter(
            and_(
                SubmissionMaster.entity_id == entity_id,
                SubmissionMaster.fy_id == fy_id,
                SubmissionMaster.period_id == period_id
                )
            ).first()
        
        # collect uploads from payload (allow multiple uploads across entries)
        uploads_set = set()
        for e in form_data_list:
            for u in (getattr(e, 'uploads') or []):
                if u:
                    uploads_set.add(u)
        uploads_list = list(uploads_set) if uploads_set else None

        if existing_submission:
            master = existing_submission
            # delete the submission details associated with this master record
            db.query(SubmissionDetails).filter(SubmissionDetails.submission_id == master.id).delete()
            # update the updated_at timestamp and logic_snapshot in submission master
            setattr(master, 'updated_at', datetime.now(timezone.utc))
            setattr(master, 'logic_snapshot', logic_snapshot_values)
            # merge/replace uploads (only if incoming uploads present)
            if uploads_list is not None:
                setattr(master, 'uploads', uploads_list)
        else:
            master = SubmissionMaster(
                entity_id=entity_id,
                fy_id=fy_id,
                period_id=period_id,
                status=SubmissionStatusEnum.DRAFT,
                created_by=user_id,
                created_at=datetime.now(timezone.utc),
                stage=1,
                logic_snapshot=logic_snapshot_values,
                workflow_id=workflow.id,
                uploads=uploads_list
            )

        db.add(master)
        db.flush()
        
        # Add first stage history entry - Form filled by Energy Manager
        stage_history = SubmissionStageHistory(
            submission_id=master.id,
            stage_number=master.stage,
            action_status=StageActionStatusEnum.APPROVED,
            comments="Form filled by Energy Manager",
            action_by=user_id,
            action_at=datetime.now(timezone.utc)
        )
        db.add(stage_history)
    
        # Save all submitted fields to the detail table
        import math
        details_to_add = []
        for entry in form_data_list:
            # Convert value to float and handle NaN/infinite
            try:
                val = float(entry.value)
                if math.isnan(val) or math.isinf(val):
                    val = 0.0
            except Exception as e:
                val = 0.0
            
            details_to_add.append(
                SubmissionDetails(
                    submission_id=master.id,
                    acronym=entry.acronym,
                    value=val
                )
            )
        # ensure uploads are persisted on master (in case master was newly created earlier without uploads)
        if (not getattr(master, 'uploads', None)) and uploads_list:
            setattr(master, 'uploads', uploads_list)
        db.add_all(details_to_add)
        db.commit()
        
        logger.info("[SUBMIT_DISCOM_FORM] DISCOM form submitted successfully, submission_id: %s", master.id)
        return {"message": "DISCOM form submitted successfully.", "submission_id": master.id}
    except Exception as e:
        logger.error("[SUBMIT_DISCOM_FORM] Exception occurred: %s", e, exc_info=True)
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An internal error occurred")

# ----------------- Data Retrieval APIs -----------------

@router.get(
    "/form/data/entity-{entity_id}-fy-{fy_id}-period-{period_id}",
    response_model=List[SubmissionDetailResponse]
)
def get_discom_submission_data(
    request: Request,
    entity_id: UUID,
    fy_id: int,
    period_id: int,
    db: Session = Depends(get_db),
):
    user_role_code = request.state.role_code
    user_entity_id = request.state.entity_id
    user_id = request.state.user_id
    
    # -----------------------------------------------------
    # Helper: Safe fetchers (prevent NoneType exceptions)
    # -----------------------------------------------------
    def get_entity_safe(_id):
        return db.query(Entity).filter(Entity.id == _id).first()

    def get_user_safe(_id):
        return db.query(User).filter(User.id == _id).first()

    allowed = False

    # -----------------------------------------------------
    # Access Control Logic
    # -----------------------------------------------------
    if user_role_code in {"SLR", "USR"}:
        # User can access only their own entity
        allowed = (str(entity_id) == user_entity_id)

    elif user_role_code in {"SLDC", "SDA"}:
        # Compare state_code of logged-in entity and requested entity
        logged_entity = get_entity_safe(user_entity_id)
        target_entity = get_entity_safe(entity_id)

        if logged_entity and target_entity:
            allowed = (logged_entity.state_code == target_entity.state_code)

    elif user_role_code == "AEA":
        # AEA → mapped to entities under the auditor
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
        logger.warning("[GET_DISCOM_SUBMISSION_DATA] Access denied for role: %s", user_role_code)
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access this data."
        )

    # -----------------------------------------------------
    # Fetch Submission Master
    # -----------------------------------------------------
    submission = db.query(SubmissionMaster).filter_by(
        entity_id=entity_id, fy_id=fy_id, period_id=period_id
    ).first()

    if not submission:
        return []

    # -----------------------------------------------------
    # Fetch Submission Details
    # -----------------------------------------------------
    submission_details = db.query(SubmissionDetails).filter(
        SubmissionDetails.submission_id == submission.id
    ).all()

    return submission_details or []


# ----------------- Check Submitted Forms -----------------

@router.get("/form/submitted", response_model=Union[List[SubmissionMasterResponse], PaginatedSubmissionResponse])
def get_submitted_forms(
    request: Request,
    entity_type: Optional[str] = None,
    state_code: Optional[str] = None,
    status: Optional[str] = None,
    fy_id: Optional[int] = None,
    stage: Optional[str] = None,
    search: Optional[str] = None,
    search_type: Optional[str] = None,
    page: Optional[int] = Query(default=None, ge=1),
    page_size: Optional[int] = Query(default=None, ge=1, le=100),
    db: Session = Depends(get_db),
):
    logger.info("[GET_SUBMITTED_FORMS] Fetching submitted forms")
    user_role_code = request.state.role_code
    user_id = request.state.user_id
    user_entity_id = request.state.entity_id

    # ---------------------------------------------
    # Common select columns (reuse for all queries)
    # ---------------------------------------------
    status_case = case(
        (SubmissionMaster.status == SubmissionStatusEnum.PENDING.value, "PENDING"),
        (SubmissionMaster.status == SubmissionStatusEnum.APPROVED.value, "APPROVED"),
        (SubmissionMaster.status == SubmissionStatusEnum.REJECTED.value, "REJECTED"),
        (SubmissionMaster.status == SubmissionStatusEnum.IN_PROGRESS.value, "IN_PROGRESS"),
        (SubmissionMaster.status == SubmissionStatusEnum.DRAFT.value, "DRAFT"),
    ).label("status")

    BASE_COLUMNS = [
        SubmissionMaster.id,
        SubmissionMaster.entity_id,
        SubmissionMaster.period_id,
        SubmissionMaster.fy_id,
        SubmissionMaster.is_closed,
        status_case,
        SubmissionMaster.updated_at,
        SubmissionMaster.uploads,
        Role.role_code.label("stage"),
        Role.role_name.label("position"),
        Entity.state_code,
        Entity.entity_type,
        Entity.org_name.label("entity_name"),
        Entity.entity_reg_no.label("reg_no"),
        Entity.pat_reg_number.label("pat_reg_number")
    ]

    def base_query():
        return (
            db.query(*BASE_COLUMNS)
            .join(Role, SubmissionMaster.stage == Role.id)
            .join(Entity, SubmissionMaster.entity_id == Entity.id)
        )

    query = base_query()

    # ---------------------------------------------
    # Role scoping (same endpoint, different data per role)
    # ---------------------------------------------
    if user_role_code in {"SLR", "USR"}:
        # Role: SLR / USR  → Only own entity
        query = query.filter(SubmissionMaster.entity_id == user_entity_id)

    elif user_role_code == "SLDC":
        # Role: SLDC → State + DISCOM only
        logged_entity = db.query(Entity).filter(Entity.id == user_entity_id).first()
        if not logged_entity:
            return [] if page is None else {
                "items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0
            }
        query = query.filter(
            Entity.state_code == logged_entity.state_code,
            Entity.entity_type == "DISCOM"
        )

    elif user_role_code == "SDA":
        # Role: SDA → State (DISCOM + INDUSTRY)
        logged_entity = db.query(Entity).filter(Entity.id == user_entity_id).first()
        if not logged_entity:
            return [] if page is None else {
                "items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0
            }
        query = query.filter(
            Entity.state_code == logged_entity.state_code,
            Entity.entity_type.in_(["DISCOM", "INDUSTRY"])
        )

    elif user_role_code == "AEA":
        # Role: AEA  → Filter by mapped entities only
        logged_user = db.query(User).filter(User.id == user_id).first()
        if not logged_user:
            return [] if page is None else {
                "items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0
            }
        aea_record = (
            db.query(AEA)
            .filter(AEA.aea_id == logged_user.username)
            .first()
        )
        if not aea_record:
            return [] if page is None else {
                "items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0
            }
        query = query.join(
            EntityFirmAuditorMapping,
            and_(
                EntityFirmAuditorMapping.entity_id == SubmissionMaster.entity_id,
                EntityFirmAuditorMapping.fy == SubmissionMaster.fy_id
            )
        ).filter(EntityFirmAuditorMapping.auditor_id == aea_record.id)

    elif user_role_code in {"ADM", "SNA", "SPA"}:
        # Role: ADM / SNA / SPA → No role filter (all submissions)
        pass

    else:
        return [] if page is None else {
            "items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0
        }

    # ---------------------------------------------
    # Optional filters (only applied when the param is present)
    # ---------------------------------------------
    if entity_type:
        query = query.filter(Entity.entity_type == entity_type)

    if state_code:
        query = query.filter(Entity.state_code == state_code)

    if status == "0":
        query = query.filter(
            SubmissionMaster.is_closed == 0,
            Role.role_code == (stage or user_role_code)
        )

    elif status == "1":
        query = query.filter(
            SubmissionMaster.is_closed == 1
        )

    if fy_id:
        query = query.filter(SubmissionMaster.fy_id == fy_id)

    if stage:
        query = query.filter(Role.role_code == stage)

    if search:
        term = search.strip()
        if search_type == "pat":
            query = query.filter(Entity.pat_reg_number.ilike(f"%{term}%"))
        elif search_type == "entity":
            query = query.filter(Entity.org_name.ilike(f"%{term}%"))

    # ---------------------------------------------
    # Pagination (only when page & page_size are explicitly passed)
    # ---------------------------------------------
    order_by_col = (
        SubmissionMaster.updated_at
        if user_role_code in {"ADM", "SNA", "SPA"}
        else SubmissionMaster.period_id
    )
    ordered_query = query.order_by(order_by_col)

    if page is not None and page_size is not None:
        total = query.count()
        total_pages = ceil(total / page_size) if total > 0 else 0
        rows = ordered_query.offset(
            (page - 1) * page_size
        ).limit(page_size).all()

        return {
            "items": [dict(row._mapping) for row in rows],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    rows = ordered_query.all()
    return [dict(row._mapping) for row in rows]

# ------------- Developers Guide -------------
# If you need to update the line items we required to view in frontend, just change in the response model.
# Currently it is not fully functional. Require future optimization.
@router.get("/form/selective-submission-detail")
def get_compliance_detail(
    request: Request,
    db: Session = Depends(get_db)
):
    logger.info("[GET_COMPLIANCE_DETAIL] Fetching compliance detail")
    # Join master + details in one query (important for performance)
    rows = db.query(
        SubmissionMaster.id.label("submission_id"),
        SubmissionDetails.acronym,
        SubmissionDetails.value
    ).outerjoin(
        SubmissionDetails,
        SubmissionMaster.id == SubmissionDetails.submission_id
    ).all()

    if not rows:
        logger.warning("[GET_COMPLIANCE_DETAIL] No submission data found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No submission data found."
        )

    # Pivot logic
    result = {}

    for row in rows:
        sid = row.submission_id

        # Initialize if not exists
        if sid not in result:
            result[sid] = {
                "id": sid
            }

        # Add dynamic key only if acronym exists
        if row.acronym:
            result[sid][row.acronym] = row.value

    return list(result.values())

# ---------------- Check Quarterly Completion ----------------

@router.get("/form/check-quarterly-submitted")
def check_discom_quarters_completed( request : Request ,
    entity_id: int,
    fy_id: int, 
    db: Session = Depends(get_db)
    ):
    logger.info("[CHECK_DISCOM_QUARTERS] Checking quarterly completion for entity: %s", entity_id)
    if entity_id is None:   
        logger.warning("[CHECK_DISCOM_QUARTERS] Entity ID is required")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Entity ID is required.")
    if entity_id != request.state.entity_id:
        logger.warning("[CHECK_DISCOM_QUARTERS] Forbidden - entity mismatch")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden : You are not authorized to access this data.")
    completed = db.query(SubmissionMaster)\
        .filter(
            SubmissionMaster.entity_id == entity_id,
            SubmissionMaster.fy_id == fy_id,
        )\
        .all()

    if len(completed) < 4:
        return {
            "status": False,
            "message": f"Only {len(completed)} quarter(s) completed. Please complete all 4 to proceed."
        }

    return {
        "status": True,
        "message": "All 4 quarters completed. You may submit the Annual Form.",
        "quarters": [s.period_id for s in completed]
    }

@router.get("from/submit/entity-{entity_id}-fy-{fy_id}", response_model=List[SubmissionDetailResponse])
def get_discom_annual_submission(request: Request, entity_id: int, fy_id: int, db: Session = Depends(get_db)):
    logger.info("[GET_DISCOM_ANNUAL_SUBMISSION] Fetching annual submission for entity: %s", entity_id)
    if entity_id is None:   
        logger.warning("[GET_DISCOM_ANNUAL_SUBMISSION] Entity ID is required")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Entity ID is required.")
    if entity_id != request.state.entity_id:
        logger.warning("[GET_DISCOM_ANNUAL_SUBMISSION] Forbidden - entity mismatch")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: You do not have access to this entity.")
    submission = db.query(SubmissionMaster).filter_by(entity_id=entity_id, fy_id=fy_id).first()

    if not submission:
        return []

    return db.query(SubmissionDetails).filter_by(submission_id=submission.id).all()


@router.get("/from/logic-snapshot", response_model=Dict[str, Any])
def get_flat_logic_snapshot(
    request : Request ,
    entity_id: int = Query(...),
    fy_id: int = Query(...),
    db: Session = Depends(get_db),
):  
  logger.info("[GET_LOGIC_SNAPSHOT] Fetching logic snapshot for entity: %s", entity_id)
  if entity_id is None:   
        logger.warning("[GET_LOGIC_SNAPSHOT] Entity ID is required")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Entity ID is required.")
  if entity_id != request.state.entity_id:
        logger.warning("[GET_LOGIC_SNAPSHOT] Forbidden - entity mismatch")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: You do not have access to this entity.")
  else:
    completed = db.query(SubmissionMaster)\
        .filter(
            SubmissionMaster.entity_id == entity_id,
            SubmissionMaster.fy_id == fy_id,
        )\
        .all()

    if len(completed) < 4:
        logger.warning("[GET_LOGIC_SNAPSHOT] Not all quarters completed for entity: %s", entity_id)
        raise HTTPException(status_code=504, detail="Fill the All Quarter Form")

    filters = [
        SubmissionMaster.entity_id == entity_id,
        SubmissionMaster.fy_id == fy_id,
    ]

    results = (
        db.query(SubmissionMaster.logic_snapshot)
        .filter(*filters)
        .order_by(SubmissionMaster.created_at.desc())
        .all()
    )

    merged_snapshot = {}

    for row in results:
        logic = row[0]  
        print(logic , row )
        if isinstance(logic, tuple) and len(logic) == 1 and isinstance(logic[0], dict):
            logic = logic[0]
        if isinstance(logic, dict):
            merged_snapshot.update(logic)

    if not merged_snapshot:
        logger.warning("[GET_LOGIC_SNAPSHOT] No valid logic snapshot found for entity: %s", entity_id)
        raise HTTPException(status_code=404, detail="No valid logic snapshot found")

    return merged_snapshot

# ---------------- Form Accept / Reject ----------------

@router.post("/form/action/{submission_id}")
def advance_submission(
    request : Request ,
    submission_id: UUID,
    action: str = Body("accept", embed=True),
    remarks: str = Body("", embed=True),
    db: Session = Depends(get_db)
):
    logger.info("[ADVANCE_SUBMISSION] Submission action request received: %s", submission_id)
    if action not in ["accept", "reject"]:
        logger.warning("[ADVANCE_SUBMISSION] Invalid action: %s", action)
        raise HTTPException(400, "Invalid action. Use 'accept' or 'reject'.")
    
    # ------------------------------
    # Fetch submission
    # ------------------------------
    submission = db.get(SubmissionMaster, submission_id)
    
    if not submission:
        logger.warning("[ADVANCE_SUBMISSION] Submission not found: %s", submission_id)
        raise HTTPException(404, "Submission not found")

    if submission.is_closed:
        logger.warning("[ADVANCE_SUBMISSION] Submission already closed: %s", submission_id)
        raise HTTPException(400, "Submission is already closed")
    
    current_stage = submission.stage
    
    form_entity_id = submission.entity_id

    user_role_code = request.state.role_code
    user_entity_id = request.state.entity_id
    user_id = request.state.user_id
    
    # -----------------------------------------------------
    # Helper: Safe fetchers (prevent NoneType exceptions)
    # -----------------------------------------------------
    def get_entity_safe(_id):
        return db.query(Entity).filter(Entity.id == _id).first()

    def get_user_safe(_id):
        return db.query(User).filter(User.id == _id).first()
    
    def check_allow_for_role(_role_code):
        role_detail = db.query(Role).filter(Role.role_code == _role_code).first()
        return role_detail.id
    
    allowed = False
    # -----------------------------------------------------
    # Access Control Logic
    # -----------------------------------------------------
    if (check_allow_for_role(user_role_code) == submission.stage):
        if user_role_code in {"SLR", "USR"}:
            # User can access only their own entity with 
            allowed = (str(form_entity_id) == user_entity_id)

        elif user_role_code in {"SLDC", "SDA"}:
            # Compare state_code of logged-in entity and requested entity
            logged_entity = get_entity_safe(user_entity_id)
            target_entity = get_entity_safe(form_entity_id)

            if logged_entity and target_entity:
                allowed = (logged_entity.state_code == target_entity.state_code)

        elif user_role_code == "AEA":
            # AEA → mapped to entities under the auditor
            logged_user = get_user_safe(user_id)
            if logged_user:
                aea_record = db.query(AEA).filter(AEA.aea_id == logged_user.username).first()
                if aea_record:
                    allowed = db.query(
                        exists().where(
                            EntityFirmAuditorMapping.entity_id == form_entity_id,
                            EntityFirmAuditorMapping.auditor_id == aea_record.id
                        )
                    ).scalar()

        elif user_role_code in {"ADM", "SNA", "SPA"}:
            allowed = True

    # -----------------------------------------------------
    # Access Denied
    # -----------------------------------------------------
    if not allowed:
        logger.warning("[ADVANCE_SUBMISSION] Access denied for role: %s", user_role_code)
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access this data."
        )

    # ------------------------------
    # Fetch workflow
    # ------------------------------
    workflow = db.query(Workflow).filter(
        Workflow.id == submission.workflow_id
    ).first()

    if not workflow:
        logger.warning("[ADVANCE_SUBMISSION] Workflow not found for submission: %s", submission_id)
        raise HTTPException(404, "Workflow not found")

    steps = workflow.steps_json
    if not isinstance(steps, list) or not steps:
        logger.warning("[ADVANCE_SUBMISSION] Invalid workflow step configuration")
        raise HTTPException(500, "Invalid workflow step configuration")

    # ------------------------------
    # Determine current stage index
    # ------------------------------
    try:
        current_index = steps.index(submission.stage)
    except ValueError:
        current_index = 0  # fallback if stage corrupted

    # ------------------------------
    # Move the stage depending on action
    # ------------------------------
    if action == "accept":
        # If current stage is last → close form
        if current_index == len(steps) - 1:
            submission.is_closed = 1
            submission.status = SubmissionStatusEnum.APPROVED
            new_stage = submission.stage
            history_action = StageActionStatusEnum.APPROVED
        else:
            new_stage = steps[current_index + 1]
            submission.status = SubmissionStatusEnum.IN_PROGRESS
            submission.stage = new_stage
            history_action = StageActionStatusEnum.APPROVED

    elif action == "reject":
        new_stage = steps[0]

        submission.is_closed = 0
        submission.status = SubmissionStatusEnum.REJECTED
        submission.stage = new_stage
        history_action = StageActionStatusEnum.SENT_BACK

    else:
        raise HTTPException(400, "Invalid action. Use 'accept' or 'reject'.")

   # ------------------------------
    # Save stage history
    # ------------------------------
    history_entry = SubmissionStageHistory(
        submission_id=submission.id,
        stage_number=current_stage,
        action_status=history_action,
        action_by=user_id,
        comments=remarks or f"Submission {history_action.value.lower().replace('_', ' ')}.",
    )

    db.add(history_entry)
    db.commit()
    db.refresh(submission)

    logger.info("[ADVANCE_SUBMISSION] Submission %s advanced successfully, action: %s", submission_id, history_action.value)
    return {
        "submission_id": submission.id,
        "stage": submission.stage,
        "is_closed": submission.is_closed,
        "action": history_action.value,
    }

@router.get("/form/submission-history", response_model=list[SubmissionStageHistoryResponse])
def get_submission_stage_history(
    request : Request,
    submission_id: UUID,
    db: Session = Depends(get_db)
):
    logger.info("[GET_SUBMISSION_STAGE_HISTORY] Fetching stage history for submission: %s", submission_id)
    # ------------------------------
    # Fetch submission
    # ------------------------------
    submission = db.get(SubmissionMaster, submission_id)
    
    if not submission:
        logger.warning("[GET_SUBMISSION_STAGE_HISTORY] Submission not found: %s", submission_id)
        raise HTTPException(404, "Submission not found")
    
    form_entity_id = submission.entity_id

    user_role_code = request.state.role_code
    user_entity_id = request.state.entity_id
    user_id = request.state.user_id
    
    # -----------------------------------------------------
    # Helper: Safe fetchers (prevent NoneType exceptions)
    # -----------------------------------------------------
    def get_entity_safe(_id):
        return db.query(Entity).filter(Entity.id == _id).first()

    def get_user_safe(_id):
        return db.query(User).filter(User.id == _id).first()

    allowed = False

    # -----------------------------------------------------
    # Access Control Logic
    # -----------------------------------------------------
    if user_role_code in {"SLR", "USR"}:
        # User can access only their own entity
        allowed = (str(form_entity_id) == user_entity_id)

    elif user_role_code in {"SLDC", "SDA"}:
        # Compare state_code of logged-in entity and requested entity
        logged_entity = get_entity_safe(user_entity_id)
        target_entity = get_entity_safe(form_entity_id)

        if logged_entity and target_entity:
            allowed = (logged_entity.state_code == target_entity.state_code)

    elif user_role_code in {"ADM", "SNA", "SPA"}:
        allowed = True

    # -----------------------------------------------------
    # Access Denied
    # -----------------------------------------------------
    if not allowed:
        logger.warning("[GET_SUBMISSION_STAGE_HISTORY] Access denied for role: %s", user_role_code)
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access this data."
        )
    
    history = (
        db.query(
            SubmissionStageHistory.id,
            SubmissionStageHistory.submission_id,
            SubmissionStageHistory.stage_number,
            SubmissionStageHistory.action_status,
            SubmissionStageHistory.comments,
            SubmissionStageHistory.action_by,
            SubmissionStageHistory.action_at,
            SubmissionStageHistory.attachments,
            Role.role_name,
        )
        .outerjoin(Role, SubmissionStageHistory.stage_number == Role.id)
        .filter(SubmissionStageHistory.submission_id == submission_id)
        .order_by(SubmissionStageHistory.action_at.desc())
        .all()
    )
        
    if not history:
        logger.warning("[GET_SUBMISSION_STAGE_HISTORY] No stage history found for submission: %s", submission_id)
        raise HTTPException(status_code=404, detail="No stage history found for this submission")

    result = []
    for row in history:
        mapped = row._mapping

        result.append(
            SubmissionStageHistoryResponse(
                id=mapped["id"],
                submission_id=mapped["submission_id"],
                stage_number=mapped["stage_number"],
                action_status=mapped["action_status"].value,
                comments=mapped["comments"],
                action_by=mapped["action_by"],
                action_at=mapped["action_at"],
                attachments=mapped["attachments"],
                role_name=mapped["role_name"],
            )
        )

    return result

@router.put("/form/update-workflow")
def update_workflow(
    request : Request ,
    form_id: UUID = Body(...), 
    workflow_id: int = Body(...), 
    db: Session = Depends(get_db)
    ): 
    logger.info("[UPDATE_WORKFLOW] Update workflow request received for form: %s", form_id)
    submission = db.query(SubmissionMaster).filter(SubmissionMaster.id == form_id).first()
    if not submission:
        logger.warning("[UPDATE_WORKFLOW] SubmissionMaster not found: %s", form_id)
        raise HTTPException(status_code=404, detail="SubmissionMaster not found")
    
    if str(submission.entity_id) != request.state.entity_id:
        logger.warning("[UPDATE_WORKFLOW] Forbidden - entity mismatch")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden : You are not authorized to perform this action.")
    
    setattr(submission, 'workflow_id', workflow_id)
    
    db.commit()
    db.refresh(submission)
    logger.info("[UPDATE_WORKFLOW] Workflow updated successfully for form: %s", form_id)
    return {"message": "Workflow updated successfully", "form_id": form_id, "workflow_id": workflow_id}


@router.get("/form/uploads/entity-{entity_id}-fy-{fy_id}-period-{period_id}", response_model=dict)
def get_uploads(
    request: Request,
    entity_id: UUID,
    fy_id: int,
    period_id: int,
    db: Session = Depends(get_db)
):
    logger.info("[GET_UPLOADS] Fetching uploads for entity: %s", entity_id)
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
        logger.warning("[GET_UPLOADS] Access denied for role: %s", user_role_code)
        raise HTTPException(
            status_code=403,
            detail="Forbidden : You are not authorized to access this data."
        )

    try:
          record = (
            db.query(SubmissionMaster.uploads)
            .filter(
                SubmissionMaster.entity_id == entity_id,
                SubmissionMaster.fy_id == fy_id,
                SubmissionMaster.period_id == period_id
            )
            .first()
            )

          if not record:
            logger.warning("[GET_UPLOADS] No uploads found for entity: %s", entity_id)
            raise HTTPException(status_code=404, detail="No uploads found for the given parameters.")

          uploads_data = record.uploads

         # Handle both JSON string and list formats
          if isinstance(uploads_data, str):
            try:
                uploads_list: Union[List[str], None] = json.loads(uploads_data)
            except json.JSONDecodeError:
                uploads_list = [uploads_data]  # fallback: single file path
          elif isinstance(uploads_data, list):
            uploads_list = uploads_data
          else:
            uploads_list = []

          return {"uploads": uploads_list}

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Something went wrong")


@router.get("/form/export-excel/entity-{entity_id}-fy-{fy_id}-period-{period_id}")
def download_submission_excel(
    entity_id: UUID,
    period_id: int,
    fy_id: int,
    db: Session = Depends(get_db)
):
    entity_details = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity_details:
        raise HTTPException(status_code=404, detail="Entity details not found")
    
    logger.info("[DOWNLOAD_SUBMISSION_EXCEL] Exporting Excel for entity: %s", entity_id)
    existing_submission = db.query(SubmissionMaster).filter(
            and_(
                SubmissionMaster.entity_id == entity_id,
                SubmissionMaster.fy_id == fy_id,
                SubmissionMaster.period_id == period_id
                )
            ).first()
    
    entity_type = entity_details.entity_type
    if entity_type == 'DISCOM':
        raise HTTPException(status_code=501, detail="Discom Form download feature is not available now.")

    buffer = export_submission_excel(db, existing_submission.id)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": (
                f"attachment; filename=submission_{existing_submission.id}.xlsx"
            )
        }
    )
    
@router.get("/form/annual-submission-status")
def check_annual_submission_status(
    request : Request ,
    fy_id: int,
    db: Session = Depends(get_db)
    ):
    logger.info("[CHECK_ANNUAL_SUBMISSION_STATUS] Checking annual submission status for fy: %s", fy_id)
    if request.state.entity_id is None:   
        logger.warning("[CHECK_ANNUAL_SUBMISSION_STATUS] Entity ID is required")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Entity ID is required.")
    
    period_data = db.query(SubmissionPeriod).filter(SubmissionPeriod.fy_id == fy_id, SubmissionPeriod.period_code == 'ANNUAL').first()
    period_id = period_data.id if period_data else None
    
    if not period_id:
        logger.warning("[CHECK_ANNUAL_SUBMISSION_STATUS] Financial year or period not found for fy: %s", fy_id)
        raise HTTPException(status_code=404, detail="Financial year or period not found")  
    
    annual_submission = (
        db.query(
            SubmissionMaster.is_closed,
            SubmissionMaster.stage,
            Role.role_name.label("stage_name")
        )
        .join(Role, SubmissionMaster.stage == Role.id)
        .filter(
            SubmissionMaster.entity_id == request.state.entity_id,
            SubmissionMaster.fy_id == fy_id,
            SubmissionMaster.period_id == period_id
        )
        .first()
    )
    
    if annual_submission:
        return {
            "submitted": True if annual_submission.is_closed == 1 else False,
            "stage": annual_submission.stage_name
        }
        