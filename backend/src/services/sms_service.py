from datetime import datetime, timedelta
import requests
from typing import Dict, Any, Optional
from collections import defaultdict
import re
from src.settings import settings

from sqlalchemy.orm import Session
from src.models import SMS_Templates
from src.utils.smsConfiguration import (
    PINNACLE_API_URL,
    API_KEY,
    SENDER_ID,
    DLT_ENTITY_ID,
    DEV_BYPASS_MOBILE,
    UAT_BYPASS_MOBILE,
    handle_pinnacle_error
)
from fastapi import HTTPException, status

import logging
logger = logging.getLogger(__name__)

class DefaultDict(dict):
    def __missing__(self, key):
        return ''


class SmsClient:
    """Low-level client for Pinnacle SMS API"""

    @staticmethod
    def send_sms(dest: str, message: str, dlt_template_id: str = None) -> Dict[str, Any]:
        if settings.environment == "DEV":  # DEV override for testing
            dest = str(DEV_BYPASS_MOBILE)
        elif settings.environment == "UAT":
            dest = str(UAT_BYPASS_MOBILE)  # UAT override for testing

        payload = {
            "version": "1.0",
            "accesskey": API_KEY,
            "messages": [
                {
                    "dest": [dest],
                    "msg": message,
                    "type": "PM",
                    "header": SENDER_ID,
                    "app_country": "1",
                    "country_cd": "91",
                    "dlt_entity_id": DLT_ENTITY_ID,
                    "dlt_template_id": dlt_template_id
                }
            ]
        }

        try:
            if settings.environment == "LOCAL":  # Skip actual SMS sending in local environment
                print(f"DEBUG: Skipping actual SMS send in LOCAL environment.")
                return {"status": {"code": "200", "message": "SMS send skipped in LOCAL environment."}}
            
            response = requests.post(PINNACLE_API_URL, json=payload)
            response.raise_for_status()
            data = response.json()

            # Handle provider-specific errors
            if "status" in data and data["status"].get("code") != "200":
                handle_pinnacle_error(data)
            logger.info(f"SMS sent successfully to mobile: {dest}, response- {data}")
            return data

        except requests.exceptions.RequestException as e:
            logger.error(f"ERROR: Network error communicating with Pinnacle API: {e}")
            raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="Could not connect to the SMS service provider. Please try again later.")


