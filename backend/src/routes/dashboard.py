from uuid import UUID
from sqlalchemy import func
from src.utils.security import verify_user_access
from fastapi import APIRouter, Depends, Request, HTTPException
from src.utils.TrackingRouter import TrackingRouter
from ..utils.enums import ComplianceStatusEnum
from sqlalchemy.orm import Session
from src.database import get_db
from src.models import (
    User,
    Entity,
    Sectors,
    State,
    RECMaster,
    FinancialYear,
    SubmissionPeriod,
    BuyoutRequest,
    ComplianceStatus,
    SubmissionMaster,
    SubmissionDetails,
    SubmissionPeriod
)
from src.services.dashboard_service import get_sldc_dashboard, get_sda_dashboard, get_mop_dashboard
from src.services.compliance_service import get_compliance_summary

import logging
logger = logging.getLogger(__name__)

router = TrackingRouter(tags=["Dashboard"])

@router.get("/dashboard/get-summary-detail")
def dashboard_summary(request: Request, fy_id: int, db: Session = Depends(get_db)):
    user_id = getattr(request.state, "user_id", None)
    role_code = getattr(request.state, "role_code", None)

    access_roles = {"SLDC", "SDA", "SLR", "ADM"}
    verify_user_access(request, access_roles, db)

    user = db.query(User).filter(User.id == user_id).first()

    if role_code == "SLDC":
        return get_sldc_dashboard(db, user, fy_id)

    elif role_code == "SDA":
        return get_sda_dashboard(db, user, fy_id)

@router.get("/dashboard/mop-summary")
def mop_dashboard_summary(request: Request, fy_id: int, db: Session = Depends(get_db)):
    access_roles = {"MOP", "ADM"}
    verify_user_access(request, access_roles, db)

    return get_mop_dashboard(db, fy_id)

@router.get("/form/compliance-summary")
def compliance_summary(
    request: Request,
    type: str,
    entity_id : UUID,
    fy_id: int,
    db: Session = Depends(get_db)
):
    access_roles = {"SLR"}
    verify_user_access(request, access_roles, db)

    user_entity_id = getattr(request.state, "entity_id", None)

    if str(entity_id) != str(user_entity_id):
        logger.warning("[COMPLIANCE_SUMMARY] Forbidden - can only access own entity data")
        raise HTTPException(status_code=403, detail="Forbidden. You can only access your own entity's data.")
    
    response_data = get_compliance_summary(fy_id, entity_id, type, db)

    return {
        "status": "success",
        "data": response_data
    }

# --------------------- Partially Completed API -----------------------
@router.get("/form/compliance-certificate-data")
async def compliance_data(
    request: Request,
    fy_id: int,
    db: Session = Depends(get_db)
):
    access_roles = {'SLR'}
    verify_user_access(request, access_roles, db)

    user_entity_id = getattr(request.state, "entity_id", None)
    if not user_entity_id:
        raise HTTPException(status_code=404, detail="Unknowd User access. Entity ID not found.")

    buyout_compliant_data = db.query(ComplianceStatus).filter(ComplianceStatus.entity_id == user_entity_id, ComplianceStatus.fy_id == fy_id).first()
    # check if this entity_id and fy has any row in ComplianceStatus table- if yes check if Compliant if no throw error that it is still pending from Approval from Admin
    # and if no data then check if SubmissionDetails is actually 0 in Compliance MU then proceed and if no then throw error that someting is wrong.
    # buyout_compliant_data.status != ComplianceStatusEnum.COMPLIANT
        
    
    entity_details = db.query(Entity).filter(Entity.id == user_entity_id).first()

    org_name = entity_details.org_name
    reg_no = entity_details.entity_reg_no

    submission_master_details = db.query(SubmissionMaster).filter(SubmissionMaster.entity_id == user_entity_id, SubmissionMaster.fy_id == fy_id).first()
    sub_master_id = submission_master_details.id
    submission_details = db.query(SubmissionDetails).filter(SubmissionDetails.submission_id == sub_master_id).all()

    no_of_recs = db.query(sum(RECMaster.number_of_recs)).filter(RECMaster.entity_id == user_entity_id, RECMaster.fy_id == fy_id).all()

    # check if this entity_id and fy has any row in BuyoutRequest table else return 0
    buyout_details = db.query(BuyoutRequest).filter(BuyoutRequest.entity_id == user_entity_id, BuyoutRequest.fy_id == fy_id).first()
    rco_target_mu = submission_details.ATarget
    re_cert = submission_details.U1+submission_details.V1 + no_of_recs


