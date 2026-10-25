"""Small, reviewed cryptographic helpers for TokenIQ.

Use these primitives for data integrity and application payload encryption.
Do not use plain SHA-256 for password storage; use Argon2id/bcrypt instead.
"""
import base64
import hashlib
import hmac
import secrets
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def sha256_hex(data: bytes | str) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def create_hmac_sha256(data: bytes | str, key: bytes | str) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    if isinstance(key, str):
        key = key.encode("utf-8")
    if not key:
        raise ValueError("HMAC key must not be empty")
    return hmac.new(key, data, hashlib.sha256).hexdigest()


def verify_hmac_sha256(data: bytes | str, key: bytes | str, signature: str) -> bool:
    if not isinstance(signature, str):
        return False
    try:
        expected = create_hmac_sha256(data, key)
    except (TypeError, ValueError):
        return False
    return hmac.compare_digest(expected, signature)


def generate_token(nbytes: int = 32) -> str:
    if not 16 <= nbytes <= 128:
        raise ValueError("nbytes must be between 16 and 128")
    return secrets.token_urlsafe(nbytes)


def encrypt_aes_gcm(plaintext: bytes | str, key: bytes, associated_data: bytes | None = None) -> dict:
    """AES-256-GCM. A fresh random 96-bit nonce is generated for every encryption."""
    if isinstance(plaintext, str):
        plaintext = plaintext.encode("utf-8")
    if not isinstance(key, bytes) or len(key) != 32:
        raise ValueError("AES-256-GCM key must be exactly 32 bytes")
    nonce = secrets.token_bytes(12)
    ciphertext = AESGCM(key).encrypt(nonce, plaintext, associated_data)
    return {
        "nonce": base64.b64encode(nonce).decode("ascii"),
        "ciphertext": base64.b64encode(ciphertext).decode("ascii"),
    }


def decrypt_aes_gcm(payload: dict, key: bytes, associated_data: bytes | None = None) -> bytes:
    """Raises InvalidTag if ciphertext, nonce, key, or associated data is invalid."""
    if not isinstance(key, bytes) or len(key) != 32:
        raise ValueError("AES-256-GCM key must be exactly 32 bytes")
    nonce = base64.b64decode(payload["nonce"], validate=True)
    ciphertext = base64.b64decode(payload["ciphertext"], validate=True)
    if len(nonce) != 12:
        raise ValueError("AES-GCM nonce must be 12 bytes")
    return AESGCM(key).decrypt(nonce, ciphertext, associated_data)
