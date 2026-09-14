from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timezone
from decimal import Decimal
from src.database import get_db
from src.utils.validation import validate_file
from src.utils.security import verify_user_access
from src.services.storage_service import get_storage, StorageService
from src.services.compliance_service import get_compliance_summary, get_corp_compliance_summary
from src.models import (
    RECMaster,
    SubmissionMaster,
    SubmissionDetails,
    SubmissionPeriod,
    Entity,
    Payment,
    PaymentCategoryMaster,
    BuyoutRequest,
    ComplianceStatus,
    CorpChild
)
from src.schemas import (
    RECPurchaseRequest,
    BuyoutRequestActionPayload,
    BuyoutStatusResponse,
    BuyoutRequestListItemResponse,
    PurchasedRecsResponse
)
from src.utils.enums import ComplianceStatusEnum, BuyoutRequestStatusEnum, BuyoutTypeEnum, EntityTypeEnum

import logging
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Buyout"])

# ------------------------------------ Helper Functions ------------------------------------
def is_corporate(entity):
    return (
        entity.entity_type == EntityTypeEnum.NOBE
        and entity.sector_code == "CORP"
    )

# ------------------------------------ API Endpoints ------------------------------------

@router.get("/buyout/purchased-recs", response_model=PurchasedRecsResponse)
def get_purchased_recs(
    request: Request,
    fy_id: int,
    db: Session = Depends(get_db)
):
    access_roles = {"SLR"}
    verify_user_access(request, access_roles, db)

    entity_id = request.state.entity_id
    purchased_recs = db.query(RECMaster).filter(RECMaster.entity_id == entity_id, RECMaster.fy_id == fy_id).all()
    
    return {"data": purchased_recs}


@router.post("/buyout/buy-recs")
def buy_recs(
    request: Request,
    payload: RECPurchaseRequest,
    db: Session = Depends(get_db)
):
    access_roles = {"SLR"}
    verify_user_access(request, access_roles, db)

    entity_id = request.state.entity_id
    
    entity_details = db.query(Entity).filter(Entity.id == entity_id).first()

    entity_type = entity_details.entity_type if entity_details else None

    total_recs = db.query(
        func.coalesce(func.sum(RECMaster.number_of_recs), 0)
    ).filter(
        RECMaster.entity_id == entity_id,
        RECMaster.fy_id == payload.fy_id
    ).scalar()
    
    period_data = db.query(SubmissionPeriod).filter(SubmissionPeriod.fy_id == payload.fy_id, SubmissionPeriod.period_code == 'ANNUAL').first()
    period_id = period_data.id if period_data else None
    
    if not period_id:
        logger.warning("[BUY_RECS] Financial year or period not found")
        raise HTTPException(status_code=404, detail="Financial year or period not found")  
    
    compliance_summary_data = db.query(SubmissionMaster).filter(SubmissionMaster.entity_id == entity_id, SubmissionMaster.period_id == period_id, SubmissionMaster.fy_id == payload.fy_id).first()
    submission_id = compliance_summary_data.id if compliance_summary_data else None

    if not submission_id:
        logger.warning("[BUY_RECS] Submission data not found for the given financial year")
        raise HTTPException(status_code=404, detail="Submission data not found for the given financial year")
    
    submission_details = db.query(SubmissionDetails).filter(SubmissionDetails.submission_id == submission_id).all()
    
    # Convert list of rows into a dictionary: {acronym: value}
    summary = {row.acronym: row.value for row in submission_details}
    if entity_type == "DISCOM":
        surplus_deficit = summary.get("EE", 0)
    elif entity_type == "INDUSTRY":
        surplus_deficit = summary.get("C2", 0)
    else:
        logger.warning("[BUY_RECS] Invalid entity type for REC purchase")
        raise HTTPException(status_code=400, detail="Invalid entity type for REC purchase")

    shortfall = (
        abs(surplus_deficit) * 1000
        if surplus_deficit < 0
        else 0
    )
    
    if payload.number_of_recs+total_recs > shortfall:
        logger.warning("[BUY_RECS] Number of RECs to purchase cannot exceed the shortfall amount")
        raise HTTPException(status_code=400, detail=f"Number of RECs to purchase cannot exceed the shortfall amount")
    
    #create buyout master entry
    buyout_master = RECMaster(
        entity_id=entity_id,
        fy_id=payload.fy_id,
        target=shortfall,
        number_of_recs=payload.number_of_recs,
        created_at = payload.purchase_date
    )
    db.add(buyout_master)
    db.commit()
    
    logger.info("[BUY_RECS] REC purchase processed successfully")
    return {"message": "REC purchase processed successfully"}


