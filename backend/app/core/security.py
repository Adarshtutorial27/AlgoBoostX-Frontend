"""Security and encryption utilities for TokenIQ.

Provides AES-128-CBC / Fernet authenticated encryption for storing API secrets at rest,
key masking helpers, and secure key derivation. Secrets are never stored in plaintext.
"""

import base64
import hashlib
import os
from typing import Optional
from cryptography.fernet import Fernet
from app.config import settings


def _get_fernet_key() -> bytes:
    """Derives a stable 32-byte URL-safe base64-encoded Fernet key."""
    # Use explicit ENCRYPTION_MASTER_KEY if present in environment, else derive from APP_NAME + base dir salt
    seed = os.environ.get("ENCRYPTION_MASTER_KEY")
    if not seed:
        # Stable system fallback derivation based on installation path
        seed = f"{settings.APP_NAME}_tokeniq_secure_vault_seed_{settings.DATABASE_URL}"
    # Hash to 32 bytes and base64-encode for Fernet
    key_bytes = hashlib.sha256(seed.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(key_bytes)


_fernet_instance: Optional[Fernet] = None


def get_cipher() -> Fernet:
    global _fernet_instance
    if _fernet_instance is None:
        _fernet_instance = Fernet(_get_fernet_key())
    return _fernet_instance


def encrypt_secret(secret_text: str) -> str:
    """Encrypts a plaintext secret into a base64 ciphertext token."""
    if not secret_text:
        return ""
    cipher = get_cipher()
    encrypted = cipher.encrypt(secret_text.encode("utf-8"))
    return encrypted.decode("utf-8")


def decrypt_secret(encrypted_text: str) -> str:
    """Decrypts an encrypted token back into plaintext."""
    if not encrypted_text:
        return ""
    cipher = get_cipher()
    decrypted = cipher.decrypt(encrypted_text.encode("utf-8"))
    return decrypted.decode("utf-8")


def mask_key(api_key: str) -> str:
    """Masks an API key for safe public/frontend display (e.g., 'dlt_a1...b4c5')."""
    if not api_key:
        return ""
    cleaned = api_key.strip()
    if len(cleaned) <= 8:
        return "***"
    return f"{cleaned[:6]}...{cleaned[-4:]}"
