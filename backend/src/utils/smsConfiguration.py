from src.settings import settings
from fastapi import status, HTTPException

# ==============================================================================
#                      PINNACLE API Configuration & Error Mapping
# ==============================================================================

# PINNACLE_API_URL = 'https://transapi.pinnacle.in/genericapi/JSONGenericReceiver'
PINNACLE_API_URL = settings.pinnacle_api_url
API_KEY = settings.pinnacle_accesskey
SENDER_ID = settings.pinnacle_sender_id
DLT_ENTITY_ID = settings.pinnacle_dlt_entity_id
DEV_BYPASS_MOBILE = 9609968999 # Shuvomoy
UAT_BYPASS_MOBILE = 8168533816  # Aayush

PINNACLE_ERROR_MAP = {
    "301": (status.HTTP_400_BAD_REQUEST, "Invalid XML Request."),
    "302": (status.HTTP_400_BAD_REQUEST, "Invalid JSON Request."),
    "303": (status.HTTP_400_BAD_REQUEST, "Version Field missing / Invalid Version specified."),
    "304": (status.HTTP_400_BAD_REQUEST, "Invalid Request."),
    "305": (status.HTTP_503_SERVICE_UNAVAILABLE, "The SMS service is currently unavailable (Account Deactivated). Please try again later."),
    "306": (status.HTTP_502_BAD_GATEWAY, "SMS provider authentication failed (Invalid Access Key). Please contact support."),
    "307": (status.HTTP_503_SERVICE_UNAVAILABLE, "The SMS service is currently unavailable (Account Expired). Please try again later."),
    "311": (status.HTTP_400_BAD_REQUEST, "The mobile number provided is invalid."),
    "312": (status.HTTP_400_BAD_REQUEST, "The mobile number provided is invalid."),
    "313": (status.HTTP_400_BAD_REQUEST, "The message content is empty."),
    "336": (status.HTTP_502_BAD_GATEWAY, "SMS provider configuration error (Invalid DLT Entity ID). Please contact support."),
    "337": (status.HTTP_502_BAD_GATEWAY, "SMS provider configuration error (Invalid DLT Template ID). Please contact support."),
    "DEFAULT": (status.HTTP_502_BAD_GATEWAY, "An unexpected error occurred with the SMS service provider.")
}

def handle_pinnacle_error(response_data: dict):
    error_code = str(response_data.get("status", {}).get("code"))
    http_status, detail = PINNACLE_ERROR_MAP.get(error_code, PINNACLE_ERROR_MAP["DEFAULT"])
    print(f"ERROR: Pinnacle API returned error code: {error_code}. Full response: {response_data}")
    raise HTTPException(status_code=http_status, detail=detail)