"""AccountConnection ORM model for multi-account Delta Exchange API connections."""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.database import Base


class AccountConnection(Base):
    __tablename__ = "account_connections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    account_id = Column(String(64), unique=True, index=True, default=lambda: f"acc_{uuid.uuid4().hex[:12]}")
    user_id = Column(String(64), index=True, default="default_user", nullable=False)
    label = Column(String(100), default="Delta Testnet Account", nullable=False)
    environment = Column(String(32), default="testnet", nullable=False)  # strictly testnet by default
    base_url = Column(String(255), default="https://cdn-ind.testnet.deltaex.org", nullable=False)
    api_key_masked = Column(String(64), nullable=False)
    api_key_encrypted = Column(Text, nullable=False)
    api_secret_encrypted = Column(Text, nullable=False)
    ip_whitelist_note = Column(String(255), default="Whitelisted on Delta Exchange portal", nullable=True)
    is_active = Column(Boolean, default=False, index=True)
    is_validated = Column(Boolean, default=False)
    last_validated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "account_id": self.account_id,
            "user_id": self.user_id,
            "label": self.label,
            "environment": self.environment,
            "base_url": self.base_url,
            "api_key_masked": self.api_key_masked,
            "ip_whitelist_note": self.ip_whitelist_note,
            "is_active": self.is_active,
            "is_validated": self.is_validated,
            "last_validated_at": self.last_validated_at.isoformat() if self.last_validated_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