@router.post("/buyout/buyout-request")
def create_buyout_request(
    request: Request,
    fy_id: int = Form(...),
    shortfall_amount: float = Form(...),
    payable_amount: float = Form(...),
    utr_number: str = Form(...),
    payment_date: date = Form(...),
    payment_proof: UploadFile = File(...),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage)
):
    logger.info("[CREATE_BUYOUT_REQUEST] Request received")
    access_roles = {"SLR", "CORP"}
    verify_user_access(request, access_roles, db)

    entity_id = request.state.entity_id
    user_id = request.state.user_id
    role_code = request.state.role_code

    validate_file(payment_proof, 5)

    entity = (
        db.query(Entity)
        .filter(Entity.id == entity_id)
        .first()
    )

    if not entity:
        logger.warning("[CREATE_BUYOUT_REQUEST] Entity not found")
        raise HTTPException(
            status_code=404,
            detail="Entity not found"
        )
    
    # Prevent duplicate requests
    existing_request = (
        db.query(BuyoutRequest)
        .filter(
            BuyoutRequest.entity_id == entity_id,
            BuyoutRequest.fy_id == fy_id,
            BuyoutRequest.status.in_([
                BuyoutRequestStatusEnum.SUBMITTED,
                BuyoutRequestStatusEnum.APPROVED
            ])
        )
        .first()
    )
    existing_compliance = (
        db.query(ComplianceStatus)
        .filter(
            ComplianceStatus.entity_id == entity_id,
            ComplianceStatus.fy_id == fy_id,
            ComplianceStatus.status.in_([
                ComplianceStatusEnum.PENDING,
                ComplianceStatusEnum.COMPLIANT
            ])
        )
        .first()
    )

    if existing_request or existing_compliance:
        logger.warning("[CREATE_BUYOUT_REQUEST] Buyout request already exists for this financial year")
        raise HTTPException(
            status_code=400,
            detail="Buyout request already exists for this financial year."
        )

    if role_code == 'SLR':
        complianceSummary = get_compliance_summary(fy_id, entity_id, entity.entity_type, db)
        purchased_rec_total = db.query(
                func.coalesce(func.sum(RECMaster.number_of_recs), 0)
            ).filter(
            RECMaster.entity_id == entity_id,
            RECMaster.fy_id == fy_id
        ).scalar()
    elif role_code == 'CORP':
        complianceSummary = get_corp_compliance_summary(entity_id, fy_id, db)
        purchased_rec_total = complianceSummary.get("total_recs",0)

    surplus_deficit = complianceSummary.get("surplus_deficit", 0)
    deficit = abs(min(surplus_deficit, 0)) * 1000
    shortfall = Decimal(deficit - purchased_rec_total)

    if shortfall != shortfall_amount:
        logger.warning("[CREATE_BUYOUT_REQUEST] Shortfall amount is not same as calculated.")
        raise HTTPException(
            status_code=400,
            detail="Shortfall amount is not same as calculated."
        )

    buyout_rate = db.query(PaymentCategoryMaster.amount).filter(
            PaymentCategoryMaster.category_code == "BUYOUT",
            PaymentCategoryMaster.fy_id == fy_id,
            PaymentCategoryMaster.is_active == True
        ).scalar()
    
    if payable_amount != shortfall * buyout_rate:
        logger.warning("[CREATE_BUYOUT_REQUEST] Payment amount is not same as calculated.")
        raise HTTPException(
            status_code=400,
            detail="Payment amount is not same as calculated."
        )
    
    try:
        # Save file to storage
        file_content = payment_proof.file.read()
        document_url = storage.save_file(file_content, payment_proof.filename, folder="uploads/buyout")

        buyout_request = BuyoutRequest(
            entity_id=entity_id,
            fy_id=fy_id,
            buyout_type=(
                BuyoutTypeEnum.CORPORATE
                if is_corporate(entity)
                else BuyoutTypeEnum.INDIVIDUAL
            ),
            shortfall_amount=shortfall_amount,
            payable_amount=payable_amount,
            utr_number=utr_number,
            payment_date=payment_date,
            document_url=document_url,
            status=BuyoutRequestStatusEnum.SUBMITTED,
            submitted_by=user_id
        )

        db.add(buyout_request)
        db.flush()

        compliance_records = []

        # Parent entity compliance record
        compliance_records.append(
            ComplianceStatus(
                entity_id=entity_id,
                fy_id=fy_id,
                status=ComplianceStatusEnum.PENDING,
                buyout_request_id=buyout_request.id
            )
        )
        # Corporate → create records for all active children
        if is_corporate(entity):
            children = (
                db.query(CorpChild)
                .filter(
                    CorpChild.parent_entity_id == entity_id,
                    CorpChild.fy_id == fy_id,
                    CorpChild.status == True,
                    CorpChild.is_active == True
                )
                .all()
            )

            for child in children:

                existing_child = (
                    db.query(ComplianceStatus)
                    .filter(
                        ComplianceStatus.entity_id == child.child_entity_id,
                        ComplianceStatus.fy_id == fy_id
                    )
                    .first()
                )

                if existing_child:
                    continue

                compliance_records.append(
                    ComplianceStatus(
                        entity_id=child.child_entity_id,
                        fy_id=fy_id,
                        status=ComplianceStatusEnum.PENDING,
                        buyout_request_id=buyout_request.id
                    )
                )
        db.add_all(compliance_records)

        db.commit()

        logger.info("[CREATE_BUYOUT_REQUEST] Buyout request submitted successfully")
        return {
            "message": "Buyout request submitted successfully.",
            "buyout_request_id": str(buyout_request.id),
            "status": "PENDING_APPROVAL"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.put("/buyout/admin-action/{buyout_request_id}")
def update_buyout_request_status(
    buyout_request_id: str,
    payload: BuyoutRequestActionPayload,
    request: Request,
    db: Session = Depends(get_db)
):
    access_roles = {"ADM"}
    verify_user_access(request, access_roles, db)

    buyout_request = (
        db.query(BuyoutRequest)
        .filter(BuyoutRequest.id == buyout_request_id)
        .first()
    )

    if not buyout_request:
        logger.warning("[UPDATE_BUYOUT_REQUEST_STATUS] Buyout request not found")
        raise HTTPException(
            status_code=404,
            detail="Buyout request not found"
        )

    if buyout_request.status != BuyoutRequestStatusEnum.SUBMITTED:
        logger.warning("[UPDATE_BUYOUT_REQUEST_STATUS] Buyout request already processed")
        raise HTTPException(
            status_code=400,
            detail="Buyout request already processed"
        )

    try:

        compliance_records = (
            db.query(ComplianceStatus)
            .filter(
                ComplianceStatus.buyout_request_id == buyout_request.id
            )
            .all()
        )

        if payload.action == "APPROVE":

            buyout_request.status = BuyoutRequestStatusEnum.APPROVED
            buyout_request.approved_at = datetime.now(timezone.utc)

            for record in compliance_records:
                record.status = ComplianceStatusEnum.COMPLIANT

            new_buyout_payment = Payment(
                user_id=request.state.user_id,
                entity_id=buyout_request.entity_id,
                category="BUYOUT",
                payment_amount=buyout_request.payable_amount,
                payment_currency="INR",
                transaction_ref_id=buyout_request.utr_number,
                transaction_date=buyout_request.payment_date,
                payment_status="SUCCESS",
                payment_mode="OFFLINE"
            )
            db.add(new_buyout_payment)

        elif payload.action == "REJECT":

            buyout_request.status = BuyoutRequestStatusEnum.REJECTED
            buyout_request.rejection_reason = payload.remarks

            for record in compliance_records:
                record.status = ComplianceStatusEnum.REJECTED

        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid action"
            )

        db.commit()

        logger.info(f"[UPDATE_BUYOUT_REQUEST_STATUS] Buyout request {payload.action.lower()}d successfully")
        return {
            "message": f"Buyout request {payload.action.lower()}d successfully"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    

@router.get("/buyout/buyout-status", response_model= BuyoutStatusResponse)
def get_buyout_status(
    fy_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    access_roles = {"SLR", "CORP"}
    verify_user_access(request, access_roles, db)

    entity_id = request.state.entity_id
    
    compliance_record = (
        db.query(ComplianceStatus)
        .filter(
            ComplianceStatus.entity_id == entity_id,
            ComplianceStatus.fy_id == fy_id
        )
        .order_by(ComplianceStatus.created_at.desc())
        .first()
    )

    if not compliance_record:
        return {
            "status": "NON_COMPLIANT"
        }

    buyout_request = (
        db.query(BuyoutRequest)
        .filter(
            BuyoutRequest.id ==
            compliance_record.buyout_request_id
        )
        .order_by(BuyoutRequest.created_at.desc())
        .first()
    )

    response = {
        "status": compliance_record.status
    }

    if buyout_request:

        response["buyout_request_id"] = str(
            buyout_request.id
        )

        response["utr_number"] = buyout_request.utr_number
        response["payment_date"] = buyout_request.payment_date
        response["buyout_type"] = buyout_request.buyout_type
        response["submitted_by"] = buyout_request.submitted_by
        response["document_url"] = buyout_request.document_url

        if compliance_record.status == ComplianceStatusEnum.PENDING:
            response["submitted_on"] = (
                buyout_request.created_at
            )

        elif compliance_record.status == ComplianceStatusEnum.COMPLIANT:
            response["approved_on"] = (
                buyout_request.approved_at
            )

        elif compliance_record.status == ComplianceStatusEnum.REJECTED:
            response["remarks"] = (
                buyout_request.rejection_reason
            )

    return response


@router.get("/buyout/get-buyout-request-list", response_model=list[BuyoutRequestListItemResponse])
def get_buyout_requests(
    request: Request,
    db: Session = Depends(get_db)
):
    access_roles = {"ADM"}
    verify_user_access(request, access_roles, db)
    
    buyout_requests = (
        db.query(
            BuyoutRequest,
            Entity
        )
        .join(
            Entity,
            Entity.id == BuyoutRequest.entity_id
        )
        .order_by(
            BuyoutRequest.created_at.desc()
        )
        .all()
    )

    response = []

    for buyout_request, entity in buyout_requests:

        response.append({
            "buyout_request_id": str(buyout_request.id),
            "entity_id": str(buyout_request.entity_id),
            "entity_reg_no": entity.entity_reg_no,
            "entity_name": entity.org_name,
            "sector_type": entity.sector_code,
            "state_code": entity.state_code,
            "fy_id": buyout_request.fy_id,
            "buyout_type": buyout_request.buyout_type,
            "shortfall_amount": buyout_request.shortfall_amount,
            "payable_amount": float(buyout_request.payable_amount),
            "utr_number": buyout_request.utr_number,
            "payment_date": buyout_request.payment_date,
            "status": buyout_request.status,
            "created_at": buyout_request.created_at,
            "submitted_by": buyout_request.submitted_by,
            "document_url": buyout_request.document_url,
            "approved_at": buyout_request.approved_at
        })

    return response