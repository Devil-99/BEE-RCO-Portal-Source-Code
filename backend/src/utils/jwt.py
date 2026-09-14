# src/utils/jwt_manager.py
import jwt
from datetime import datetime, timedelta, timezone

import logging
logger = logging.getLogger(__name__)


def create_jwt(
        data: dict,
        secret_key: str,
        algorithm: str,
        expires_minutes: int = 20
    ):
    try:
        if not isinstance(data, dict):
            raise ValueError("JWT payload must be a dictionary")
        if not secret_key:
            raise ValueError("JWT secret key is missing")
        if not algorithm:
            raise ValueError("JWT algorithm is missing")
        if expires_minutes <= 0:
            raise ValueError("JWT expiry duration must be greater than zero")

        now = datetime.now(timezone.utc)
        expire = now + timedelta(minutes=expires_minutes)

        to_encode = data.copy()
        to_encode.update({
            "exp": expire,
            "iat": now
        })
        token = jwt.encode(
            to_encode,
            secret_key,
            algorithm=algorithm
        )

        logger.debug(
            "JWT created successfully. Algorithm=%s, ExpiryMinutes=%s",
            algorithm,
            expires_minutes
        )

        return token
    
    except ValueError:
        logger.exception("Invalid configuration or input while creating JWT")
        raise

    except jwt.PyJWTError:
        logger.exception("JWT encoding failed")
        raise

    except Exception:
        logger.exception("Unexpected error while creating JWT")
        raise

def decode_jwt(
        token: str,
        secret_key: str,
        algorithm: str
    ):
    try:
        if not token:
            logger.warning("JWT decode failed: token is missing")
            return None
        
        if not secret_key:
            logger.error("JWT decode failed: secret key is missing")
            return None

        if not algorithm:
            logger.error("JWT decode failed: algorithm is missing")
            return None

        payload = jwt.decode(
            token,
            secret_key,
            algorithms=[algorithm]
        )

        return payload
    
    except jwt.ExpiredSignatureError:
        logger.warning("JWT validation failed: token has expired")
        return None

    except jwt.InvalidSignatureError:
        logger.warning("JWT validation failed: invalid signature")
        return None

    except jwt.DecodeError:
        logger.warning("JWT validation failed: token could not be decoded")
        return None

    except jwt.InvalidAlgorithmError:
        logger.error(
            "JWT validation failed: invalid or unsupported algorithm"
        )
        return None

    except jwt.InvalidTokenError:
        logger.warning("JWT validation failed: invalid token")
        return None

    except Exception:
        logger.exception("Unexpected error while decoding JWT")
        return None
