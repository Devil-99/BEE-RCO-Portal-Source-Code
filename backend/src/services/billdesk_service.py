# src/services/billdesk_service.py

import httpx 
import base64
import json
import datetime
import string
import secrets
from .jws_service import create_jws
from src.settings import settings


def generate_unique_trace_id(prefix: str = "trace") -> str:
    """
    Generates a unique, alphanumeric Trace ID of exactly 35 characters.
    Format: <prefix><timestamp_ms><random_chars>
    """
    # Get current timestamp in milliseconds to ensure chronological order and uniqueness
    timestamp_ms = str(int(datetime.datetime.now().timestamp() * 1000))
    
    # Define the character set for the random part (alphanumeric)
    alphabet = string.ascii_letters + string.digits
    
    # Calculate how many random characters we need to fill the remaining length
    prefix_len = len(prefix)
    timestamp_len = len(timestamp_ms)
    
    # The length of the random part needed to reach 35 chars
    random_len = 35 - prefix_len - timestamp_len
    
    # Ensure random_len is not negative if the prefix/timestamp is too long
    if random_len < 0:
        # If somehow the prefix + timestamp is already > 35, we truncate it
        return (prefix + timestamp_ms)[:35]
        
    # Generate a secure random string for the remaining length
    random_part = ''.join(secrets.choice(alphabet) for _ in range(random_len))
    
    # Combine all parts to form the final trace_id
    trace_id = f"{prefix}{timestamp_ms}{random_part}"
    
    return trace_id

async def create_order_api(order_details: dict) -> dict:
    """
    Calls the BillDesk Create Order API with detailed debugging.
    """
    # --- DEBUG ---
    print("\n[DEBUG] (billdesk_service) ==> Preparing to call BillDesk Create Order API.")

    # Generate the JWS token for the request
    jws_token = create_jws(order_details)
    

    trace_id = generate_unique_trace_id()
    # Prepare headers for the request
    headers = {
        'Content-Type': 'application/jose',
        'Accept': 'application/jose',
        'BD-Traceid': f"{trace_id}",
        'BD-Timestamp': str(int(datetime.datetime.now().timestamp() * 1000)),
    }

    target_url = settings.billdesk_create_order_url

    # --- DEBUG ---
    print(f"[DEBUG] (billdesk_service) Target URL: {target_url}")
    print(f"[DEBUG] (billdesk_service) Request Headers:\n{json.dumps(headers, indent=2)}")
    print(f"[DEBUG] (billdesk_service) JWS Token (first 50 chars): {jws_token[:50]}...")
    
    try:
        # Use an async client to make the HTTP POST request
        async with httpx.AsyncClient() as client:
            print("[DEBUG] (billdesk_service) Sending POST request...")
            response = await client.post(
                target_url,
                content=jws_token,
                headers=headers
            )
            
            # --- DEBUG ---
            print(f"[DEBUG] (billdesk_service) Received response with Status Code: {response.status_code}")

            # This is the most important line for error handling.
            # It will raise an HTTPStatusError for any 4xx or 5xx response.
            response.raise_for_status() 
            
            # If the code reaches here, the status code was successful (2xx)
            print("[DEBUG] (billdesk_service) Response was successful. Decoding payload...")
            
            # The response body is also a JWS token, so we need to decode its payload part
            _, payload_b64, _ = response.text.split('.')
            decoded_payload = json.loads(base64.urlsafe_b64decode(payload_b64 + '=='))
            
            print("[DEBUG] (billdesk_service) Successfully decoded response payload. Returning.")
            return decoded_payload

    except httpx.HTTPStatusError as e:
        # This block will execute specifically for 4xx and 5xx errors (like your 422)
        # --- DEBUG ---
        print("\n[DEBUG] (billdesk_service) !!! HTTPStatusError CAUGHT !!!")
        print(f"[DEBUG] (billdesk_service) Status Code: {e.response.status_code}")
        # The response body often contains a JSON with an error message from the server
        print(f"[DEBUG] (billdesk_service) Raw Response Body from BillDesk: {e.response.text}")
        
        # We re-raise the exception to let the calling function know something went wrong
        # The new error message is much more informative.
        raise Exception(f"HTTP error occurred: {e.response.status_code} - The BillDesk server responded with: {e.response.text}")

    except httpx.RequestError as e:
        # This catches network-level errors (e.g., cannot connect, DNS error)
        # --- DEBUG ---
        print(f"\n[DEBUG] (billdesk_service) !!! RequestError CAUGHT: {str(e)} !!!")
        raise Exception(f"A network request error occurred: {str(e)}")

    except Exception as e:
        # This catches any other unexpected errors (like splitting the JWS response)
        # --- DEBUG ---
        print(f"\n[DEBUG] (billdesk_service) !!! An unexpected error occurred: {str(e)} !!!")
        raise Exception(f"An unexpected error occurred in billdesk_service: {str(e)}")