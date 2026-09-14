from datetime import datetime, timedelta, timezone
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Form, Request, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func
import requests
import time
from math import ceil
from urllib.parse import urlparse
from src.settings import settings

# --- Project-specific Imports ---
from src.database import get_db
from src.utils.security import verify_user_access
from src.models import Payment, User, Entity, PaymentCategoryMaster
from src.utils.enums import PaymentCategoryCodeEnum
from src.schemas import (
    OrderCreationRequest,
    PaymentInitiationRequest,
    PaymentOrderDetailsResponse,
    PaymentListResponse,
    PaymentAnalyticsResponse,
    PaymentListItem,
    PaymentDetailResponse
)
from src.services.registration_service import mark_payment
from src.services.sbi_payment_service import initiate_sbi_payment, parse_sbi_response
from src.utils.sbiPaymentConfiguration import SBI_CONFIG
from cron_job.cronJob import scheduler

import logging
logger = logging.getLogger(__name__)

# --- Payment Helper Functions ---

def update_payment_status(payload: dict, db: Session = Depends(get_db)):
    order_id = payload.get("merchant_order_number")
    raw_status = (payload.get("transaction_status") or "").upper()

    if not order_id:
        raise HTTPException(
            status_code=400, detail="Missing merchant_order_number in payload"
        )
    status = "INITIATED"
    
    # Map to business status
    if raw_status in ["SUCCESS"]:
        status = "SUCCESS"
    elif raw_status in ["FAIL", "EXPIRED", "CANCELLED", "CLOSED", "ABORT"]:
        status = "FAILED"
    elif raw_status in ["PENDING", "INPROGRESS", "BOOKED"]:
        status = "PENDING"
    else:
        status = "FAILED"  # fallback

    atrn = payload.get("atrn")
    pay_mode = payload.get("pay_mode")
    bank_ref = payload.get("bank_reference_number")
    cin = payload.get("cin")
    txn_date = payload.get("transaction_date")
    reason = payload.get("reason_message")
    try:
        payment = db.query(Payment).filter(Payment.id == order_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found.")

        # --- Idempotency / safety rules ---
        # --- If payment already SUCCESS, never downgrade to FAIL ---
        
        if payment.payment_status == "SUCCESS" and payment.gateway_status == "SUCCESS" and raw_status != "SUCCESS":
            logger.warning(f"Attempt to update payment status from SUCCESS to {raw_status} for order_id: {order_id}. Ignoring update to prevent status downgrade.")
            return

        payment.payment_status = status
        payment.gateway_status = raw_status
        
        if atrn and atrn != "NA":
            payment.transaction_ref_id = atrn
        if pay_mode and pay_mode != "NA":
            payment.payment_mode = pay_mode
        if bank_ref and bank_ref != "NA":
            payment.bank_ref_number = bank_ref
        if cin and cin != "NA":
            payment.challan_number = cin
        if txn_date and txn_date != "NA":
            # Parse txn_date if it's a string; adjust format as needed
            payment.transaction_date = (
                datetime.fromisoformat(txn_date)
                if isinstance(txn_date, str)
                else txn_date
            )
        if reason and reason != "NA":
            payment.remarks = reason
        payment.updated_at = (
            datetime.now(timezone.utc) if hasattr(payment, "updated_at") else None
        )

        db.commit()

    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500, detail="Database error while updating payment"
        )
    except Exception as e:
        print(e)
        db.rollback()
        raise HTTPException(
            status_code=500, detail="Unexpected error while updating payment"
        )

    # ---- After commit: perform post-payment business logic ----
    # Only if SUCCESS
    if status == "SUCCESS":
        try:
            entity_id = payment.entity_id
            amount = payment.payment_amount
            # mark_payment should ideally also be safe/idempotent
            mark_payment(entity_id=entity_id, db=db, amount=amount)
        except Exception:
            # Log the error; payment is marked SUCCESS but post-processing failed
            print("Error in post-payment processing for entity:", entity_id)


def parse_other_details(value: str) -> list[str]:
    if not value:
        return []
    return [v for v in value.split("^") if v]


# ---------- API Router ---------------------

router = APIRouter(tags=["Payments"])

# Fetch payment order history for a specific entity before proceed to make a new payment.
@router.get("/payment/order-details", response_model=list[PaymentOrderDetailsResponse])
async def get_payment_order_details(entity_id: UUID, db: Session = Depends(get_db)):
    order_details = (
        db.query(Payment)
        .filter(Payment.entity_id == entity_id)
        .order_by(Payment.updated_at.desc())
        .all()
    )
    if not order_details:
        return []

    return [
        PaymentOrderDetailsResponse(
            order_id=order_details.id,
            amount=order_details.payment_amount,
            status=order_details.payment_status,
            gateway_status=order_details.gateway_status,
            reason=order_details.remarks,
            created_at=order_details.created_at,
            verified_at=order_details.updated_at
        )
        for order_details in order_details
    ]


