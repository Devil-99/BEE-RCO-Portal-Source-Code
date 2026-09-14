from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from src.models import Entity, SubmissionMaster, Firm, AEA, State, Payment
from src.utils.enums import SubmissionStatusEnum, PaymentStatusEnumNew
from collections import defaultdict

def get_sldc_dashboard(db: Session, user, fy_id: int):
    sldc_entity = db.query(Entity).filter(Entity.id == user.entity_id).first()
    if not sldc_entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    state_code = sldc_entity.state_code

    registration_summary = get_state_level_entity_registration_summary(db, state_code, role="SLDC")
    submission_summary = get_state_level_submission_status_summary(db, state_code, fy_id, role="SLDC")
    
    return {
        "registration_summary": registration_summary,
        "submission_summary": submission_summary
    }
    
def get_sda_dashboard(db: Session, user, fy_id: int):
    sda_entity = db.query(Entity).filter(Entity.id == user.entity_id).first()
    if not sda_entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    state_code = sda_entity.state_code

    registration_summary = get_state_level_entity_registration_summary(
        db, state_code, role="SDA"
    )
    submission_summary = get_state_level_submission_status_summary(
        db, state_code, fy_id, role="SDA"
    )

    return {
        "registration_summary": registration_summary,
        "submission_summary": submission_summary
    }
    

def get_state_level_entity_registration_summary(db: Session,state_code: str, role: str):
    entity_types = ["DISCOM"] if role == "SLDC" else ["DISCOM", "INDUSTRY"]
    counts = (
        db.query(
            Entity.entity_type,
            func.count(Entity.id)
        )
        .filter(
            Entity.state_code == state_code,
            Entity.payment_flag == True,
            Entity.entity_type.in_(entity_types)
        )
        .group_by(Entity.entity_type)
        .all()
    )

    count_dict = {entity_type: count for entity_type, count in counts}

    discom_count = count_dict.get("DISCOM", 0)
    cpp_count = count_dict.get("INDUSTRY", 0)

    return {
        "discom_registration": discom_count,
        "industry_registration": cpp_count
    }

def get_state_level_submission_status_summary( db: Session, state_code: str, fy_id: int, role: str):
    entity_types = ["DISCOM"] if role == "SLDC" else ["DISCOM", "INDUSTRY"]
    rows = (
        db.query(
            Entity.entity_type,
            SubmissionMaster.is_closed,
            func.count().label("count")
        )
        .join(Entity, Entity.id == SubmissionMaster.entity_id)
        .filter(
            Entity.state_code == state_code,
            SubmissionMaster.fy_id == fy_id,
            Entity.entity_type.in_(entity_types)
        )
        .group_by(Entity.entity_type, SubmissionMaster.is_closed)
        .all()
    )

    counts = {
        "discom_closed": 0,
        "discom_pending": 0,
        "industry_closed": 0,
        "industry_pending": 0,
    }

    for entity_type, is_closed, count in rows:
        key = f"{entity_type.lower()}_{'closed' if is_closed else 'pending'}"
        counts[key] = count
    
    return counts

def get_mop_dashboard(db: Session, fy_id: int):
    state_map = dict(
        db.query(State.state_code, State.state_name).all()
    )

    registration_summary = get_national_registration_summary(db,state_map)
    submission_summary = get_national_submission_summary(db, fy_id,state_map)
    payment_summary = get_total_payment_amount(db)

    return {
        "registration_summary": registration_summary,
        "submission_summary": submission_summary,
        "payment_summary": payment_summary
    }


def get_national_registration_summary(db: Session,state_map: dict[str, str]):
    entity_rows = (
       db.query(
               Entity.state_code.label("state_code"),
               func.count(Entity.id).label("entity_count"),
           )
           .filter(
               Entity.payment_flag == True,
               Entity.entity_type.in_(["DISCOM", "INDUSTRY"]),
           )
           .group_by(Entity.state_code)
           .all()
    )
    entity_by_state = {row.state_code: row.entity_count
                           for row in entity_rows}

    firm_rows = (
         db.query(
                Firm.state_code.label("state_code"),
                func.count(Firm.firm_id).label("firm_count"),
         )
            .filter(
                Firm.is_active == True,
                Firm.state_code != None,
            )
            .group_by(Firm.state_code)
            .all()
    )
    firm_by_state = { row.state_code: row.firm_count
                         for row in firm_rows}

    total_aeas = db.query(func.count(AEA.id)).filter(AEA.is_active == True).scalar() or 0

    all_state_codes  = entity_by_state.keys() | firm_by_state.keys()

    total_entities = sum(entity_by_state.values())
    total_audit_firms = sum(firm_by_state.values())

    state_wise = []

    for sc in sorted(all_state_codes):
        state_wise.append({
            "state_code": sc,
            "state_name": state_map.get(sc, sc),
            "entities": entity_by_state.get(sc, 0),
            "audit_firms": firm_by_state.get(sc, 0),
        })

    return {
        "total_entities": total_entities,
        "total_audit_firms": total_audit_firms,
        "total_aeas": total_aeas,
        "state_wise": state_wise
    }


def get_national_submission_summary(db: Session, fy_id: int,state_map: dict[str, str]):
    rows = (
        db.query(
            Entity.state_code,
            Entity.entity_type,
            func.count().label("count")
        )
        .select_from(SubmissionMaster)
        .join(Entity, SubmissionMaster.entity_id == Entity.id)
        .filter(SubmissionMaster.fy_id == fy_id)
        .group_by(Entity.state_code, Entity.entity_type)
        .all()
    )

    state_data = defaultdict(lambda: {"discoms": 0, "cpps": 0})

    for state_code, entity_type, count in rows:
        key = "discoms" if entity_type == "DISCOM" else "cpps"
        state_data[state_code][key] = count

    total_discoms = sum(
        state["discoms"] for state in state_data.values()
    )

    total_cpps = sum(
        state["cpps"] for state in state_data.values()
    )

    state_wise = [
        {
            "state_code": state_code,
            "state_name": state_map.get(state_code, state_code),
            "discoms": data["discoms"],
            "cpps": data["cpps"],
        }
        for state_code, data in sorted(state_data.items())
    ]

    return {
        "total_discoms": total_discoms,
        "total_cpps": total_cpps,
        "state_wise": state_wise,
    }


def get_total_payment_amount(db: Session):
    total = (
        db.query(func.coalesce(func.sum(Payment.payment_amount), 0))
        .filter(Payment.payment_status == PaymentStatusEnumNew.SUCCESS.value)
        .scalar()
    )
    return {
        "total_amount": float(total),
    }