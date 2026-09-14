import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional

# ==============================================================================
#                      REUSABLE VALIDATION LOGIC
# ==============================================================================

def validate_and_normalize_phone(v: str) -> str:
    """
    Validates a phone number string and normalizes it to the 10-digit format.
    Accepts numbers with or without the '91' country code.


    Args:
        v: The input string to validate.

    Raises:
        ValueError: If the phone number format is invalid.
        TypeError: If the input is not a string.

    Returns:
        The normalized 10-digit phone number string.

    """
    if not isinstance(v, str):
        raise TypeError('Phone number must be a string')


    # Regex for validating numbers with or without 91 prefix
    if not re.match(r'^(91)?[6789]\d{9}$', v):
        raise ValueError('Invalid phone number format. Must be 10 digits or 12 digits starting with 91.')

    # If the number starts with '91' and is 12 digits long, strip it
    if v.startswith('91') and len(v) == 12:
        return v[2:]  # return only the last 10 digits

    return v  # Already a valid 10-digit number



# ==============================================================================
#                           API REQUEST SCHEMAS
# ==============================================================================

class SendOtpRequest(BaseModel):
    number: str = Field(
        min_length=10,
        max_length=10,
        description="The user's 10-digit mobile number (e.g., 9934540554 or 919934540554)."
    )
    tsFlag: Optional[bool] = Field(
        False,
        description="Optional flag to indicate if the OTP is for a time-sensitive operation (e.g., login)."
    )


class VerifyOtpRequest(BaseModel):
    number: str = Field(
        min_length=10,
        max_length=10,
        description="The user's 10 digit mobile number."
    )
    otp: str = Field(
        ..., 
        min_length=6, 
        max_length=6, 
        description="The 6-digit OTP received by the user."
    )


class SendTemplateRequest(BaseModel):
    template_key: str = Field(..., description="The template key (e.g., 'otp_login', 'payment_success')")
    number: str = Field(..., min_length=10, max_length=10, description="Destination 10-digit mobile number")
    context: dict = Field({}, description="Context for template placeholders (e.g., {\"otp\": \"123456\"})")


class SmsTemplateCreate(BaseModel):
    template_key: str = Field(..., description="Unique key used in code to reference this template")
    content: str = Field(..., description="Template content with placeholders, e.g., 'Dear {name}, your OTP is {otp}'")
    # DLT template id is required and will act as the primary key for templates
    dlt_template_id: str = Field(..., description="DLT template id — unique identifier used as primary key")