@router.post("/payment/order-creation")
async def initiate_payment(
    request: OrderCreationRequest, db: Session = Depends(get_db)
):
    authentication = True
    existing_user = db.query(User).filter(User.id == request.user_id).first()
    existing_entity = db.query(Entity).filter(Entity.id == request.entity_id).first()

    if not existing_user or not existing_entity:
        authentication = False
    if (
        existing_user.entity_id != request.entity_id
        or existing_entity.id != existing_user.entity_id
    ):
        authentication = False
    
    reg_category = db.query(PaymentCategoryMaster).filter(
        PaymentCategoryMaster.category_code == PaymentCategoryCodeEnum.REGISTRATION,
        PaymentCategoryMaster.is_default == True,
        PaymentCategoryMaster.is_active == True
    ).order_by(PaymentCategoryMaster.fy_id.desc()).first()

    if not reg_category:
        logger.warning(f"No registration fee configured for entity_type {existing_entity.entity_type}, rejecting payment")
        authentication = False
    elif request.amount != int(reg_category.amount):
        logger.warning(f"Payment initiation with invalid amount: {request.amount} for user_id: {request.user_id} and entity_id: {request.entity_id}")
        authentication = False

    if not authentication:
        raise HTTPException(status_code=401, detail="Unauthorized: invalid user.")

    if existing_entity.payment_flag == True or existing_user.username is not None:
        logger.warning(f"Payment initiation attempted for already-paid entity: {request.entity_id}")
        raise HTTPException(
            status_code=400,
            detail="Payment has already been completed for this entity.",
        )

    # Only Failed payments should be allowed to create new orders.
    # If there is any existing order with status other than FAILED, block the creation of new order.
    existing_payment = (
        db.query(Payment)
        .filter(
            Payment.user_id == request.user_id,
            Payment.entity_id == request.entity_id,
            Payment.payment_status != "FAILED",
        )
        .order_by(Payment.transaction_date.desc())
        .all()
    )

    if existing_payment:
        logger.warning(f"Active payment order already exists for entity_id: {request.entity_id}")
        raise HTTPException(
            status_code=400,
            detail="An active payment order already exists for this Entity.",
        )

    new_payment = Payment(
        user_id=request.user_id,
        entity_id=request.entity_id,
        payment_amount=request.amount,
        payment_currency="INR",
        payment_status="PENDING",
        category = "REGISTRATION"
    )
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)

    logger.info(f"Payment order created with order_id: {new_payment.id} for entity_id: {request.entity_id}")

    return {
        "order_id": new_payment.id,
        "message": "Payment initiation successful. Order ID created.",
    }


@router.post("/payment/transaction-initiate")
async def initiate_payment(
    request: PaymentInitiationRequest, db: Session = Depends(get_db)
):
    try:
        existing_payment = (
            db.query(Payment).filter(Payment.id == request.order_id).first()
        )

        existing_entity = (
            db.query(Entity).filter(Entity.id == existing_payment.entity_id).first()
        )

        existing_user = (
            db.query(User).filter(User.entity_id == existing_payment.entity_id).first()
        )
        user_name = existing_user.full_name if existing_user else "Unknown User"

        if existing_entity.payment_flag == True:
            logger.warning(f"Payment initiation attempted for entity with payment_flag=True: {existing_entity.id}")
            raise HTTPException(
                status_code=400,
                detail="Payment has already been completed for this entity.",
            )
        
        callback_url = f"{settings.base_url}/v1/payment/callback"

        if settings.environment == 'LOCAL':
            callback_url = "http://127.0.0.1:8000/v1/payment/callback"

        other_details = f"^{existing_entity.org_name}^{existing_entity.entity_reg_no}^{user_name}^"

        # Initiate payment with SBI service
        sbi_response = initiate_sbi_payment(
            amount=existing_payment.payment_amount,
            order_id=request.order_id,
            other_details=other_details,
            pay_mode=request.pay_mode,
            callback_url=callback_url,
        )

        if not sbi_response["success"]:
            logger.error(f"SBI payment payload preparation failed for order_id: {request.order_id} with response: {sbi_response}")
            raise HTTPException(
                status_code=500, detail="Failed to prepare payment. Please try again."
            )
        
        scheduler.add_job(
            run_double_verification,
            trigger="date",
            run_date=datetime.now(timezone.utc) + timedelta(minutes=30),
            kwargs={
                "order_id": request.order_id,
                "amount": existing_payment.payment_amount,
                "db": db
            },
            id=f"double_verify_{request.order_id}",
            replace_existing=True,
        )

        return {
            "success": sbi_response["success"],
            "sbi_endpoint": sbi_response["redirect_url"],
            "encrypted_data": sbi_response["encrypted_data"],
            "merchant_id": sbi_response["merchant_id"],
            "message": sbi_response["message"],
        }
    
    except HTTPException:
        logger.error(f"HTTP error occurred while initiating payment for order_id: {request.order_id}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error occurred while initiating payment for order_id: {request.order_id} - {str(e)}")
        raise HTTPException(
            status_code=500, detail="An error occurred while initiating payment"
        )


