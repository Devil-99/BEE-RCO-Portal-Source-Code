# ...existing code...
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
import bcrypt
import re
import string
import secrets
import random
from typing import Tuple
from src.settings import settings
from src.models import User

def verify_user_access(request: Request, required_role: set, db: Session) -> None:
    """
    Verify if the user has the required role to access the endpoint.
    Raises HTTPException with status 403 if access is denied.
    """
    user_role = getattr(request.state, "role_code", None)
    user_id = getattr(request.state, "user_id", None)
    entity_id = getattr(request.state, "entity_id", None)

    user_info = db.query(User).filter(User.id == user_id).first()

    if user_info is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    if str(user_info.entity_id) != entity_id or user_info.role_code != user_role or user_role not in required_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You are not authorized to access this data."
        )
    

def validate_password(password: str) -> bool:
    """Validate password with required rules"""
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    if not re.search(r"[@$!%*?&]", password):
        return False
    return True


def generate_password(length: int = 12) -> str:
    """
    Generate a cryptographically-random password containing at least:
      - 1 uppercase letter
      - 1 lowercase letter
      - 1 digit
      - 1 special character
    Default length is 12. Minimum allowed length is 8.
    """
    if length < 8:
        raise ValueError("Password length must be at least 8")

    specials = "!@#$%^&*()_"
    # ensure at least one char from each required category
    password_chars = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice(specials),
    ]

    all_chars = string.ascii_letters + string.digits + specials
    for _ in range(length - len(password_chars)):
        password_chars.append(secrets.choice(all_chars))

    # Shuffle using a cryptographically secure RNG
    random.SystemRandom().shuffle(password_chars)
    return "".join(password_chars)

def hash_password(password: str = None) -> str:
    """
    Hash password using bcrypt. Truncate to 72 bytes to avoid bcrypt limitation.
    """
    if password is None:
        # check for default password from settings
        if not settings.default_password:
            print("No default password set in settings")
            raise ValueError("No password provided and default password is not set.")
        password = settings.default_password
    
    password_bytes = password.encode("utf-8")
    # bcrypt accepts max 72 bytes
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """
    Verify password, truncating input to 72 bytes before checking.
    """
    if password is None or hashed is None:
        return False

    password_bytes = password.encode("utf-8")[:72]
    return bcrypt.checkpw(password_bytes, hashed.encode("utf-8"))