"""Account Exchange Client Manager for TokenIQ.

Provides multi-account isolation by resolving the appropriate DeltaExchangeClient
for the active connected user account or falling back cleanly to the environment default.
"""

from typing import Tuple, Optional
from sqlalchemy.orm import Session
from app.exchange.client import DeltaExchangeClient, exchange_client
from app.models.account import AccountConnection
from app.core.logger import logger


def get_active_account(db: Session, user_id: str = "default_user") -> Optional[AccountConnection]:
    """Retrieves the currently selected active account for a user."""
    return db.query(AccountConnection).filter(
        AccountConnection.user_id == user_id,
        AccountConnection.is_active == True
    ).first()


def get_client_for_account(
    db: Session,
    user_id: str = "default_user"
) -> Tuple[DeltaExchangeClient, Optional[AccountConnection]]:
    """Resolves the DeltaExchangeClient instance for the user's active connected account.

    Returns: (client, active_account_model_or_none)
    """
    account = get_active_account(db, user_id)
    if account:
        try:
            client = DeltaExchangeClient.from_account_connection(account)
            return client, account
        except Exception as e:
            logger.error(f"Failed to decrypt credentials for account {account.account_id}: {e}")
            return exchange_client, account

    # Fallback to environment-configured client
    return exchange_client, None


def activate_account(db: Session, account_id: str, user_id: str = "default_user") -> Optional[AccountConnection]:
    """Sets the designated account as the sole active account for the user."""
    target = db.query(AccountConnection).filter(
        AccountConnection.account_id == account_id,
        AccountConnection.user_id == user_id
    ).first()

    if not target:
        return None

    # Deactivate all others for this user
    db.query(AccountConnection).filter(AccountConnection.user_id == user_id).update({"is_active": False})
    target.is_active = True
    db.commit()
    db.refresh(target)
    logger.info(f"Account {target.account_id} ({target.label}) activated for user {user_id}")
    return target
