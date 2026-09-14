import base64
import os
from Crypto.Cipher import AES as domeAES
from Crypto.Util.Padding import pad, unpad
from urllib.parse import quote
import logging
from src.utils.sbiPaymentConfiguration import SBI_CONFIG

logger = logging.getLogger(__name__)

def pad(byte_array):
    BLOCK_SIZE = 16
    pad_len = BLOCK_SIZE - len(byte_array) % BLOCK_SIZE
    return byte_array + (bytes([pad_len]) * pad_len)

def unpad(byte_array):
    last_byte = byte_array[-1]
    return byte_array[0:-last_byte]

def encrypt(concatePipe, key):
    byte_array = concatePipe.encode("UTF-8")
    padded = pad(byte_array)
    iv = os.urandom(domeAES.block_size)
    cipher = domeAES.new(key.encode('UTF-8'), domeAES.MODE_CBC, iv)
    encrypted = cipher.encrypt(padded)
    return base64.b64encode(iv + encrypted).decode("UTF-8")

def decrypt(message, key):
    byte_array = base64.b64decode(message)
    iv = byte_array[0:16]
    messagebytes = byte_array[16:]
    cipher = domeAES.new(key.encode("UTF-8"), domeAES.MODE_CBC, iv)
    decrypted_padded = cipher.decrypt(messagebytes)
    decrypted = unpad(decrypted_padded)
    return decrypted.decode("UTF-8")

def build_payment_payload(
    amount: float,
    order_id: str,
    other_details:str,
    pay_mode: str,
    callback_url: str
) -> dict:
    return {
        "MerchantID": SBI_CONFIG["MERCHANT_ID"],
        "OperatingMode": SBI_CONFIG["OPERATING_MODE"],
        "MerchantCountry": SBI_CONFIG["MERCHANT_COUNTRY"],
        "MerchantCurrency": SBI_CONFIG["MERCHANT_CURRENCY"],
        "PostingAmount": amount,
        "OtherDetails": other_details,
        "SuccessURL": callback_url,
        "FailURL": callback_url,
        "AggregatorID": SBI_CONFIG["AGGREGATOR_ID"],
        "MerchantOrderNumber": order_id,
        "MerchantCustomerID": "NA",
        "PayMode": pay_mode,
        "AccessMedium": SBI_CONFIG["ACCESS_MEDIUM"],
        "TransactionSource": SBI_CONFIG["TRANSACTION_SOURCE"],
    }


def create_pipe_string(payload: dict) -> str:
    
    return "|".join([
        str(payload["MerchantID"]),
        payload["OperatingMode"],
        payload["MerchantCountry"],
        payload["MerchantCurrency"],
        str(payload["PostingAmount"]),
        payload["OtherDetails"],
        payload["SuccessURL"],
        payload["FailURL"],
        payload["AggregatorID"],
        str(payload["MerchantOrderNumber"]),
        payload["MerchantCustomerID"],
        payload["PayMode"],
        payload["AccessMedium"],
        payload["TransactionSource"],
    ])


def initiate_sbi_payment(
    amount: float,
    order_id: str,
    other_details: str,
    pay_mode: str,
    callback_url: str,
) -> dict:
    try:
        if not order_id:
            raise ValueError("Order ID is required for payment initiation")
        
        # Build and encrypt payment payload
        payload = build_payment_payload(amount, str(order_id), other_details, pay_mode, callback_url)
        print("Payload", payload , "\n")
        
        pipe_string = create_pipe_string(payload)
        print("Pipe String", pipe_string, "\n")
        
        encrypted_value = encrypt(pipe_string, SBI_CONFIG["ENC_KEY"])
        print("Encrypted Value", encrypted_value, "\n")
        
        logger.info(f"Payment payload encrypted successfully for order: {order_id}")
        
        # Construct the redirect URL with encrypted data
        # Frontend will receive this and either:
        # 1. Redirect the user to this URL directly, OR
        # 2. Submit a form with the encrypted data
        redirect_url = (
            f"{SBI_CONFIG['SBI_API_ENDPOINT']}?"
            f"EncryptTrans={quote(encrypted_value)}&"
            f"merchIdVal={SBI_CONFIG['MERCHANT_ID']}"
        )
        
        return {
            "success": True,
            "redirect_url": redirect_url,
            "encrypted_data": encrypted_value,
            "merchant_id": SBI_CONFIG["MERCHANT_ID"],
            "message": "Payment payload prepared successfully"
        }
    
    except Exception as e:
        logger.error(f"Payment initiation failed: {str(e)}")
        return {
            "success": False,
            "message": "Payment initiation failed",
            "error": str(e)
        }
        
def parse_sbi_response(enc_data: str) -> dict:
    """
    Parse and decrypt SBI payment response data.
    """
    decrypted_data = decrypt(enc_data, SBI_CONFIG["ENC_KEY"])
    fields = decrypted_data.split("|")

    def safe_get(i: int):
        return fields[i] if len(fields) > i and fields[i] != "" else None

    response = {
        "merchant_order_number": safe_get(0),
        "atrn": safe_get(1),
        "transaction_status": safe_get(2),
        "amount": safe_get(3),
        "currency": safe_get(4),
        "pay_mode": safe_get(5),
        "other_details": safe_get(6),
        "reason_message": safe_get(7),
        "bank_code": safe_get(8),
        "bank_reference_number": safe_get(9),
        "transaction_date": safe_get(10),
        "country": safe_get(11),
        "cin": safe_get(12),
        "merchant_id": safe_get(13),
        "total_fee_gst": safe_get(14),

        "ref1": safe_get(15),
        "ref2": safe_get(16),
        "ref3": safe_get(17),
        "ref4": safe_get(18),
        "ref5": safe_get(19),
        "ref6": safe_get(20),
        "ref7": safe_get(21),
        "ref8": safe_get(22),
        "ref9": safe_get(23),

        "raw_decrypted": decrypted_data
    }

    return response
