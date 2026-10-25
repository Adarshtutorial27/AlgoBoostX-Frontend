"""Pydantic schemas for Delta Exchange Account Connections."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class AccountConnectRequest(BaseModel):
    label: str = Field(default="Delta Testnet Account", min_length=1, max_length=100)
    api_key: str = Field(..., min_length=4, max_length=128, description="Delta Exchange API Key")
    api_secret: str = Field(..., min_length=4, max_length=128, description="Delta Exchange API Secret")
    environment: str = Field(default="testnet", description="Environment: strictly 'testnet' by default")
    base_url: str = Field(default="https://cdn-ind.testnet.deltaex.org", description="Delta Exchange Base URL")
    ip_whitelist_note: Optional[str] = Field(
        default="IP whitelisting must be configured directly on the Delta Exchange portal",
        description="Informational note regarding IP whitelist configuration"
    )
    user_id: Optional[str] = Field(default="default_user", description="Account isolation user ID")


class AccountValidateRequest(BaseModel):
    api_key: str = Field(..., min_length=4, max_length=128)
    api_secret: str = Field(..., min_length=4, max_length=128)
    base_url: str = Field(default="https://cdn-ind.testnet.deltaex.org")


class AccountResponse(BaseModel):
    account_id: str
    user_id: str
    label: str
    environment: str
    base_url: str
    api_key_masked: str
    ip_whitelist_note: Optional[str] = None
    is_active: bool
    is_validated: bool
    last_validated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AccountStatusResponse(BaseModel):
    connected: bool
    account_id: Optional[str] = None
    label: Optional[str] = None
    environment: str
    is_active: bool
    is_validated: bool
    api_key_masked: Optional[str] = None
    public_api_healthy: bool
    private_auth_healthy: bool
    has_active_account: bool = False
    message: str
