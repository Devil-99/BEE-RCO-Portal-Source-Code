from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from fastapi.responses import JSONResponse
from requests import request
from src.utils.jwt import create_jwt, decode_jwt
from sqlalchemy.orm import Session
from src.settings import settings
from src.models import User, Entity
from src.schemas import login_request, login_response, change_password_request, verify_usercreds_request, reset_password_request, login_otp_request
from src.utils.security import hash_password, verify_password, validate_password
from src.models.session import Session as UserSession
from src.services.sms_service import sms_service
from datetime import datetime, timedelta, timezone
from sqlalchemy import cast, and_, desc
import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.exc import SQLAlchemyError
from src.database import get_db 
from src.utils.TrackingRouter import TrackingRouter

import logging
logger = logging.getLogger(__name__)

neutral_response = "If the credentials are correct, an OTP will be sent."
SESSION_TIME = 60

router = TrackingRouter(tags=["Authentication"])

@router.get("/get-mobile-by-username")
def get_mobile_by_username(username: str = Query(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if user.id != request.state.user_id:
        logger.warning("[GET_MOBILE_BY_USERNAME] Not authorized to access this user's mobile number")
        raise HTTPException(status_code=403, detail="Not authorized to access this user's mobile number")
    if not user:
        logger.warning(f"[GET_MOBILE_BY_USERNAME] User not found: {username}")
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.mobile:
        logger.warning(f"[GET_MOBILE_BY_USERNAME] Mobile number not available for user: {username}")
        raise HTTPException(status_code=404, detail="Mobile number not available for this user")

    return {"mobile": user.mobile}

# For Forget Password Flow
@router.post("/send-otp-to-username")
def send_otp_to_username(
    username: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    # ---- Validation (client-side mistake, no security impact) ----
    if not username or username.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request: username is required"
        )

    # ---- Internal lookup (never reveal existence) ----
    user = db.query(User).filter(User.username == username).first()

    if not user:
        logger.warning(f"OTP request for username: {username} - User not found")

    # ---- Silent handling to avoid enumeration ----
    if user and user.mobile:
        # Only send OTP internally
        return sms_service.send_otp(user.mobile, db)

    # ---- Always return same response ----
    return {"message": neutral_response}

@router.post("/verify-login-credentials")
def verify_login_credentials(
    body: login_otp_request,
    db: Session = Depends(get_db)
):
    username = body.username
    password = body.password

    if not username or username.strip() == "" or not password:
        logger.warning("[VERIFY_LOGIN_CREDENTIALS] Username and password are required")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required"
        )

    user = db.query(User).filter(User.username == username).first()

    if not user:
        logger.warning(f"Login attempt failed for username: {username} - User not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    if not verify_password(password, user.password_hash):
        logger.warning(f"[VERIFY_LOGIN_CREDENTIALS] Failed login attempt - incorrect password for user: {username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    if not user.mobile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number not registered for this user"
        )

    return sms_service.send_otp(user.mobile, db)


@router.post("/verify-username-otp")
def verify_user_credentials(request: verify_usercreds_request, db: Session = Depends(get_db)):
    # ---- Basic validation (client-side mistake only) ----
    if not request.username or request.username.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request: username is required"
        )

    if not request.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request: OTP is required"
        )
    
    # Neutral success/failure message (same for attacker)
    neutral_response = {
        "message": "If the credentials are correct, the OTP will be verified.",
        "resetToken": None
    }
    
    user = db.query(User).filter(User.username == request.username).first()
    
    verified = False
    mobile = None
    
    # ---- Silent lookup + silent OTP verification ----
    if user and user.mobile:
        mobile = user.mobile
        verified = sms_service.verify_otp(user.mobile, request.otp)

    # ---- If OTP is NOT verified, return the neutral response ----
    if not verified:
        return neutral_response
    
    # ---- OTP is correct → Issue reset token (internally only) ----
    payload = {
        "username": request.username,
        "mobile": mobile,
        "verified": True
    }
    
    token = create_jwt(
        payload,
        settings.secret_key,
        algorithm=settings.algorithm,
        expires_minutes=5
    )

    return {
        "message": "OTP verified successfully. You can now reset your password.",
        "resetToken": token
    }


