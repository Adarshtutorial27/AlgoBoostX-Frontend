/**
 * Centralized API Service for Algo boostX
 * Designed for seamless integration with the backend developer's APIs.
 *
 * All requests read base URL from import.meta.env.VITE_API_BASE_URL
 * Defaults safely to demo mode if backend is unreachable or not yet deployed.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

// In-memory token storage (never store sensitive secrets in code)
let authToken = localStorage.getItem('algoboostx_auth_token') || null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('algoboostx_auth_token', token);
  } else {
    localStorage.removeItem('algoboostx_auth_token');
  }
};

export const getAuthToken = () => authToken;

export const getApiBaseUrl = () => API_BASE_URL;

/**
 * Generic Fetch Wrapper with timeout and auth headers
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 8000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.detail || errorData.message || `HTTP error! status: ${response.status}`;
      return {
        success: false,
        status: response.status,
        isDisconnected: false,
        error: message,
        data: errorData,
      };
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    // Return structured error for network failure
    return {
      success: false,
      status: 0,
      isDisconnected: true,
      error: err.name === 'AbortError' ? 'Backend connection timed out' : (err.message || 'Network connection failed'),
    };
  }
}

/**
 * Centralized API Interface
 */
export const api = {
  // 1. Health & Connection Check
  health: {
    check: async () => {
      try {
        const res = await request('/health', { timeout: 3000 });
        const isConn = !res.isDisconnected && (res.status === 'healthy' || res.database_connected !== undefined);
        return {
          connected: isConn,
          url: API_BASE_URL,
          status: isConn ? 'online' : 'offline',
          data: res,
        };
      } catch (err) {
        return { connected: false, url: API_BASE_URL, status: 'offline', error: err.message };
      }
    },
  },

  // 2. Authentication
  auth: {
    login: async (credentials) => {
      const payload = {
        username: credentials.username || credentials.email || credentials.usernameOrEmail,
        password: credentials.password,
      };
      const res = await request('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res && res.access_token) {
        res.token = res.access_token;
      }
      return res;
    },
    signup: async (userData) => {
      const payload = {
        username: userData.username || userData.name || userData.email.split('@')[0],
        email: userData.email,
        password: userData.password,
      };
      const res = await request('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res && res.access_token) {
        res.token = res.access_token;
      }
      return res;
    },
    logout: async () => {
      await request('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
      setAuthToken(null);
      return { success: true };
    },
    me: async () => {
      return await request('/api/v1/auth/me');
    },
  },

  // 3. Broker / Exchange Accounts (Real Integrations)
  accounts: {
    list: async (userId = 'default_user') => {
      return await request(`/api/v1/accounts?user_id=${encodeURIComponent(userId)}`);
    },
    getStatus: async (userId = 'default_user') => {
      return await request(`/api/v1/accounts/status?user_id=${encodeURIComponent(userId)}`);
    },
    validate: async (credentials) => {
      return await request('/api/v1/accounts/validate', {
        method: 'POST',
        body: JSON.stringify({
          api_key: credentials.apiKey || credentials.api_key,
          api_secret: credentials.secretKey || credentials.api_secret,
          base_url: credentials.baseUrl || 'https://cdn-ind.testnet.deltaex.org',
        }),
      });
    },
    connect: async (data) => {
      return await request('/api/v1/accounts/connect', {
        method: 'POST',
        body: JSON.stringify({
          user_id: data.userId || 'default_user',
          label: data.label || 'Delta Exchange Testnet',
          environment: 'testnet',
          base_url: data.baseUrl || 'https://cdn-ind.testnet.deltaex.org',
          api_key: data.apiKey || data.api_key,
          api_secret: data.secretKey || data.api_secret,
          ip_whitelist_note: data.ipWhitelistNote || 'Connected via AlgoBoostX Platform',
        }),
      });
    },
    disconnect: async (accountId, userId = 'default_user') => {
      return await request(`/api/v1/accounts/${accountId}?user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
    },
    getBalance: async (accountId, userId = 'default_user') => {
      return await request(`/api/v1/accounts/${accountId}/balance?user_id=${encodeURIComponent(userId)}`);
    },
    getPositions: async (accountId, userId = 'default_user') => {
      return await request(`/api/v1/accounts/${accountId}/positions?user_id=${encodeURIComponent(userId)}`);
    },
    getOrders: async (accountId, userId = 'default_user') => {
      return await request(`/api/v1/accounts/${accountId}/orders?user_id=${encodeURIComponent(userId)}`);
    },
  },

  // 4. Markets & Instruments
  markets: {
    getInstruments: async () => {
      return await request('/api/v1/exchange/products');
    },
    getTicker: async (symbol = 'BTCUSD') => {
      return await request(`/api/market/ticker?symbol=${encodeURIComponent(symbol)}`);
    },
    getCandles: async (symbol = 'BTCUSD', timeframe = '5m', limit = 50) => {
      return await request(`/api/market/candles?symbol=${encodeURIComponent(symbol)}&resolution=${timeframe}&limit=${limit}`);
    },
  },

  // 5. Portfolio & Actual Account Stats
  portfolio: {
    getSummary: async () => {
      return await request('/api/v1/portfolio/summary');
    },
    getPositions: async () => {
      return await request('/api/v1/positions');
    },
    getTrades: async (limit = 50) => {
      return await request(`/api/v1/trades?limit=${limit}`);
    },
    getPerformance: async () => {
      return await request('/api/v1/trades/performance');
    },
  },

  // 6. AI Strategies
  strategies: {
    list: async () => {
      return await request('/api/v1/strategies');
    },
    getById: async (id) => {
      return await request(`/api/v1/strategies/${id}`);
    },
    start: async (id) => {
      return await request(`/api/v1/strategies/${id}/start`, { method: 'POST' });
    },
    stop: async (id) => {
      return await request(`/api/v1/strategies/${id}/stop`, { method: 'POST' });
    },
    updateConfig: async (id, config) => {
      return await request(`/api/v1/strategies/${id}/config`, {
        method: 'PUT',
        body: JSON.stringify(config),
      });
    },
    backtest: async (id, config) => {
      return await request(`/api/v1/strategies/${id}/backtest`, {
        method: 'POST',
        body: JSON.stringify(config),
      });
    },
  },

  // 7. Orders & History
  orders: {
    list: async (limit = 20) => {
      return await request(`/api/v1/orders?limit=${limit}`);
    },
  },

  // 8. Risk Management Controls
  risk: {
    getStatus: async () => {
      return await request('/api/v1/risk/status');
    },
    killSwitch: async (reason = 'Operator manual kill-switch activated') => {
      return await request('/api/v1/risk/kill-switch', {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    resetEmergency: async () => {
      return await request('/api/v1/risk/reset-emergency', { method: 'POST' });
    },
  },

  // 9. WebSocket Stream Manager
  createWebSocketConnection: (channel = 'ticker', onMessage, onError) => {
    let ws = null;
    try {
      ws = new WebSocket(`${WS_BASE_URL}?channel=${channel}`);
      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onMessage && onMessage(parsed);
        } catch {
          onMessage && onMessage(event.data);
        }
      };
      ws.onerror = (err) => {
        onError && onError(err);
      };
      ws.onclose = () => {};
    } catch (err) {
      onError && onError(err);
    }
    return {
      close: () => ws && ws.close(),
      send: (data) => ws && ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify(data)),
    };
  },
};

export default api;