@router.post("/payment/callback")
async def payment_success_callback(
    encData: str = Form(...),
    merchIdVal: str = Form(None),
    Bank_Code: str = Form(None),
    db: Session = Depends(get_db),
):
    if not encData:
        # SBI always sends encData; if missing, treat as invalid callback
        logger.warning("Received payment callback without encData")
        raise HTTPException(status_code=400, detail="SBI encrypted data is missing")

    # 1) decrypt + parse
    try:
        parsed_response = parse_sbi_response(encData)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to parse SBI response")

    if merchIdVal != SBI_CONFIG["MERCHANT_ID"]:
        logger.warning(f"Received payment callback with invalid merchant ID or bank code - merchantIdVal: {merchIdVal}, Bank_Code: {Bank_Code}")
        raise HTTPException(status_code=400, detail="Invalid merchant ID or bank code in callback")
    
    logger.info(f"Parsed Response : {parsed_response}")

    # 2) extract key values
    order_id = parsed_response.get("merchant_order_number")
    status = (parsed_response.get("transaction_status") or "").upper()
    other_details_string = parsed_response.get("other_details")

    if not order_id:
        logger.error("Order ID missing or corrupted data in parsed SBI response")
        raise HTTPException(
            status_code=400, detail="Order ID missing or Corrupted response"
        )

    try:
        update_payment_status(parsed_response, db)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Browser response payment update error for order_id: {order_id} - {str(e)}")
        raise HTTPException(status_code=500, detail="Browser response payment update failed")

    logger.info(f"Payment status for order_id: {order_id} updated to {status}. Redirecting user to appropriate page.")
    
    if status == "SUCCESS":
        redirect_url = f"{settings.base_url}/payment-success/{order_id}"
    else:
        redirect_url = f"{settings.base_url}/payment-failure/{order_id}"

    return RedirectResponse(url=redirect_url, status_code=302)


@router.post("/payment/push-response")
async def payment_push_response(
    pushRespData: str = Form(...),
    merchIdVal: str = Form(None),
    Bank_Code: str = Form(None),
    db: Session = Depends(get_db),
):
    if not pushRespData:
        raise HTTPException(status_code=400, detail="SBI pushRespData is missing")
    
    if merchIdVal != SBI_CONFIG["MERCHANT_ID"]:
        logger.warning(f"Received payment Push response with invalid merchant ID or bank code - merchantIdVal: {merchIdVal}, Bank_Code: {Bank_Code}")
        raise HTTPException(status_code=400, detail="Invalid merchant ID or bank code in Push Response")
    
    try:
        parsed_response = parse_sbi_response(pushRespData)
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to parse SBI push response")

    logger.info(f"Parsed Push Response: {parsed_response}")

    order_id = parsed_response.get("merchant_order_number")
    status = (parsed_response.get("transaction_status") or "").upper()

    if not order_id:
        logger.error("Order ID missing or corrupted data in parsed SBI response")
        raise HTTPException(
            status_code=400, detail="Order ID missing or corrupted push response"
        )

    try:
        update_payment_status(parsed_response, db)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Push response payment update error for order_id: {order_id} - {str(e)}")
        raise HTTPException(status_code=500, detail="Push response payment update failed")

    logger.info(f"SBI push response for order_id: {order_id} processed with status: {status}")
    
    return {
        "success": True,
        "message": "SBI push response processed successfully.",
        "order_id": order_id,
        "status": status,
    }


def run_double_verification(order_id: str, amount: float, db: Session = Depends(get_db)):
    merchant_id = SBI_CONFIG["MERCHANT_ID"]
    url = SBI_CONFIG["DOUBLE_VALIDATION_URL"]

    query_request = f"|{merchant_id}|{order_id}|{int(amount)}"

    req_payload = {
        "queryRequest": query_request,
        "aggregatorId": "SBIEPAY",
        "merchantId": merchant_id
    }

    try:
        response = requests.post(
            url,
            data=req_payload,
            timeout=60
        )

        if response.status_code != 200:
            logger.error("SBI Double verification request failed")
            return 

        fields = response.text.split("|")

        parsed_response = {
            "merchant_id": fields[0],
            "atrn": fields[1],
            "transaction_status": fields[2],
            "country": fields[3],
            "currency": fields[4],
            "other_details": fields[5],
            "merchant_order_number": fields[6],
            "amount": fields[7],
            "reason_message": fields[8],
            "bank_code": fields[9],
            "cin": fields[10],
            "transaction_date": fields[11],
            "pay_mode": fields[12],
            "bank_reference_number": fields[13]
        }

        logger.info(f"Parsed Double Verification Response-: {parsed_response}")
        
        update_payment_status(parsed_response, db)

    except requests.exceptions.Timeout:
        logger.error("SBI Double verification request timed out")

    except requests.exceptions.RequestException as e:
        logger.error(f"Network error during SBI Double verification: {str(e)}")

