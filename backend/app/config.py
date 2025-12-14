"""
Configuration settings for KhaoGully API.

This module loads environment variables and provides centralized configuration
management for the application.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, computed_field
from typing import List


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    
    # Application
    AppName: str = Field(default="KhaoGully API", alias="app_name")
    AppVersion: str = Field(default="1.0.0", alias="app_version")
    Debug: bool = Field(default=True, alias="debug")
    Environment: str = Field(default="development", alias="environment")
    
    # Supabase
    SupabaseUrl: str = Field(alias="supabase_url")
    SupabaseKey: str = Field(alias="supabase_key")
    SupabaseServiceKey: str = Field(alias="supabase_service_key")
    
    # JWT
    JwtSecret: str = Field(alias="jwt_secret")
    JwtAlgorithm: str = Field(default="HS256", alias="jwt_algorithm")
    AccessTokenExpireMinutes: int = Field(default=30, alias="access_token_expire_minutes")
    
    # CORS - stored as comma-separated string in .env
    AllowedOriginsStr: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        alias="allowed_origins"
    )
    
    # Business Logic
    PlatformFeePercentage: int = Field(default=5, alias="platform_fee_percentage")
    TaxPercentage: int = Field(default=5, alias="tax_percentage")
    MinCartValue: int = Field(default=5000, alias="min_cart_value")
    
    @computed_field
    @property
    def AllowedOrigins(self) -> List[str]:
        return [origin.strip() for origin in self.AllowedOriginsStr.split(",")]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
        populate_by_name=True
    )


settings = Settings()