@router.post("/login", response_model=login_response)
def login(request: Request, body: login_request, db: Session = Depends(get_db)):
 
    user = db.query(User).filter(User.username == body.username).first()
    if user is None:
        logger.warning("[LOGIN] Wrong credentials provided - user not found")
        raise HTTPException(status_code=404, detail="Wrong Credentials Provided")
 
    # Verify the provided password
    if not verify_password(body.password, user.password_hash):
        logger.warning("[LOGIN] Wrong credentials provided - incorrect password")
        raise HTTPException(status_code=401, detail="Wrong Credentials Provided")
 
    # Check if the user is active
    if user.is_active == False:
        logger.warning(f"[LOGIN] User is inactive: {body.username}")
        raise HTTPException(status_code=403, detail="User is inactive")
    
    
    if user and user.mobile:
        verified = sms_service.verify_otp(user.mobile, body.verificationCode)
    
    if not verified:
        logger.warning(f"[LOGIN] OTP verification failed for user: {body.username}")
        raise HTTPException(status_code=401, detail="Wrong Credentials Provided")

    active_session = db.query(UserSession).filter( and_(
        cast(UserSession.user_context.op("->>")("user_id"), UUID) == user.id,
        UserSession.is_revoked == False,
        UserSession.exp > datetime.now(timezone.utc)
    )).first()
    
    if active_session:
        now = datetime.now(timezone.utc)
        time_diff = now - active_session.exp
        minutes_remaining = int(abs(time_diff.total_seconds()) // 60)
        logger.warning(f"[LOGIN] Active session already running for user: {body.username}")
        raise HTTPException(
            status_code=403,
            detail=f"Active session is already running, please logout from the same session or wait for {minutes_remaining} minutes for idle session auto logout"
        )
 
    # Gather session attributes
    now = datetime.now(timezone.utc)
    expire_time = now + timedelta(minutes = SESSION_TIME)
    user_agent = request.headers.get("user-agent", "")
    ip_address = request.client.host if request.client else ""
    session_id = uuid.uuid4()
    session_id_str = str(session_id) 
 
    # Create JWT session token with all required attributes
    session_payload = {
        "session_id": session_id_str,
        "user_id": str(user.id),
        "user_agent": user_agent,
        "ip_address": ip_address,
        "iat": int(now.timestamp()),
        "exp": int(expire_time.timestamp())
    }
    session_token = create_jwt(
       session_payload,
       settings.secret_key,
       algorithm=settings.algorithm,
       expires_minutes=settings.session_timeout_minutes
    )
    user_context = {
        "user_id": str(user.id),  # store string to avoid JSONB UUID confusion
        "entity_id": str(user.entity_id) if user.entity_id else None,
        "role_code": user.role_code,
        "username": user.username
    }
    # Create session entry in DB
    new_session = UserSession(
        session_id=session_id,
        user_context=user_context,
        session_token=session_token,
        login_time=now,
        last_activity=now,
        logout_time=None,
        ip_address=ip_address,
        user_agent=user_agent,
        is_active=True,
        is_revoked=False,
        failed_attempts=0,
        iat=now,
        exp=expire_time
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
 
    entity = db.query(Entity).filter(Entity.id == user.entity_id).first()
 
    response_data = {
        "session_token": session_token,
        "session_id": str(new_session.session_id),
        "login_time": new_session.login_time.isoformat(),
        "expiry_time": new_session.exp.isoformat(),
        "user_id": str(user.id),
        "username": user.username,
        "full_name": user.full_name,
        "role_code": user.role_code,
        "is_password_reset": user.is_password_reset,
        "message": "Login successful"
    }
        
    if entity:
        response_data.update({
            "entity_id": str(entity.id),
            "entity_type": entity.entity_type,
            "entity_reg_no": entity.entity_reg_no,
            "org_name": entity.org_name,
            "sector_type": entity.sector_code,
            "address": entity.address,
            "state": entity.state_code
        })
 
    response = JSONResponse(response_data)
   
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,  
        secure=True,
        samesite="none",
        max_age=60*60*10,
        path="/"
    )
    response.set_cookie(
        key="session_id",
        value=session_id_str,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60*60*10,
        path="/"
    )

    return response


@router.post("/reset-password")
def reset_password(request: reset_password_request, db: Session = Depends(get_db)):
    reset_token = request.token
    new_password = request.new_password
    
    # 1️⃣ Verify the reset token
    payload = decode_jwt(reset_token, settings.secret_key, settings.algorithm)
    username = payload.get("username")
    mobile = payload.get("mobile")
    verified = payload.get("verified")

    if not verified:
        logger.warning("[RESET_PASSWORD] Invalid credentials - OTP not verified")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid credetials. OTP was not verified."
        )

    # Password validation rules
    if not validate_password(new_password):
        logger.warning("[RESET_PASSWORD] Password does not meet security requirements")
        raise HTTPException(
            status_code=400,
            detail="Password does not meet security requirements. "
                   "Must be at least 8 characters long, include uppercase, lowercase, number, and special character (@$!%*?&)."
        )

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        logger.warning(f"[RESET_PASSWORD] User not found: {username}")
        raise HTTPException(status_code=404, detail="Invalid credetials. User was not verified")
    if user.mobile != mobile:
        logger.warning(f"[RESET_PASSWORD] Mobile mismatch for user: {username}")
        raise HTTPException(status_code=404, detail="Invalid credetials. User was not verified")    
    
    hashed_password = hash_password(new_password)
    user.password_hash = hashed_password

    db.commit()
    
    logger.info("[RESET_PASSWORD] Password reset successfully")
    return {"message": "Password reset successfully. You can now log in with your new password."}