# ----------- Open API (No Security Checks involved) ---------------
# ----------- For Track Status ----------------
@router.get("/payment/payment-details", response_model = PaymentDetailResponse)
async def get_payment_details(request: Request, order_id: UUID, db: Session = Depends(get_db)):
# -----------------------------
    # 1. Get Referer header
    # -----------------------------
    referer = request.headers.get("referer")

    if not referer:
        raise HTTPException(
            status_code=403,
            detail="Invalid payment request"
        )

    # -----------------------------
    # 2. Parse Referer URL
    # -----------------------------
    parsed_url = urlparse(referer)

    # Expected:
    # /payment-success/{order_id}

    path_parts = parsed_url.path.strip("/").split("/")

    if len(path_parts) != 2 or path_parts[0] != "payment-success":
        raise HTTPException(
            status_code=403,
            detail="Invalid payment request"
        )

    referer_order_id = path_parts[1]

    # -----------------------------
    # 3. Validate UUID
    # -----------------------------
    try:
        referer_order_id = UUID(referer_order_id)
    except ValueError:
        raise HTTPException(
            status_code=403,
            detail="Invalid payment request"
        )

    # -----------------------------
    # 4. Compare order IDs
    # -----------------------------
    if referer_order_id != order_id:
        raise HTTPException(
            status_code=403,
            detail="Invalid payment request"
        )

    # -----------------------------
    # 5. Fetch payment
    # -----------------------------
    payment_details = (
        db.query(Payment)
        .filter(Payment.id == order_id)
        .first()
    )

    if not payment_details:
        raise HTTPException(
            status_code=404,
            detail="Payment details not found"
        )

    fetched_user_id = payment_details.user_id
    fetched_entity_id = payment_details.entity_id

    user_details = (
        db.query(User.username)
        .filter(User.id == fetched_user_id)
        .first()
    )

    entity_details = (
        db.query(Entity.entity_reg_no)
        .filter(Entity.id == fetched_entity_id)
        .first()
    )

    return {
        "order_id": payment_details.id,
        "amount": payment_details.payment_amount,
        "status": payment_details.payment_status,
        "gateway_status": payment_details.gateway_status,
        "transaction_id": payment_details.transaction_ref_id,
        "payment_mode": payment_details.payment_mode,
        "bank_ref_number": payment_details.bank_ref_number,
        "challan_number": payment_details.challan_number,
        "transaction_date": payment_details.transaction_date,
        "double_verified_at": payment_details.updated_at,
        "reason": payment_details.remarks,
        "username": user_details.username,
        "entity_registration_number": entity_details.entity_reg_no,
    }

# -------------------------- Admin Analytics Page --------------------------

