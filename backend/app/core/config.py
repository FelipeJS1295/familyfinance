from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    APP_NAME: str = "FamilyFinance"

    DATABASE_URL: str = "postgresql+asyncpg://ff_user:ff_password_dev@postgres:5432/familyfinance"
    REDIS_URL: str = "redis://redis:6379/0"

    JWT_SECRET: str = "dev_secret_cambia_esto_en_produccion_minimo_64_caracteres"
    JWT_REFRESH_SECRET: str = "dev_refresh_secret_cambia_esto_en_produccion_minimo_64"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_EXPIRE_DAYS: int = 30

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@familyfinance.cl"
    EMAIL_FROM_NAME: str = "FamilyFinance"

    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"

    FREE_MAX_TRANSACTIONS_PER_MONTH: int = 50
    FREE_MAX_USERS: int = 2
    PRO_MAX_USERS: int = 5
    FAMILIA_PLUS_MAX_USERS: int = 10


settings = Settings()