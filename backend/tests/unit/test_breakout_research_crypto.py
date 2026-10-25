import pytest
import pandas as pd
from app.core.crypto_algorithms import (
    sha256_hex, create_hmac_sha256, verify_hmac_sha256,
    generate_token, encrypt_aes_gcm, decrypt_aes_gcm,
)
from app.api.v1.breakout_research import analyze_monthly_candles
from app.strategies.breakout_retest import BreakoutRetestStrategy


def test_sha_and_hmac_roundtrip():
    assert len(sha256_hex(b"tokeniq")) == 64
    signature = create_hmac_sha256(b"message", b"secret")
    assert verify_hmac_sha256(b"message", b"secret", signature)
    assert not verify_hmac_sha256(b"changed", b"secret", signature)


def test_aes_gcm_roundtrip_and_tamper_detection():
    key = b"k" * 32
    payload = encrypt_aes_gcm(b"private", key, b"header")
    assert decrypt_aes_gcm(payload, key, b"header") == b"private"
    payload["ciphertext"] = ("00" if payload["ciphertext"][:2] != "00" else "ff") + payload["ciphertext"][2:]
    with pytest.raises(Exception):
        decrypt_aes_gcm(payload, key, b"header")


def test_token_size_validation():
    assert len(generate_token()) > 20
    with pytest.raises(ValueError):
        generate_token(2)


def test_monthly_research_uses_30_candles():
    candles = []
    for i in range(45):
        close = 100 + i
        candles.append({"time": 1700000000 + i * 86400, "open": close - 1,
                        "high": close + 2, "low": close - 2, "close": close,
                        "volume": 1000 + i})
    result = analyze_monthly_candles(candles, "BTCUSDT")
    assert result["period"]["completed_daily_candles"] == 30
    assert result["summary"]["last_close"] > result["summary"]["first_close"]
    assert result["provider"] == "Binance Spot public API"


def test_monthly_research_rejects_insufficient_data():
    with pytest.raises(ValueError):
        analyze_monthly_candles([], "BTCUSDT")


def test_breakout_strategy_validates_config():
    with pytest.raises(ValueError):
        BreakoutRetestStrategy({"lookback": 1})
    strategy = BreakoutRetestStrategy({"lookback": 10})
    assert strategy.STRATEGY_ID == "breakout_retest"