@router.get("/form/form-d-generate")
async def generate_form_d_data(
    request: Request,
    fy_id: int,
    db: Session = Depends(get_db)
):
    access_roles = {'SLR'}
    verify_user_access(request, access_roles, db)

    user_entity_id = getattr(request.state, "entity_id", None)
    if not user_entity_id:
        raise HTTPException(status_code=404, detail="Unknowd User access. Entity ID not found.")

    # ------------------------------------------------------------------
    # ENTITY DETAILS
    # ------------------------------------------------------------------

    entity_details = (
        db.query(
            Entity,
            Sectors.sector_name,
            State.state_name
        )
        .join(
            Sectors,
            Sectors.sector_code == Entity.sector_code
        )
        .join(
            State,
            State.state_code == Entity.state_code
        )
        .filter(
            Entity.id == user_entity_id
        )
        .first()
    )

    if not entity_details:
        raise HTTPException(
            status_code=404,
            detail="Entity not found"
        )

    entity, sector_type, state_name  = entity_details

    entity_type = (
        entity.entity_type.value
        if hasattr(entity.entity_type, "value")
        else entity.entity_type
    )

    # ------------------------------------------------------------------
    # SUBMISSION MASTER
    # ------------------------------------------------------------------
    
    submission_master_details = (
        db.query(
            SubmissionMaster,
            FinancialYear.fy_code,
            SubmissionPeriod.period_code
        )
        .join(
            FinancialYear,
            SubmissionMaster.fy_id == FinancialYear.id
        )
        .join(
            SubmissionPeriod,
            SubmissionMaster.period_id == SubmissionPeriod.id
        )
        .filter(
            SubmissionMaster.entity_id == user_entity_id,
            SubmissionMaster.fy_id == fy_id,
            SubmissionPeriod.period_code == "ANNUAL"
        )
        .first()
    )

    if not submission_master_details:
        raise HTTPException(
            status_code=404,
            detail="Submission not found for this entity and financial year"
        )

    submission_master, fy_code, period_code = submission_master_details

    # ------------------------------------------------------------------
    # SUBMISSION DETAILS
    # ------------------------------------------------------------------

    submission_details = (
        db.query(SubmissionDetails)
        .filter(
            SubmissionDetails.submission_id == submission_master.id
        )
        .all()
    )

    if not submission_details:
        raise HTTPException(
            status_code=404,
            detail="Submission details not found"
        )
    
    # Convert list of rows into a dictionary: {acronym: value}
    summary = {
        row.acronym: row.value
        for row in submission_details
    }

    # ------------------------------------------------------------------
    # COMPLIANCE STATUS
    # ------------------------------------------------------------------

    compliance_status = (
        db.query(ComplianceStatus)
        .filter(
            ComplianceStatus.entity_id == user_entity_id
        )
        .first()
    )
    if (
        compliance_status
        and
        compliance_status.status != ComplianceStatusEnum.COMPLIANT
    ):
        raise HTTPException(
            status_code=400,
            detail="Buyout request is pending approval"
        )

    # ------------------------------------------------------------------
    # REC CALCULATION
    # ------------------------------------------------------------------

    total_number_of_recs = (
        db.query(
            func.coalesce(
                func.sum(RECMaster.number_of_recs),
                0
            )
        )
        .filter(
            RECMaster.entity_id == user_entity_id
        )
        .scalar()
        or 0
    )

    rec_purchased_from_submission = int(
        (
            summary.get("op")
            if entity_type == "DISCOM"
            else summary.get("U1")
        ) or 0
    )

    rec_self_retained = int(
        (
            summary.get("po")
            if entity_type == "DISCOM"
            else summary.get("V1")
        ) or 0
    )

    rec_purchased = (
        total_number_of_recs
        + rec_purchased_from_submission
    )

    rec_total = (
        rec_purchased
        + rec_self_retained
    ) / 1000

    # ------------------------------------------------------------------
    # BUYOUT DETAILS
    # ------------------------------------------------------------------

    buyout_details = (
        db.query(BuyoutRequest)
        .filter(
            BuyoutRequest.entity_id == user_entity_id,
            BuyoutRequest.fy_id == fy_id
        )
        .first()
    )

    shortfall = float(
        buyout_details.shortfall_amount
        if buyout_details
        else 0
    )
    buyout_total = shortfall/1000

    # ------------------------------------------------------------------
    # DISCOM FORM D
    # ------------------------------------------------------------------

    if entity_type == "DISCOM":

        response_data = {
            "discomName": entity.org_name,
            "registrationNo": entity.entity_reg_no,
            "targetYear": fy_code,
            "compliancePeriod": period_code,
            "state": state_name,

            # ==========================================================
            # PART A
            # ==========================================================

            "partA": {

                # Total Consumption
                "totalConsumption": summary.get("K"),

                # RCO (%) specified by MoP
                "rcoPercent": {
                    "wind": summary.get("ZT1"),
                    "hydro": summary.get("ZT2"),
                    "distributed": summary.get("ZT3"),
                    "other": summary.get("ZT4"),
                    "total": summary.get("ZTT"),
                },

                # MoP Renewable Consumption Obligation Target
                "obligationTarget": {
                    "wind": summary.get("AT1"),
                    "hydro": summary.get("AT2"),
                    "distributed": summary.get("AT3"),
                    "other": summary.get("AT4"),
                    "total": summary.get("ATT"),
                },

                # Surplus / Deficit
                "surplusDeficit": {
                    "wind": summary.get("EE1"),
                    "hydro": summary.get("EE2"),
                    "distributed": summary.get("EE3"),
                    "other": summary.get("EE4"),
                    "total": summary.get("EE"),
                },

                # Compliance
                "compliance": {
                    "wind": summary.get("Ft1"),
                    "hydro": summary.get("Ft2"),
                    "distributed": summary.get("Ft3"),
                    "other": summary.get("Ft4"),
                    "total": summary.get("FtT"),
                },

                # Compliance %
                "compliancePercent": {
                    "wind": summary.get("FT1"),
                    "hydro": summary.get("FT2"),
                    "distributed": summary.get("FT3"),
                    "other": summary.get("FT4"),
                    "total": summary.get("FTT"),
                },

                # Surplus / Deficit %
                "surplusDeficitPercent": {
                    "wind": summary.get("GT1"),
                    "hydro": summary.get("GT2"),
                    "distributed": summary.get("GT3"),
                    "other": summary.get("GT4"),
                    "total": summary.get("GTT"),
                },
            },

            # ==========================================================
            # PART B
            # ==========================================================

            "partB": {

                # Total RECs
                "recsTotal": rec_total,

                # RECs Purchased
                "recsPurchased": rec_purchased,

                # RECs Self Retained
                "recsSelfRetained": rec_self_retained,

                # Buyout Amount / Total Buyout
                "buyoutsTotal": shortfall,

                # REC certificates purchased for buyout
                "buyoutCertsPurchased": 0,

                # Total Compliance
                "totalCompliance": (
                    rec_total
                    + shortfall
                ),
            },

            # ==========================================================
            # PART C
            # ==========================================================

            "partC": {

                # Surplus / Deficit
                "surplusDeficit": {
                    "wind": summary.get("EE1"),
                    "hydro": summary.get("EE2"),
                    "distributed": summary.get("EE3"),
                    "other": summary.get("EE4"),
                    "total": summary.get("EE"),
                },

                # Compliance
                "compliance": {
                    "wind": summary.get("Ft1"),
                    "hydro": summary.get("Ft2"),
                    "distributed": summary.get("Ft3"),
                    "other": summary.get("Ft4"),
                    "total": summary.get("FtT"),
                },

                # Compliance %
                "compliancePercent": {
                    "wind": summary.get("FT1"),
                    "hydro": summary.get("FT2"),
                    "distributed": summary.get("FT3"),
                    "other": summary.get("FT4"),
                    "total": summary.get("FTT"),
                },

                # Surplus / Deficit %
                "surplusDeficitPercent": {
                    "wind": summary.get("GT1"),
                    "hydro": summary.get("GT2"),
                    "distributed": summary.get("GT3"),
                    "other": summary.get("GT4"),
                    "total": summary.get("GTT"),
                },
            },

            # Optional raw values if needed elsewhere
            "rec_purchased": rec_purchased,
            "rec_self_retained": rec_self_retained,
            "recs": rec_total,
            "shortfall": shortfall,
        }

    # ------------------------------------------------------------------
    # NON-DISCOM FORM D
    # ------------------------------------------------------------------

    else:

        response_data = {
            "sectionA" : {
                "dcName": entity.org_name,
                "sector": sector_type,
                "registrationNo": entity.entity_reg_no,
                "obligationType": entity_type,
                "targetYear": fy_code,
                "compliancePeriod": period_code,
            },
            "sectionB" : {
                "grossConsumption": summary.get("K"),
                "rcoPercent": summary.get("Z1"),
                "rcoTarget": summary.get("Atarget"),
                "compliance": summary.get("D2"),
                "compliancePercent": summary.get("B2"),
                "surplusDeficit": summary.get("C2"),
                "surplusDeficitPercent": summary.get("E2"),
            },
            "sectionC" : {
                "recsPurchased": rec_purchased,
                "recsSelfRetained": rec_self_retained,
                "recsTotal": rec_total,
                "buyoutsTotal": buyout_total,
                "buyoutCertsPurchased": shortfall,
                "totalCompliance": (rec_total+ shortfall)
            },
            "sectionD" : {
                "rcoPercent": summary.get("Z1"),
                "rcoTarget": summary.get("Atarget"),
                "compliance": summary.get("D2"),
                "compliancePercent": summary.get("B2"),
                "surplusDeficit": summary.get("C2"),
                "surplusDeficitPercent": summary.get("E2"),   
            }
        }

    # ------------------------------------------------------------------
    # RESPONSE
    # ------------------------------------------------------------------

    return {
        "status": "success",
        "data": response_data
    }