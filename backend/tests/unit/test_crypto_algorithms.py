import pytest
from cryptography.exceptions import InvalidTag
from app.core.crypto_algorithms import (
    sha256_hex, create_hmac_sha256, verify_hmac_sha256,
    generate_token, encrypt_aes_gcm, decrypt_aes_gcm,
)


def test_sha256_known_vector():
    assert sha256_hex("abc") == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"


def test_hmac_verify_and_reject_tampering():
    sig = create_hmac_sha256("payload", "secret")
    assert verify_hmac_sha256("payload", "secret", sig)
    assert not verify_hmac_sha256("changed", "secret", sig)


def test_empty_hmac_key_rejected():
    with pytest.raises(ValueError):
        create_hmac_sha256("payload", b"")


def test_aes_gcm_roundtrip_and_tamper_detection():
    key = b"k" * 32
    encrypted = encrypt_aes_gcm("private", key, b"ctx")
    assert decrypt_aes_gcm(encrypted, key, b"ctx") == b"private"
    with pytest.raises(InvalidTag):
        decrypt_aes_gcm(encrypted, key, b"wrong-context")


def test_aes_key_size_and_token():
    with pytest.raises(ValueError):
        encrypt_aes_gcm("x", b"short")
    assert len(generate_token()) > 20