class SmsService:
    """High-level SMS service: template rendering and specialized handlers."""

    # Simple in-memory OTP store (replace with DB/redis for production)
    otp_store: Dict[str, Dict[str, Any]] = defaultdict(dict)

    OTP_VALIDITY_MIN = 3
    OTP_COOLDOWN_SECONDS = 30
    OTP_LIMIT_PER_HOUR = 3
    OTP_LIMIT_PER_DAY = 10

    def _get_template_from_db(self, template_key: str, db: Session) -> Optional[SMS_Templates]:
        tpl = db.query(SMS_Templates).filter(SMS_Templates.template_key == template_key).first()
        return tpl

    def render(self, content: str, context: Dict[str, Any]) -> str:
        # Render provided template content string with context.
        
        pattern = re.compile(r'{{#(\w+)#}}')
        counts = defaultdict(int)

        # First pass: replace each {{#name#}} with a unique placeholder {name__<idx>}
        def _repl(match):
            name = match.group(1)
            idx = counts[name]
            counts[name] += 1
            return f'{{{name}__{idx}}}'

        templ = pattern.sub(_repl, content)

        # Build mapping for the unique placeholders
        mapping: Dict[str, str] = {}
        for name, cnt in counts.items():
            vals = context.get(name)
            if isinstance(vals, (list, tuple)):
                for i in range(cnt):
                    mapping[f'{name}__{i}'] = str(vals[i]) if i < len(vals) else ''
            else:
                val_str = '' if vals is None else str(vals)
                for i in range(cnt):
                    mapping[f'{name}__{i}'] = val_str

        # Merge original context so regular {name} placeholders still work
        combined = {**{k: str(v) for k, v in context.items()}, **mapping}
        return templ.format_map(DefaultDict(combined))

    def send_template(self, template_key: str, dest: str, context: Dict[str, Any], db: Session) -> Dict[str, Any]:
        tpl = self._get_template_from_db(template_key, db)
        if not tpl:
            raise HTTPException(status_code=500, detail=f"SMS template '{template_key}' not found in DB")
        dlt_template_id = tpl.dlt_template_id
        message = self.render(tpl.content, context)
        return SmsClient.send_sms(dest, message, dlt_template_id)

    # ----------------- OTP helpers -----------------
    def generate_otp(self) -> str:
        import secrets
        return str(secrets.randbelow(10**6)).zfill(6)

    def _check_rate_limit(self, phone_number: str):
        now = datetime.now()
        data = self.otp_store.get(phone_number, {})

        if 'blocked_until' in data and data['blocked_until'] > now:
            raise HTTPException(status_code=429, detail=f"Too many attempts. Try again after {data['blocked_until']}")

        last_sent = data.get('last_sent_at')
        send_count_hour = data.get('send_count_hour', 0)
        send_count_day = data.get('send_count_day', 0)

        if last_sent and (now - last_sent).total_seconds() < self.OTP_COOLDOWN_SECONDS:
            remaining = self.OTP_COOLDOWN_SECONDS - int((now - last_sent).total_seconds())
            raise HTTPException(status_code=429, detail=f"Please wait {remaining} seconds before requesting another OTP.")

        # Hourly limit → block for 1 hour
        if send_count_hour >= self.OTP_LIMIT_PER_HOUR:
            data['blocked_until'] = now + timedelta(hours=1)
            self.otp_store[phone_number] = data
            raise HTTPException(status_code=429, detail="Hourly OTP limit reached. Try again later.")

        # Daily limit → block until the start of next day (or use timedelta(days=1))
        tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        if send_count_day >= self.OTP_LIMIT_PER_DAY:
            data['blocked_until'] = tomorrow
            self.otp_store[phone_number] = data
            raise HTTPException(status_code=429, detail="Daily OTP limit reached. Try again tomorrow.")

    def _update_rate_limit(self, phone_number: str):
        now = datetime.now()
        data = self.otp_store.get(phone_number, {})

        if 'hour_reset' not in data or data['hour_reset'] < now.replace(minute=0, second=0, microsecond=0):
            data['send_count_hour'] = 0
            data['hour_reset'] = now.replace(minute=0, second=0, microsecond=0)

        if 'day_reset' not in data or data['day_reset'] < datetime(now.year, now.month, now.day):
            data['send_count_day'] = 0
            data['day_reset'] = datetime(now.year, now.month, now.day)

        data['send_count_hour'] += 1
        data['send_count_day'] += 1
        data['last_sent_at'] = now

        self.otp_store[phone_number] = data

    def send_otp(self, phone_number: str, db: Session) -> Dict[str, Any]:
        logger.info(f"Sending OTP request for mobile: {phone_number}")

        try:
            # Check rate limit
            self._check_rate_limit(phone_number)

            # Generate OTP and print on the log
            otp = self.generate_otp()
            logger.info(f"OTP generated: {otp}")

            context = {
                "var": ["User", otp, self.OTP_VALIDITY_MIN]
            }

            # Send SMS (may raise HTTPException)
            self.send_template(
                template_key="login_otp",
                dest=phone_number,
                context=context,
                db=db
            )

            # Store OTP only after successful SMS
            expiration_time = datetime.now() + timedelta(minutes=self.OTP_VALIDITY_MIN)
            current = self.otp_store.get(phone_number, {})
            current.update({
                "code": otp,
                "expires_at": expiration_time
            })
            self.otp_store[phone_number] = current
            self._update_rate_limit(phone_number)

            return {
                "message": f"If the credentials are correct, an OTP will be sent.",
                "expires_in": self.OTP_VALIDITY_MIN
            }

        except HTTPException as e:
            logger.error(
                f"Failed to send OTP to {phone_number}. "
                f"Status: {e.status_code}, Detail: {e.detail}"
            )
            raise
        except Exception as e:
            logger.exception(f"Unexpected error while sending OTP to {phone_number}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send OTP. Please try again later."
            )
    
    def verify_otp(self, phone_number: str, otp_attempt: str) -> bool:
        stored = self.otp_store.get(phone_number)
        if not stored:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No OTP found for this number. Please request one first.")

        if datetime.now() > stored['expires_at']:
            del self.otp_store[phone_number]
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="OTP has expired. Please request a new one.")

        if otp_attempt != stored['code']:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP provided.")

        del self.otp_store[phone_number]
        return True


# Singleton service instance (easy to import and use)
sms_service = SmsService()
