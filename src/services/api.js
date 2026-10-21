/**
 * Centralized API Service for Algo boostX
 * Designed for seamless integration with the backend developer's APIs.
 *
 * All requests read base URL from import.meta.env.VITE_API_BASE_URL
 * Defaults safely to demo mode if backend is unreachable or not yet deployed.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';

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
      const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    // Return structured error
    return {
      success: false,
      isDisconnected: true,
      error: err.name === 'AbortError' ? 'Backend connection timed out' : err.message,
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
        return {
          connected: !res.isDisconnected,
          url: API_BASE_URL,
          status: res.status || (res.isDisconnected ? 'offline' : 'online'),
        };
      } catch (err) {
        return { connected: false, url: API_BASE_URL, status: 'offline', error: err.message };
      }
    },
  },

  // 2. Authentication
  auth: {
    login: async (credentials) => {
      return await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },
    signup: async (userData) => {
      return await request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    logout: async () => {
      setAuthToken(null);
      return { success: true };
    },
    me: async () => {
      return await request('/auth/me');
    },
  },

  // 3. Markets & Instruments
  markets: {
    getInstruments: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return await request(`/markets/instruments${query ? `?${query}` : ''}`);
    },
    getTicker: async (symbol) => {
      return await request(`/markets/ticker/${encodeURIComponent(symbol)}`);
    },
    getCandles: async (symbol, timeframe = '15m', limit = 100) => {
      return await request(`/markets/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=${limit}`);
    },
    getOrderBook: async (symbol) => {
      return await request(`/markets/orderbook/${encodeURIComponent(symbol)}`);
    },
  },

  // 4. Portfolio
  portfolio: {
    getSummary: async () => {
      return await request('/portfolio/summary');
    },
    getPositions: async () => {
      return await request('/portfolio/positions');
    },
    getAllocation: async () => {
      return await request('/portfolio/allocation');
    },
    getPerformanceHistory: async (timeframe = '1M') => {
      return await request(`/portfolio/history?timeframe=${timeframe}`);
    },
  },

  // 5. AI Strategies
  strategies: {
    list: async () => {
      return await request('/strategies');
    },
    getById: async (id) => {
      return await request(`/strategies/${id}`);
    },
    create: async (strategyData) => {
      return await request('/strategies', {
        method: 'POST',
        body: JSON.stringify(strategyData),
      });
    },
    update: async (id, strategyData) => {
      return await request(`/strategies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(strategyData),
      });
    },
    toggleStatus: async (id, status) => {
      return await request(`/strategies/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    delete: async (id) => {
      return await request(`/strategies/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // 6. Backtesting Engine
  backtesting: {
    run: async (config) => {
      return await request('/backtest/run', {
        method: 'POST',
        body: JSON.stringify(config),
      });
    },
    getStatus: async (jobId) => {
      return await request(`/backtest/status/${jobId}`);
    },
    getResults: async (jobId) => {
      return await request(`/backtest/results/${jobId}`);
    },
  },

  // 7. Trading Orders
  orders: {
    create: async (orderPayload) => {
      return await request('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });
    },
    list: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return await request(`/orders${query ? `?${query}` : ''}`);
    },
    cancel: async (orderId) => {
      return await request(`/orders/${orderId}/cancel`, {
        method: 'POST',
      });
    },
    getHistory: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return await request(`/orders/history${query ? `?${query}` : ''}`);
    },
  },

  // 8. WebSocket Stream Manager
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
      ws.onclose = () => {
        // Disconnected
      };
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
