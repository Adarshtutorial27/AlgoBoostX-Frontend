"""Custom exception classes for Algo Boost X Algorithmic Trading System."""


class AlgoBoostXException(Exception):
    """Base exception for all Algo Boost X domain exceptions."""

    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


# Backward compatibility alias
TokenIQException = AlgoBoostXException


class ExchangeConnectionError(AlgoBoostXException):
    """Raised when communication with Delta Exchange fails or times out."""
    pass


class AuthenticationError(AlgoBoostXException):
    """Raised when API key or HMAC signature authentication fails."""
    pass


class StaleDataError(AlgoBoostXException):
    """Raised when market data timestamp exceeds MAX_DATA_AGE_SECONDS threshold."""
    pass


class RiskLimitExceeded(TokenIQException):
    """Raised when a trading signal breaches configured risk thresholds."""
    pass


class OrderExecutionError(TokenIQException):
    """Raised when order submission is rejected or returns an unexpected error."""
    pass


class OrderReconciliationRequired(TokenIQException):
    """Raised when order status is ambiguous (e.g. timeout) and requires reconciliation."""
    pass


class EmergencyStopActiveError(TokenIQException):
    """Raised when an action is rejected because emergency stop mode is active."""
    pass
