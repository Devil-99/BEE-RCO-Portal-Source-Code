import base64
import hashlib
import hmac
import json
from src.settings import settings # Assuming this is your Pydantic settings module

def base64url_encode(data: bytes) -> str:
    """Encodes data in Base64URL format."""
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def create_jws(payload: dict) -> str:
    """Creates a JWS-HMAC-SHA256 signature for a given payload."""
    # --- DEBUG ---
    print("\n[DEBUG] (jws_service) ==> Entering create_jws function.")

    header = {"alg": "HS256", "clientid": settings.billdesk_clientid}
    
    # --- DEBUG ---
    print(f"[DEBUG] (jws_service) Using Header: {json.dumps(header)}")
    print(f"[DEBUG] (jws_service) Using Payload (first 100 chars): {str(payload)[:100]}...")

    encoded_header = base64url_encode(json.dumps(header).encode('utf-8'))
    encoded_payload = base64url_encode(json.dumps(payload).encode('utf-8'))
    
    signature_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
    
    signature = hmac.new(
        settings.billdesk_secretkey.encode('utf-8'),
        signature_input,
        hashlib.sha256
    ).digest()
    
    encoded_signature = base64url_encode(signature)
    
    final_jws = f"{encoded_header}.{encoded_payload}.{encoded_signature}"

    # --- DEBUG ---
    print(f"[DEBUG] (jws_service) Successfully created JWS token.")
    print(f"[DEBUG] (jws_service) <== Exiting create_jws function.")
    
    return final_jws

def verify_jws(jws_string: str) -> dict | None:
    """Verifies a JWS string and returns the payload if valid."""
    # --- DEBUG ---
    print("\n[DEBUG] (jws_service) ==> Entering verify_jws function.")
    print(f"[DEBUG] (jws_service) JWS to verify (first 100 chars): {jws_string[:100]}...")
    
    try:
        header_b64, payload_b64, signature_b64 = jws_string.split('.')
        
        signature_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        
        # --- DEBUG ---
        print(f"[DEBUG] (jws_service) Data for verification (first 50 chars): {signature_input.decode('utf-8')[:50]}...")
        
        expected_signature = hmac.new(
            settings.billdesk_secretkey.encode('utf-8'),
            signature_input,
            hashlib.sha256
        ).digest()

        decoded_signature = base64.urlsafe_b64decode(signature_b64 + '==')

        # Use the constant-time comparison function to prevent timing attacks
        is_signature_valid = hmac.compare_digest(expected_signature, decoded_signature)

        if is_signature_valid:
            # --- DEBUG ---
            print("[DEBUG] (jws_service) SIGNATURE IS VALID.")
            payload_str = base64.urlsafe_b64decode(payload_b64 + '==').decode('utf-8')
            print("[DEBUG] (jws_service) <== Exiting verify_jws with decoded payload.")
            return json.loads(payload_str)
        else:
            # --- DEBUG ---
            print("[DEBUG] (jws_service) !!! SIGNATURE IS INVALID !!! Does not match expected signature.")
            print("[DEBUG] (jws_service) <== Exiting verify_jws with None.")
            return None

    except Exception as e:
        # --- DEBUG ---
        print(f"[DEBUG] (jws_service) !!! EXCEPTION CAUGHT in verify_jws: {str(e)} !!!")
        print(f"[DEBUG] (jws_service) This could be due to a malformed JWS string (e.g., not enough parts).")
        print("[DEBUG] (jws_service) <== Exiting verify_jws with None.")
        return None