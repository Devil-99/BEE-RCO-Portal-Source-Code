from src.settings import settings

SBI_CONFIG = {
    "MERCHANT_ID": settings.sbi_merchant_id,
    "OPERATING_MODE": "DOM",
    "MERCHANT_COUNTRY": "IN",
    "MERCHANT_CURRENCY": "INR",
    "AGGREGATOR_ID": settings.sbi_aggregator_id,
    "ACCESS_MEDIUM": "ONLINE",
    "TRANSACTION_SOURCE": "ONLINE",
    "ENC_KEY": settings.sbi_encryption_key,
    "SBI_API_ENDPOINT": settings.sbi_api_endpoint,
    "DOUBLE_VALIDATION_URL": settings.sbi_double_validation_url
}