from pathlib import Path
from typing import ClassVar
from pydantic_settings import BaseSettings, SettingsConfigDict

# This configuration is used to load environment variables
# On the first run, variables (Like secret_key etc.) from the env file will be loaded
# Subsequent runs will use the system environment variables

class Settings(BaseSettings):
    app_name: str = ""
    secret_key: str = ""
    algorithm: str = ""
    environment: str = ""
    base_url: str = ""
    database_url: str = ""
    default_password: str = ""
    pinnacle_accesskey: str = ""
    pinnacle_sender_id: str = ""
    pinnacle_dlt_entity_id: str = ""
    pinnacle_otp_dlt_template_id: str = ""
    pinnacle_api_url : str = ""
    sbi_merchant_id : str = ""
    sbi_aggregator_id : str = ""
    sbi_encryption_key : str = ""
    sbi_api_endpoint : str = ""
    sbi_double_validation_url : str = ""
    # annotate as ClassVar so pydantic won't try to treat it as a field
    env_file_path: ClassVar[Path] = Path(__file__).resolve().parents[1] / ".env"
    model_config = SettingsConfigDict(env_prefix="", env_file=str(env_file_path), extra="ignore")
    app_base_url: str = "https://49.50.109.30/v1"
    SESSION_SECRET_KEY : str = ""
    session_timeout_minutes: int = 60

settings = Settings()