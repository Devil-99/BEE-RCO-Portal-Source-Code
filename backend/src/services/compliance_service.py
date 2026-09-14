from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from src.models import (
    SubmissionMaster,
    SubmissionPeriod,
    SubmissionDetails,
    SubmissionMaster,
    CorpChild,
    Entity,
    RECMaster,
    BuyoutRequest,
)

def get_compliance_summary(fy_id: int, entity_id: UUID, type: str, db: Session):
    period_data = db.query(SubmissionPeriod).filter(
        SubmissionPeriod.fy_id == fy_id,
        SubmissionPeriod.period_code == 'ANNUAL'
    ).first()
    
    period_id = period_data.id
    
    if not period_id:
        raise HTTPException(status_code=404, detail="Financial year or period not found") 
        
    compliance_data = db.query(SubmissionMaster).filter(
        SubmissionMaster.entity_id == entity_id,
        SubmissionMaster.period_id == period_id,
        SubmissionMaster.fy_id == fy_id
    ).first()

    if not compliance_data:
        raise HTTPException(status_code=404, detail="No submission history found for this FY")
    
    submission_master_id = compliance_data.id
    submission_details = db.query(SubmissionDetails).filter(SubmissionDetails.submission_id == submission_master_id).all()

    # Convert list of rows into a dictionary: {acronym: value}
    summary = {row.acronym: row.value for row in submission_details}

    # ✅ Mapping
    if compliance_data.is_closed == 0:
        raise HTTPException(status_code=400, detail="Compliance summary is not available until the submission is closed.")
    
    if type == "INDUSTRY":
        response_data = {
            "target": summary.get("Atarget"),
            "compliance": summary.get("D2"),
            "compliance_percentage": summary.get("B2"),
            "surplus_deficit": summary.get("C2"),
            "surplus_deficit_percentage": summary.get("E2")
        }
    elif type == "DISCOM":
        response_data = {
            "target": summary.get("ATT"),
            "compliance": summary.get("FtT"),
            "compliance_percentage": summary.get("FTT"),
            "surplus_deficit": summary.get("EE"),
            "surplus_deficit_percentage": summary.get("GTT")
        }

    return response_data

def get_corp_compliance_summary(entity_id: UUID, fy_id: int, db: Session):
    mappings = db.query(CorpChild).filter(
        CorpChild.parent_entity_id == entity_id,
        CorpChild.fy_id == fy_id,
        CorpChild.status == True
    ).all()
    child_entity_ids = [mapping.child_entity_id for mapping in mappings]
    entities = db.query(Entity).filter(Entity.id.in_(child_entity_ids)).all() if child_entity_ids else []

    period_data = db.query(SubmissionPeriod).filter(
        SubmissionPeriod.fy_id == fy_id,
        SubmissionPeriod.period_code == 'ANNUAL'
    ).first()

    cumulative_surplus_deficit = 0.0
    total_recs = 0
    
    for entity in entities:
        # check whether individual buyout exist and skip accordingly.
        individual_buyout_request = db.query(BuyoutRequest).filter(
                BuyoutRequest.entity_id == entity.id,
                BuyoutRequest.fy_id == fy_id,
                BuyoutRequest.buyout_type == 'INDIVIDUAL'
            ).first()
        if individual_buyout_request:
            continue
        
        submission_master = db.query(SubmissionMaster).filter(
                SubmissionMaster.entity_id == entity.id,
                SubmissionMaster.period_id == period_data.id,
                SubmissionMaster.fy_id == fy_id
            ).first()
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

        rec_data = db.query(
                func.coalesce(func.sum(RECMaster.number_of_recs).label("total_recs"), 0)
            ).filter(
                RECMaster.entity_id == entity.id,
                RECMaster.fy_id == fy_id
            ).scalar()
        total_recs += rec_data

    response_data = {
        "surplus_deficit": cumulative_surplus_deficit,
        "total_recs": total_recs
    }

    return response_data

                