@router.get("/dashboard/payment-analytics", response_model=PaymentAnalyticsResponse)
async def get_payment_analytics(
    request: Request,
    entity_id: Optional[UUID] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    access_roles = {"ADM", "SNA", "SPA"}
    verify_user_access(request, access_roles, db)

    try:
        query = (
            db.query(Payment, Entity, User)
            .join(Entity, Entity.id == Payment.entity_id)
            .join(User, User.id == Payment.user_id)
        )
        if entity_id:
            query = query.filter(Payment.entity_id == entity_id)

        if start_date:
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                query = query.filter(Payment.transaction_date >= start_dt)
            except ValueError:
                logger.warning(f"[PAYMENT_ANALYTICS] Invalid start_date format: {start_date}")

        if end_date:
            try:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d")
                end_dt = end_dt.replace(hour=23, minute=59, second=59)
                query = query.filter(Payment.transaction_date <= end_dt)
            except ValueError:
                logger.warning(f"[PAYMENT_ANALYTICS] Invalid end_date format: {end_date}")

        payments = query.all()

        unique_entities = {entity.id: entity for _, entity, _ in payments}.values()
        total_payments = len(unique_entities)

        total_amount = sum(
            float(payment.payment_amount or 0)
            for payment, _, _ in payments
            if payment.payment_status == "SUCCESS"
        )

        total_buyout_amount = sum(
            float(payment.payment_amount or 0)
            for payment, _, _ in payments
            if payment.payment_status == "SUCCESS" and payment.category == "BUYOUT"
        )

        failed_entities = set()
        successful_entities = set()

        for payment, entity, _ in payments:
            if payment.payment_status == "FAILED":
                failed_entities.add(entity.id)

            elif payment.payment_status == "SUCCESS":
                successful_entities.add(entity.id)
        
        success_count = len(successful_entities)
        failed_count = len(failed_entities - successful_entities)
        pending_count = total_payments - success_count - failed_count

        status_breakdown = {
            "SUCCESS": success_count,
            "PENDING": pending_count,
            "FAILED": failed_count,
        }

        entity_wise_data = {}

        for payment, entity, _ in payments:

            entity_name = entity.org_name

            if entity_name not in entity_wise_data:
                entity_wise_data[entity_name] = {
                    "entity_name": entity_name,
                    "count": 0,
                    "amount": 0,
                }

            entity_wise_data[entity_name]["count"] += 1
            entity_wise_data[entity_name]["amount"] += float(
                payment.payment_amount or 0
            )

        entity_wise = list(entity_wise_data.values())

        user_wise_data = {}

        for payment, _, user in payments:

            user_name = user.full_name

            if user_name not in user_wise_data:
                user_wise_data[user_name] = {
                    "user_name": user_name,
                    "count": 0,
                    "amount": 0,
                }

            user_wise_data[user_name]["count"] += 1
            user_wise_data[user_name]["amount"] += float(
                payment.payment_amount or 0
            )

        user_wise = list(user_wise_data.values())

        monthly_trend = {}

        for payment, _, _ in payments:
            if not payment.created_at:
                continue

            month_key = payment.created_at.strftime("%Y-%m")

            if month_key not in monthly_trend:
                    monthly_trend[month_key] = {
                        "month": month_key,
                        "total_count": 0,
                        "success_count": 0,
                        "pending_count": 0,
                        "failed_count": 0,
                        "amount": 0,
                    }

            monthly_trend[month_key]["total_count"] += 1
            monthly_trend[month_key]["amount"] += float(
                    payment.payment_amount or 0
                )

            if payment.payment_status == "SUCCESS":
                   monthly_trend[month_key]["success_count"] += 1

            elif payment.payment_status == "PENDING":
                   monthly_trend[month_key]["pending_count"] += 1

            elif payment.payment_status == "FAILED":
                   monthly_trend[month_key]["failed_count"] += 1
        monthly_trend_list = sorted(monthly_trend.values(), key=lambda x: x["month"])

        payment_mode_breakdown = {}
        for payment, _, _ in payments:

            mode = payment.payment_mode or "Unknown"

            payment_mode_breakdown[mode] = (
                payment_mode_breakdown.get(mode, 0) + 1
            )

        all_entities = db.query(Entity).order_by(Entity.org_name).all()
        entity_list = [
            {"id": str(e.id), "name": e.org_name}
            for e in all_entities
        ]

        all_users = db.query(User).filter(User.username.isnot(None)).order_by(User.full_name).all()
        user_list = [
            {"id": str(u.id), "name": u.full_name, "username": u.username}
            for u in all_users
        ]

        return PaymentAnalyticsResponse(
            total_payments=total_payments,
            total_amount=total_amount,
            total_buyout_amount=total_buyout_amount,
            success_count=success_count,
            pending_count=pending_count,
            failed_count=failed_count,
            status_breakdown=status_breakdown,
            entity_wise=entity_wise,
            user_wise=user_wise,
            monthly_trend=monthly_trend_list,
            payment_mode_breakdown=payment_mode_breakdown,
            entity_list=entity_list,
            user_list=user_list,
        )

    except Exception as e:
        logger.error(f"[PAYMENT_ANALYTICS] Error fetching payment analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching payment analytics")


@router.get("/dashboard/payment-list", response_model=PaymentListResponse)
async def get_payment_list(
    request: Request,
    entity_id: Optional[UUID] = None,
    entity_type: Optional[str] = None,
    payment_mode: Optional[str] = None,
    payment_status: Optional[str] = None,
    category: Optional[str] = None,
    state_code: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    search_type: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    access_roles = {"ADM", "SNA", "SPA"}
    verify_user_access(request, access_roles, db)
    
    try:
        query = db.query(Payment, Entity, User).join(Entity, Entity.id == Payment.entity_id).join(User, User.id == Payment.user_id)

        if entity_id:
            query = query.filter(Payment.entity_id == entity_id)

        if entity_type:
            query = query.filter(Entity.entity_type == entity_type)

        if payment_mode:
            query = query.filter(Payment.payment_mode == payment_mode)

        if payment_status:
            query = query.filter(Payment.payment_status == payment_status)

        if category:
            query = query.filter(Payment.category == category)

        if state_code:
            query = query.filter(Entity.state_code == state_code)

        if start_date:
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                query = query.filter(Payment.created_at >= start_dt)
            except ValueError:
                pass

        if end_date:
            try:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d")
                end_dt = end_dt.replace(hour=23, minute=59, second=59)
                query = query.filter(Payment.created_at <= end_dt)
            except ValueError:
                pass

        if search:
            search = search.strip()

            if search_type == "entity":
                query = query.filter(Entity.org_name.ilike(f"%{search}%"))

            elif search_type == "username":
                query = query.filter(User.full_name.ilike(f"%{search}%"))

            elif search_type == "txn_id":
                query = query.filter(Payment.transaction_ref_id.ilike(f"%{search}%"))

            elif search_type == "bank_ref":
                query = query.filter(Payment.bank_ref_number.ilike(f"%{search}%"))

        total = query.count()

        offset = (page - 1) * page_size

        total_pages = ceil(total / page_size) if total > 0 else 0

        payments = query.order_by(Payment.created_at.desc()).offset(offset).limit(page_size).all()
        
        response = [
            PaymentListItem(
                order_id=payment.id,
                user_name=user.full_name,
                mobile=user.mobile,
                entity_id=payment.entity_id,
                entity_name=entity.org_name,
                entity_reg_no=entity.entity_reg_no,
                entity_type=entity.entity_type,
                state_code=entity.state_code,
                category=payment.category,
                payment_amount=payment.payment_amount,
                payment_status=payment.payment_status,
                gateway_status=payment.gateway_status,
                payment_mode=payment.payment_mode,
                transaction_ref_id=payment.transaction_ref_id,
                bank_ref_number=payment.bank_ref_number,
                transaction_date=payment.transaction_date,
                verified_at = payment.updated_at
            )
            for payment, entity, user in payments
        ]

        return PaymentListResponse(
            payments=response,
            total_count=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    except Exception as e:
        logger.error(f"[PAYMENT_LIST] Error fetching payment list: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching payment list")

# ----------------------- Internal Helper Functions for DV reconciliation and updates (not API endpoints) ---------------------

dv_summary = {
    "total_payments": 0,
    "checked_orders": 0,
    "no_change": 0,
    "rollback": [],
    "rollback_count": 0,
    "registered": [],
    "registered_count": 0,
    "updated": [],
    "updated_count": 0,
    "skipped": [],
    "skipped_count": 0,
    "errors": [],
}

def clean_dv_summary():
    dv_summary["total_payments"] = 0
    dv_summary["checked_orders"] = 0
    dv_summary["no_change"] = 0
    dv_summary["rollback"] = []
    dv_summary["rollback_count"] = 0
    dv_summary["registered"] = []
    dv_summary["registered_count"] = 0
    dv_summary["updated"] = []
    dv_summary["updated_count"] = 0
    dv_summary["skipped"] = []
    dv_summary["skipped_count"] = 0
    dv_summary["errors"] = []

def normalize_bank_ref(bank_ref: Optional[str]) -> Optional[str]:
    if not bank_ref:
        return None
    normalized = bank_ref.strip()
    if normalized.upper() in {"", "NA", "NONE"}:
        return None
    return normalized


def map_dv_status(raw_status: Optional[str]) -> str:
    normalized = (raw_status or "").upper()
    if normalized == "SUCCESS":
        return "SUCCESS"
    if normalized in {"FAIL", "EXPIRED", "CANCELLED", "CLOSED", "ABORT"}:
        return "FAILED"
    if normalized in {"PENDING", "INPROGRESS", "BOOKED"}:
        return "PENDING"
    return "FAILED"


def fetch_double_verification_response(order_id: str, amount: float) -> dict:
    merchant_id = SBI_CONFIG["MERCHANT_ID"]
    url = SBI_CONFIG["DOUBLE_VALIDATION_URL"]
    query_request = f"|{merchant_id}|{order_id}|{int(amount)}"
    payload = {
        "queryRequest": query_request,
        "aggregatorId": "SBIEPAY",
        "merchantId": merchant_id,
    }

    try:
        response = requests.post(
            url,
            data=payload,
            timeout=30
        )

        if response.status_code != 200:
            print(f"SBI Double verification request failed for order_id: {order_id}, status_code: {response.status_code}, response_text: {response.text}")
            raise HTTPException(
                status_code=502,
                detail=f"DV request failed for order {order_id}. SBI status: {response.status_code}"
            )

        fields = response.text.split("|")
        if len(fields) < 14:
            raise HTTPException(
                status_code=502,
                detail=f"Unexpected double verification response format for order {order_id}."
            )

        parsed_response = {
            "merchant_id": fields[0],
            "atrn": fields[1],
            "transaction_status": fields[2],
            "country": fields[3],
            "currency": fields[4],
            "other_details": fields[5],
            "merchant_order_number": fields[6],
            "amount": fields[7],
            "reason_message": fields[8],
            "bank_code": fields[9],
            "cin": fields[10],
            "transaction_date": fields[11],
            "pay_mode": fields[12],
            "bank_reference_number": fields[13],
        }
        return parsed_response
    
    except requests.exceptions.Timeout as e:
        logger.error(f"DV API timeout for order_id: {order_id} - {str(e)}")
        raise HTTPException(status_code=504, detail="DV request timed out")
    
    except requests.exceptions.ConnectionError as e:
        logger.error(f"DV API connection error for order_id: {order_id} - {str(e)}")
        raise HTTPException(status_code=502, detail="DV service unreachable")
    
    except requests.exceptions.RequestException as e:
        logger.error(f"DV API request failed for order_id: {order_id} - {str(e)}")
        raise HTTPException(status_code=502, detail="DV request failed")
    
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is


def apply_payment_update_from_dv(payment: Payment, parsed_response: dict):
    raw_status = (parsed_response.get("transaction_status") or "").upper()
    payment.payment_status = map_dv_status(raw_status)
    payment.gateway_status = raw_status

    atrn = parsed_response.get("atrn")
    bank_ref = parsed_response.get("bank_reference_number")
    cin = parsed_response.get("cin")
    txn_date = parsed_response.get("transaction_date")
    reason = parsed_response.get("reason_message")

    if atrn and atrn != "NA":
        payment.transaction_ref_id = atrn
    if bank_ref and bank_ref != "NA":
        payment.bank_ref_number = bank_ref
    if cin and cin != "NA":
        payment.challan_number = cin
    if txn_date and txn_date != "NA":
        payment.transaction_date = (
            datetime.fromisoformat(txn_date)
            if isinstance(txn_date, str)
            else txn_date
        )
    if reason and reason != "NA":
        payment.remarks = reason

    payment.updated_at = datetime.now(timezone.utc) if hasattr(payment, "updated_at") else None


def rollback_payment_for_failed_dv(payment: Payment, parsed_response: dict, db: Session) -> str:
    apply_payment_update_from_dv(payment, parsed_response)

    user = db.query(User).filter(User.entity_id == payment.entity_id).first()
    entity = db.query(Entity).filter(Entity.id == payment.entity_id).first()

    if user and user.username:
        user.username = None
        user.password_hash = None

    if entity and entity.payment_flag:
        entity.payment_flag = False

    db.commit()
    db.refresh(payment)
    if entity:
        db.refresh(entity)

    logger.info(f"Rolled back payment and credentials for order_id: {payment.id}, entity: {entity.org_name if entity else 'Unknown'}")
    return "rollback"


def apply_success_payment_for_dv(payment: Payment, parsed_response: dict, db: Session) -> str:
    entity = db.query(Entity).filter(Entity.id == payment.entity_id).first()
    user = db.query(User).filter(User.entity_id == payment.entity_id).first()

    if not entity or not user:
        logger.warning(f"Cannot complete registration for order_id {payment.id}: missing entity or user record")
        return "no_change"

    if entity.payment_flag and user.username:
        logger.info(f"Payment already registered for entity {entity.org_name}")
        return "no_change"
    
    apply_payment_update_from_dv(payment, parsed_response)
    db.commit()
    db.refresh(payment)

    try:
        mark_payment(entity_id=entity.id, db=db, amount=int(payment.payment_amount or 0))
        logger.info(f"Marked payment and generated credentials for order_id: {payment.id}, entity {entity.org_name} after DV success")
        return "registered"
    except HTTPException as exc:
        logger.warning(
            f"mark_payment skipped after DV success for order_id: {payment.id}, entity {entity.org_name}: {exc.detail}"
        )
        return "updated"


def reconcile_payment_with_dv(payment: Payment, parsed_response: dict, commit: bool, db: Session) -> str:
    raw_status = (parsed_response.get("transaction_status") or "").upper()
    dv_status = map_dv_status(raw_status)
    dv_bank_ref = normalize_bank_ref(parsed_response.get("bank_reference_number"))
    db_bank_ref = normalize_bank_ref(payment.bank_ref_number)

    same_status = (
        payment.payment_status == dv_status
        and payment.gateway_status == raw_status
        and db_bank_ref == dv_bank_ref
    )

    dv_summary["checked_orders"] += 1

    if same_status:
        return "no_change"

    if payment.payment_status == "SUCCESS" and dv_status == "FAILED":
        dv_summary["rollback"].append({
            "order_id": str(payment.id),
            "entity_id": str(payment.entity_id),
            "payment_status_before": payment.payment_status,
            "payment_status_after": raw_status,
        })
        if commit:
            return rollback_payment_for_failed_dv(payment, parsed_response, db)
        return "rollback"
    
    elif payment.payment_status == "SUCCESS" and dv_status == "PENDING":
        dv_summary["skipped"].append({
            "order_id": str(payment.id),
            "entity_id": str(payment.entity_id),
            "payment_status_before": payment.payment_status,
            "payment_status_after": raw_status,
        })
        return "skipped"
    
    elif payment.payment_status == "PENDING" and dv_status == "SUCCESS":
        dv_summary["registered"].append({
            "order_id": str(payment.id),
            "entity_id": str(payment.entity_id),
            "payment_status_before": payment.payment_status,
            "payment_status_after": raw_status,
        })
        if commit:
            return apply_success_payment_for_dv(payment, parsed_response, db)
        return "registered"
    
    elif payment.payment_status == "PENDING" and dv_status == "FAILED":
        dv_summary["updated"].append({
            "order_id": str(payment.id),
            "entity_id": str(payment.entity_id),
            "payment_status_before": payment.payment_status,
            "payment_status_after": raw_status,
        })
        if commit:
            apply_payment_update_from_dv(payment, parsed_response)
            db.commit()
            logger.info(f"Updated payment record to match DV response for order_id: {payment.id}")
        return "updated"
    
    elif payment.payment_status == "FAILED" and dv_status == "PENDING":
        dv_summary["skipped"].append({
            "order_id": str(payment.id),
            "entity_id": str(payment.entity_id),
            "payment_status_before": payment.payment_status,
            "payment_status_after": raw_status,
        })
        return "skipped"

    elif payment.payment_status == "FAILED" and dv_status == "SUCCESS":
        dv_summary["registered"].append({
            "order_id": str(payment.id),
            "entity_id": str(payment.entity_id),
            "payment_status_before": payment.payment_status,
            "payment_status_after": raw_status,
        })
        if commit:
            return apply_success_payment_for_dv(payment, parsed_response, db)
        return "registered"
    
    else:
        # For any other mismatch, keep payment in sync with DV
        comment = f"Conflict Check | payment_status : {payment.payment_status} - {dv_status} | gateway_status : {payment.gateway_status} - {raw_status} | bank_ref_number : {db_bank_ref} - {dv_bank_ref}"
        dv_summary["updated"].append({
            "order_id": str(payment.id),
            "entity_id": str(payment.entity_id),
            "payment_status_before": payment.payment_status,
            "payment_status_after": raw_status,
            "comment": comment
        })
        if commit:
            apply_payment_update_from_dv(payment, parsed_response)
            db.commit()
            logger.info(f"Updated payment record to match DV response for order_id: {payment.id}")
        return "updated"

# ----------------------- Double Verification for Manual update ---------------

@router.post("/payment/run-dv-manually", status_code=status.HTTP_200_OK)
def run_double_verification_manually(
    order_id: Optional[UUID] = None,
    date: Optional[str] = None,
    commit: Optional[bool] = False,
    start_index: Optional[int] = 0,
    page_size: Optional[int] = None,
    db: Session = Depends(get_db),
):
    # reset the dv_summary to avoid stale data for future DV checks
    clean_dv_summary()

    query = db.query(Payment)
    if order_id:
        query = query.filter(Payment.id == order_id)
    if date:
        parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
        query = query.filter(func.date(Payment.created_at) == parsed_date)

    query = query.order_by(Payment.created_at.desc())

    # Apply pagination only if page_size is passed
    if page_size:
        payments_list = (
            query
            .offset(start_index)
            .limit(page_size)
            .all()
        )
    else:
        # run for all payments
        payments_list = query.all()

    if not payments_list:
        return {
            "success": True,
            "checked_orders": 0,
            "message": "No matching payment records found to reconcile.",
        }

    dv_summary["total_payments"] = len(payments_list)
    print(f"Starting manual DV reconciliation for {dv_summary['total_payments']} payment(s). Commit mode: {commit}")
    
    for payment in payments_list:
        try:
            dv_response = fetch_double_verification_response(
                order_id=str(payment.id),
                amount=float(payment.payment_amount or 0),
            )
            result = reconcile_payment_with_dv(payment, dv_response, commit, db)
            if result == "no_change":
                dv_summary["no_change"] += 1
            elif result == "rollback":
                dv_summary["rollback_count"] += 1
            elif result == "registered":
                dv_summary["registered_count"] += 1
            elif result == "skipped":
                dv_summary["skipped_count"] += 1
            else:
                dv_summary["updated_count"] += 1

        except requests.exceptions.RequestException as e:
            logger.error(f"DV API failed: {repr(e)}")
            dv_summary["errors"].append({
                "order_id": str(payment.id),
                "error": repr(e)
            })
        
        except Exception as exc:
            logger.error(f"Error for {payment.id}: {str(exc)}")
            dv_summary["errors"].append({
                "order_id": str(payment.id),
                "error": str(exc)
            })
            
        time.sleep(0.5)

    return {
        "success": True,
        "summary": dv_summary,
        "message": "Manual DV reconciliation completed.",
    }
