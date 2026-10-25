"""Unit tests for Delta Exchange HMAC-SHA256 authentication."""
import pytest
import hmac
import hashlib
from unittest.mock import patch, AsyncMock
from app.exchange.auth import generate_delta_signature, build_auth_headers, format_compact_payload


def test_compact_payload_none():
    assert format_compact_payload(None) == ""
    assert format_compact_payload({}) == ""


def test_compact_payload_dict():
    result = format_compact_payload({"side": "buy", "size": 0.05})
    assert '"side":"buy"' in result
    assert " " not in result.replace('"side":"buy"', '').replace('"size":0.05', '')


def test_signature_deterministic():
    sig1 = generate_delta_signature("mysecret", "GET", "/v2/products", "1700000000")
    sig2 = generate_delta_signature("mysecret", "GET", "/v2/products", "1700000000")
    assert sig1 == sig2
    assert len(sig1) == 64  # SHA256 hex digest


def test_signature_correct_hmac():
    secret = "testsecret"
    method = "GET"
    path = "/v2/wallet/balances"
    ts = "1700000000"
    message = f"{method}{ts}{path}"
    expected = hmac.new(
        secret.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    result = generate_delta_signature(secret, method, path, ts)
    assert result == expected


def test_signature_includes_query_string():
    sig_with = generate_delta_signature("secret", "GET", "/v2/orders", "1700000000", "state=open")
    sig_without = generate_delta_signature("secret", "GET", "/v2/orders", "1700000000")
    assert sig_with != sig_without


def test_signature_includes_body():
    body = {"product_id": 1, "size": 0.05, "side": "buy"}
    sig_with = generate_delta_signature("secret", "POST", "/v2/orders", "1700000000", payload=body)
    sig_without = generate_delta_signature("secret", "POST", "/v2/orders", "1700000000")
    assert sig_with != sig_without


def test_auth_headers_structure():
    headers = build_auth_headers("myapikey", "mysecret", "GET", "/v2/wallet/balances")
    assert "api-key" in headers
    assert headers["api-key"] == "myapikey"
    assert "timestamp" in headers
    assert "signature" in headers
    assert len(headers["signature"]) == 64
    assert "Content-Type" in headers
    assert "mysecret" not in str(headers)  # secret never in headers


def test_auth_headers_no_secret_leak():
    headers = build_auth_headers("key123", "supersecret456", "POST", "/v2/orders", payload={"size": 1})
    headers_str = str(headers)
    assert "supersecret456" not in headers_str


@pytest.mark.asyncio
async def test_validate_credentials_success_mock():
    """Mocked: successful credential validation against Delta Exchange."""
    from app.exchange.client import DeltaExchangeClient
    client = DeltaExchangeClient(api_key="validkey", api_secret="validsecret", use_live=True)
    with patch.object(client, '_send_request', new_callable=AsyncMock) as mock_req:
        mock_req.return_value = {"success": True, "result": [{"asset_symbol": "USDT", "balance": "1000"}]}
        is_valid, msg, details = await client.validate_credentials()
        assert is_valid is True
        assert "successful" in msg.lower()
        assert details.get("balances_count") == 1


@pytest.mark.asyncio
async def test_validate_credentials_auth_failure_mock():
    """Mocked: 401 authentication failure returns False, not an unhandled exception."""
    from app.exchange.client import DeltaExchangeClient
    from app.core.exceptions import AuthenticationError
    client = DeltaExchangeClient(api_key="badkey", api_secret="badsecret", use_live=True)
    with patch.object(client, '_send_request', new_callable=AsyncMock) as mock_req:
        mock_req.side_effect = AuthenticationError("Invalid credentials")
        is_valid, msg, details = await client.validate_credentials()
        assert is_valid is False
        assert "authentication failed" in msg.lower()


@pytest.mark.asyncio
async def test_validate_credentials_network_error_mock():
    """Mocked: network error returns False with clear connection failure message."""
    from app.exchange.client import DeltaExchangeClient
    from app.core.exceptions import ExchangeConnectionError
    client = DeltaExchangeClient(api_key="key", api_secret="secret", use_live=True)
    with patch.object(client, '_send_request', new_callable=AsyncMock) as mock_req:
        mock_req.side_effect = ExchangeConnectionError("Connection refused")
        is_valid, msg, details = await client.validate_credentials()
        assert is_valid is False
        assert "connection" in msg.lower()


@pytest.mark.asyncio
async def test_public_connectivity_mock():
    """Mocked: public connectivity check passes on successful response."""
    from app.exchange.client import DeltaExchangeClient
    client = DeltaExchangeClient(use_live=True)
    with patch.object(client, '_send_request', new_callable=AsyncMock) as mock_req:
        mock_req.return_value = {"success": True, "result": []}
        result = await client.ping_public_connectivity()
        assert result is True
