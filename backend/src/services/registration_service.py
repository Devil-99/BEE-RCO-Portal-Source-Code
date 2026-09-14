from fastapi import HTTPException
from typing import Optional
from datetime import datetime, timezone 
from src.models import Entity, User
from src.models.payment_category import PaymentCategoryMaster
from src.utils.enums import PaymentCategoryCodeEnum
from sqlalchemy.orm import Session
from src.utils.user_generation import generate_username
from src.utils.security import hash_password, generate_password
from src.services.sms_service import sms_service

def generate_reg(entity_id: int, db: Session):
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    user = db.query(User).filter(User.entity_id == entity_id).first()

    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.username:
        raise HTTPException(status_code=501, detail="User registration already completed for this entity.")

    final_username = generate_username(entity, user, db)
    generated_password = generate_password(8)
    hashed_password = hash_password(generated_password)
    user.username = final_username
    user.password_hash = hashed_password

    db.commit()
    db.refresh(user)

    # Send SMS with login credentials
    full_name = user.full_name if user.full_name else "User"
    entity_reg_no = entity.entity_reg_no
    username = user.username
    mobile = user.mobile
    context = {"var": [full_name, entity_reg_no, username, generated_password]}
    sms_service.send_template('login_credentials', mobile, context, db)

    return {
        "message": f"Credentials generated for {entity_reg_no}.",
        "entity_id": entity.id,
        "username": username
    }


def _update_document_status(entity_id: int, document_flag: bool, remarks: Optional[str], db: Session):
    try:
        entity = db.query(Entity).filter(Entity.id == entity_id).first()
        
        if not entity:
            raise HTTPException(status_code=404, detail="Entity not found")
        
        entity.document_flag = document_flag
        entity.updated_at = datetime.now(timezone.utc)
        
        if remarks:
            entity.remarks = remarks
        
        response = {"message": "", "username": ""}
        
        # Handle NOBE payment marking
        if(entity.entity_type == "NOBE" and document_flag == 1):
            try:
                reg_category = db.query(PaymentCategoryMaster).filter(
                    PaymentCategoryMaster.category_code == PaymentCategoryCodeEnum.REGISTRATION,
                    PaymentCategoryMaster.is_default == True,
                    PaymentCategoryMaster.is_active == True
                ).order_by(PaymentCategoryMaster.fy_id.desc()).first()

                if not reg_category:
                    raise HTTPException(
                        status_code=500,
                        detail="No registration fee configured in payment_category_master"
                    )

                combined_resp = mark_payment(entity.id, db, int(reg_category.amount))

                response = {
                    "message": combined_resp.get("message", ""),
                    "entity_id": entity.id,
                    "username": combined_resp.get("username", "")
                }

            except Exception as payment_error:
                db.rollback()
                print("Payment marking error:", payment_error)

                raise HTTPException(
                    status_code=500,
                    detail="Document approved but payment processing failed"
                )
        
        db.commit()
        db.refresh(entity)
    
        # Send SMS notification to user about document approval
        if entity.entity_type != "NOBE":
            try:
                user = db.query(User).filter(User.entity_id == entity.id).first()

                if user:
                    full_name = user.full_name if user.full_name else "User"
                    mobile = user.mobile

                    context = {
                        "var": [full_name]
                    }

                    sms_service.send_template(
                        'document_approval',
                        mobile,
                        context,
                        db
                    )

            except Exception as sms_error:
                # SMS failure should not fail the API
                print("SMS sending failed:", sms_error)
                
        message_part = response.get("message", "")
        username_part = response.get("username", "")
        
        return {
            "message": f"Registration is validated and approved. {message_part}",
            "entity_id": entity.id,
            "remarks": entity.remarks if entity.remarks else None,
            "username": username_part
        }
    except HTTPException as http_error:
        db.rollback()
        raise http_error

    except Exception as e:
        db.rollback()

        print("Update document status error:", e)

        raise HTTPException(
            status_code=500,
            detail="Something went wrong while updating document status"
        )

def mark_payment(entity_id: int, db: Session, amount: Optional[int]):
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    user = db.query(User).filter(User.entity_id == entity_id).first()
    
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    if entity.payment_flag or (user and user.username):
        raise HTTPException(status_code=501, detail="User registration already completed for this entity.")

    entity.payment_flag = True
    db.commit()
    db.refresh(entity)

    # Send SMS to notify payment success
    if user and entity and entity.entity_type != 'NOBE':
        full_name = user.full_name if user.full_name else "User"
        mobile = user.mobile
        context = {"var": [full_name, amount]}
        sms_service.send_template('payment_successful', mobile, context, db)

    # After payment, always generate credentials
    gen_resp = generate_reg(entity_id, db)

    # Combine messages
    combined_message = f"{gen_resp.get('message', '')} {f'Payment Successful for {entity.entity_reg_no}.'}".strip()

    return {
        "message": combined_message,
        "entity_id": entity.id,
        "registration_number": entity.entity_reg_no,
        "username": gen_resp.get("username")
    }