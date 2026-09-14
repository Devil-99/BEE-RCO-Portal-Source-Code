from fastapi import APIRouter, HTTPException, status, Depends, Request

# Import schemas and the central settings object
from src.utils.TrackingRouter import TrackingRouter
from src.schemas.sms import (
    SendOtpRequest,
    VerifyOtpRequest,
    SendTemplateRequest,
    SmsTemplateCreate,
    validate_and_normalize_phone,
)

from sqlalchemy.orm import Session
from src.database import get_db

from src.services.sms_service import sms_service
from src.models import SMS_Templates, User

import logging
logger = logging.getLogger(__name__)

# --- Initial Setup ---
router = TrackingRouter(prefix="/auth", tags=["Authentication"])

# ============================================================================== 
#                             SMS VERIFICATION API ROUTES
# ============================================================================== 



# ---------- Admin Check Dependency ----------
def admin_required(request: Request) -> None:
    """Ensures the current user has admin privileges."""
    if getattr(request.state, "role_code", None) != "ADM":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admins only."
        )

@router.post("/send-otp", status_code=status.HTTP_200_OK, summary="Send a verification OTP via SMS")
def send_otp_to_user(request_data: SendOtpRequest, db: Session = Depends(get_db)):
    # Normalize and validate number (supports optional '91' prefix)
    try:
        number = validate_and_normalize_phone(request_data.number)
        tsFlag = request_data.tsFlag
        if tsFlag:
            existing_number = db.query(User).filter(User.mobile == number).first()
            if not existing_number:
                return {"message":"If the credentials are correct, an OTP will be sent."}
                
    except (ValueError, TypeError) as e:
        logger.warning(f"[SEND_OTP] Validation error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    logger.info("[SEND_OTP] OTP sent successfully")
    return sms_service.send_otp(number, db)


@router.post("/verify-otp", status_code=status.HTTP_200_OK, summary="Verify a received OTP")
def verify_user_otp(request_data: VerifyOtpRequest):
    logger.info("[VERIFY_OTP] Request received")
    try:
        number = validate_and_normalize_phone(request_data.number)
    except (ValueError, TypeError) as e:
        logger.warning(f"[VERIFY_OTP] Validation error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    sms_service.verify_otp(number, request_data.otp)
    logger.info("[VERIFY_OTP] OTP verified successfully")
    return {"message": "Verification successful."}

# This endpoint is primarily for admin/debug/testing use cases
@router.post("/send-template", status_code=status.HTTP_200_OK, summary="Send any configured SMS template (admin/debug)")
def send_template(request_data: SendTemplateRequest, db: Session = Depends(get_db), _: None = Depends(admin_required)):
    """Generic endpoint to send a configured template key with context. Useful for admin/testing or server-side triggered messages."""
    try:
        number = validate_and_normalize_phone(request_data.number)
    except (ValueError, TypeError) as e:
        logger.warning(f"[SEND_TEMPLATE] Validation error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    sms_service.send_template(request_data.template_key, number, request_data.context, db=db)
    logger.info("[SEND_TEMPLATE] Template sent successfully")
    return {"message": "SMS sent."}


# ---------- Admin API: Create SMS Template ----------
@router.post("/create-template", status_code=status.HTTP_201_CREATED, summary="Create an SMS template (admin only)")
def create_sms_template(payload: SmsTemplateCreate, db: Session = Depends(get_db), _: None = Depends(admin_required)):
    logger.info("[CREATE_SMS_TEMPLATE] Request received")
    """Creates a new SMS template stored in DB. Admins only."""

    # Prevent duplicate template_key or dlt_template_id
    existing = db.query(SMS_Templates).filter(SMS_Templates.template_key == payload.template_key).first()
    if existing:
        logger.warning(f"[CREATE_SMS_TEMPLATE] Template with key '{payload.template_key}' already exists")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Template with key '{payload.template_key}' already exists.")

    existing_dlt = db.query(SMS_Templates).filter(SMS_Templates.dlt_template_id == payload.dlt_template_id).first()
    if existing_dlt:
        logger.warning(f"[CREATE_SMS_TEMPLATE] Template with dlt_template_id '{payload.dlt_template_id}' already exists")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Template with dlt_template_id '{payload.dlt_template_id}' already exists.")

    try:
        tpl = SMS_Templates(
            template_key=payload.template_key,
            content=payload.content,
            dlt_template_id=payload.dlt_template_id,
        )
        db.add(tpl)
        db.commit()
        db.refresh(tpl)
    except Exception:
        db.rollback()
        logger.error("[CREATE_SMS_TEMPLATE] Error creating SMS template")
        raise

    logger.info("[CREATE_SMS_TEMPLATE] SMS template created successfully")
    return tpl.to_dict()


@router.get("/templates", status_code=status.HTTP_200_OK, summary="List all SMS templates (admin only)")
def list_sms_templates(db: Session = Depends(get_db), _: None = Depends(admin_required)):
    """List all SMS templates. Admin only."""
    templates = db.query(SMS_Templates).all()
    # Return list of template dicts; empty list if none present
    return [t.to_dict() for t in templates]
    