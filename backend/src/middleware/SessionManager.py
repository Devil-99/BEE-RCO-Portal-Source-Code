from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session as DBSession
from datetime import datetime, timezone, timedelta
from src.models.session import Session as UserSession
import src.database as database
from src.utils.jwt import decode_jwt
from src.settings import settings
from src.middleware.Utils.bypass_points import bypass_session_management

import logging
logger = logging.getLogger(__name__)

SESSION_TIME = 60

class SessionManagerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Allow public endpoints without authentication
        if bypass_session_management(request):
            return await call_next(request)
        
        # Extract session info from headers (prefer) or cookies (fallback)
        session_token = request.headers.get("Session-Token")
        session_id = request.headers.get("Session-Id")

        if not session_token:
            session_token = request.cookies.get("session_token")

        if not session_id:
            session_id = request.cookies.get("session_id")
            
        logger.debug(
            "Session fetched from cookies. Session token = %s, Session ID = %s",
            session_token,
            session_id
        )

        if not session_token or not session_id:
            logger.exception("ENTERED SESSION TOKEN OR SESSION ID MISSING BLOCK")
            raise HTTPException(status_code=401, detail="Missing session token or session ID")

        db: DBSession = database.SessionLocal()
        try:
            logger.debug("ENTERED JWT DECODING BLOCK")
            # Decode JWT
            payload = decode_jwt(session_token, settings.secret_key, settings.algorithm)
            if not payload:
                logger.exception("DECODED SESSION PAYLOAD WAS NOT FOUND")
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
 
            user_agent = payload.get("user_agent")
            ip_address = payload.get("ip_address")
 
            # Verify against DB
            user_session = db.query(UserSession).filter(
                UserSession.session_id == session_id,
                UserSession.session_token == session_token,
                UserSession.is_active == True,
                UserSession.is_revoked == False,
            ).first()
 
            if not user_session:
                logger.exception("USER SESSION NOT FOUND IN DB")
                raise HTTPException(status_code=401, detail="Session not found or inactive")
 
            # Extra security: ensure same agent + IP
            if user_session.user_agent != user_agent or user_session.ip_address != ip_address:
                logger.exception("SESSION CONTEXT MISMATCH")
                raise HTTPException(status_code=401, detail="Session context mismatch")
 
            # Expiry check
            now = datetime.now(timezone.utc)
            expire_time = getattr(user_session, "exp", None)

            if expire_time is not None and hasattr(expire_time, "tzinfo") and expire_time.tzinfo is None:
                expire_time = expire_time.replace(tzinfo=timezone.utc)

            if expire_time is not None:
                if now > expire_time:
                    logger.debug("SESSION HAS EXPIRED")
                    setattr(user_session, "is_active", False)
                    setattr(user_session, "logout_time", now)
                    db.commit()
                    raise HTTPException(status_code=401, detail="Session expired due to inactivity")

                else:
                    new_expiry = now + timedelta(minutes = SESSION_TIME)
                    last_activity = now
                    setattr(user_session, "exp", new_expiry)
                    setattr(user_session, "last_activity", last_activity)
                    db.commit()
 
            # Attach user/session info to request state for downstream use
            request.state.user_id = user_session.user_context.get("user_id")
            request.state.session_id = user_session.session_id
            request.state.role_code = user_session.user_context.get("role_code") if user_session.user_context else None
            request.state.entity_id = user_session.user_context.get("entity_id") if user_session.user_context else None
        finally:
            db.close()
 
        # Continue request
        response = await call_next(request)

        response.headers["X-Session-Last-Activity"] = user_session.last_activity.isoformat()
        response.headers["X-Session-Expires-At"] = user_session.exp.isoformat()

        return response
 