@router.post("/change-password")
def change_password(request: Request, payload : change_password_request, db: Session = Depends(get_db)):

    user_id = request.state.user_id
    
    if user_id is None:
        logger.warning("[CHANGE_PASSWORD] Unauthorized access - no user_id")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized access")
    
    if payload.current_password == payload.new_password :
        logger.warning("[CHANGE_PASSWORD] Old password and new password cannot be same")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Old password and New Password cannot be same.")
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        logger.warning(f"[CHANGE_PASSWORD] User not found with id: {user_id}")
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(payload.current_password, user.password_hash):
        logger.warning(f"[CHANGE_PASSWORD] Invalid current password for user: {user_id}")
        raise HTTPException(status_code=401, detail="Invalid current password")

    # Password validation rules
    if not validate_password(payload.new_password):
        logger.warning("[CHANGE_PASSWORD] Password does not meet security requirements")
        raise HTTPException(
            status_code=400,
            detail="Password does not meet security requirements. "
                   "Must be at least 8 characters long, include uppercase, lowercase, number, and special character (@$!%*?&)."
        )

    hashed_password = hash_password(payload.new_password)
    user.password_hash = hashed_password
    user.is_password_reset = True
    
    db.add(user)
    db.commit()
    
    full_name = user.full_name if user.full_name else "User"
    context = {"var" : [full_name, "RCO.support@beeindia.gov.in"]}
    mobile = user.mobile
    sms_service.send_template('change_password', mobile, context, db)
    
    return {"message": "Password changed successfully"}

@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db)):
    # Extract session info from headers (prefer) or cookies (fallback)
    session_token = request.headers.get("Session-Token")
    session_id = request.headers.get("Session-Id")

    if not session_token:
        session_token = request.cookies.get("session_token")

    if not session_id:
        session_id = request.cookies.get("session_id")
    
    if not session_token or not session_id:
        return JSONResponse({"message": "Session token or session id not found"}, status_code=400)

    # Delete session from session table using both session_id and session_token
    session_obj = db.query(UserSession).filter(
        UserSession.session_id == session_id,
        UserSession.session_token == session_token
    ).first()
    if session_obj:
        db.delete(session_obj)
        db.commit()

    response = JSONResponse({"message": "Logout successful"})
    # Remove all session cookies, including starlette_session
    response.delete_cookie("session_token", path="/")
    response.delete_cookie("session_id", path="/")
    response.delete_cookie("starlette_session", path="/")

    return response

@router.get("/check_session")
def check_session(request: Request, db: Session = Depends(get_db)):
    user_id = getattr(request.state, "user_id", None)

    if not user_id:
        logger.warning("[CHECK_SESSION] User not authenticated")
        raise HTTPException(401, "User not authenticated")
    
    session_details = db.query(UserSession).filter(UserSession.user_id == user_id).order_by(UserSession.login_time, desc).first()
    if not session_details:
        logger.warning(f"[CHECK_SESSION] Session not found for user: {user_id}")
        raise HTTPException(404, "Session details not found")

    return {
        "message": "User is authenticated",
        "login_time": session_details.login_time,
        "last_activity": session_details.last_activity,
        "session_expiry": session_details.exp
    }


@router.post("/refresh-session")
def refresh_session (request: Request, db: Session = Depends(get_db)):
    try:
        # Extract session info from headers (prefer) or cookies (fallback)
        session_token = request.headers.get("Session-Token")
        session_id = request.headers.get("Session-Id")

        if not session_token:
            session_token = request.cookies.get("session_token")

        if not session_id:
            session_id = request.cookies.get("session_id")

        if not session_token or not session_id:
            logger.warning("[REFRESH_SESSION] Session token or session id not found")
            raise HTTPException(
                status_code=400,
                detail="Session token or session id not found"
            )

        # Fetch session
        session_obj = db.query(UserSession).filter(
            UserSession.session_id == session_id,
            UserSession.session_token == session_token,
            UserSession.is_active == True,
            UserSession.is_revoked == False
        ).first()

        if not session_obj:
            logger.warning("[REFRESH_SESSION] Session not found or inactive")
            raise HTTPException(
                status_code=401,
                detail="Session not found or inactive"
            )

        now = datetime.now(timezone.utc)

        session_obj.last_activity = now
        session_obj.exp = now + timedelta(minutes = SESSION_TIME)

        db.commit()
        # Refresh object from DB to ensure update succeeded
        db.refresh(session_obj)

        logger.info("[REFRESH_SESSION] Session refreshed successfully")
        return {
                "success": True,
                "message": "Session extended successfully",
                "expiry_time": session_obj.exp.isoformat(),
                "last_activity": session_obj.last_activity.isoformat()
            }
    except HTTPException:
        # Re-raise FastAPI handled exceptions
        raise

    except SQLAlchemyError as e:
        db.rollback()
        logger.error("[REFRESH_SESSION] Database error during session refresh", exc_info=True)
        print("Database error in refresh_session:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Database error while refreshing session"
        )

    except Exception as e:
        db.rollback()
        logger.error("[REFRESH_SESSION] Unexpected error during session refresh", exc_info=True)
        print("Unexpected error in refresh_session:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )
