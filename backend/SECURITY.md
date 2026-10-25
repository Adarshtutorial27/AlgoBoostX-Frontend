# Security Policy — Algo Boost X

Algo Boost X is engineered with security and risk controls as first-class architectural constraints.

---

## 1. Non-Negotiable Safety Policies

1. **Testnet-Only Policy**:
   - The platform is strictly configured to interact with **Delta Exchange Testnet**.
   - Connecting to Delta Exchange Mainnet (`api.delta.exchange`) is rejected at schema and API validation layers.
2. **Trading Disabled by Default**:
   - The automated trading loop remains inactive upon startup. Order dispatch requires explicit operator enablement.
3. **No Secret Leakage**:
   - API keys and secrets are encrypted at rest using **Fernet AES-128-CBC** in the SQLite database.
   - API secrets are never returned in JSON API responses, never logged to stdout or files, and never displayed in browser storage.
   - API keys are masked (`api_...XXXX`) for display purposes.
4. **No Arbitrary Code Execution**:
   - Strategy plugins must be implemented as Python modules adhering to `BaseStrategy`. The system does not allow runtime upload or eval of arbitrary code.
5. **No Blind Retries**:
   - When an order request times out or receives an ambiguous response, it is flagged as `RECONCILING` and queried against the exchange before any retry.

---

## 2. IP Whitelisting Requirement

Delta Exchange enforces IP whitelisting on API credentials. 

> [!IMPORTANT]
> IP whitelisting must be configured directly within the official Delta Exchange portal when generating your API keys. Algo Boost X signs requests via HMAC-SHA256 but cannot modify exchange firewall access controls.

---

## 3. Reporting a Vulnerability

If you discover any security vulnerability within Algo Boost X, please report it privately to the maintainers rather than opening a public issue.
