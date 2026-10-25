# ALGOboostX — Production Deployment & DevOps Guide

This guide details instructions for deploying the ALGOboostX full-stack platform (React + Vite Frontend, FastAPI Backend, SQLite DB, and Delta Exchange Testnet Live Engine) across containerized Docker environments, Cloud VPS, or PaaS providers.

---

## 🏗️ Architecture Overview

The platform consists of two services:
1. **Frontend:** React 18 + Vite SPA, compiled to static assets and served by Nginx on port `80` (or `3000` via Docker Compose).
2. **Backend:** FastAPI ASGI application running under Uvicorn on port `8000`, connecting to SQLite (`tokeniq.db`) with an autonomous trading loop.

---

## 🐳 Option 1: Docker Compose (Recommended)

### Prerequisites
- Docker Engine 24.0+
- Docker Compose v2.20+

### Steps
1. Clone the repository and configure your `.env`:
   ```bash
   cp .env.example .env
   ```
2. Build and run containers in detached mode:
   ```bash
   docker-compose up --build -d
   ```
3. Verify running containers:
   ```bash
   docker-compose ps
   ```
4. Access the applications:
   - **Trading Dashboard & Strategy Hub:** `http://localhost:3000`
   - **FastAPI OpenAPI Documentation:** `http://localhost:8000/docs`
   - **System Health Endpoint:** `http://localhost:8000/health`

5. View logs:
   ```bash
   docker-compose logs -f backend
   ```

---

## 🖥️ Option 2: Standalone Cloud VPS (Ubuntu 22.04 / Debian 12)

### 1. System Dependencies
```bash
sudo apt update && sudo apt install -y python3.11 python3.11-venv python3-pip nodejs npm nginx curl
```

### 2. Backend Setup with Systemd
```bash
cd /opt/algoboostx/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `/etc/systemd/system/algoboostx-backend.service`:
```ini
[Unit]
Description=ALGOboostX FastAPI Backend Engine
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/algoboostx/backend
ExecStart=/opt/algoboostx/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5
Environment=APP_ENV=production
Environment=USE_LIVE_TESTNET=false

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable algoboostx-backend
sudo systemctl start algoboostx-backend
```

### 3. Frontend Build & Nginx Host
```bash
cd /opt/algoboostx
npm install
npm run build
```

Configure `/etc/nginx/sites-available/algoboostx`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /opt/algoboostx/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/algoboostx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Security Best Practices Checklist

- [x] **No Secrets in Frontend:** The Vite build contains zero exchange secrets or private keys.
- [x] **Strict CORS:** Backend origins restricted to configured domains.
- [x] **Paper Trading by Default:** `USE_LIVE_TESTNET=false` prevents accidental real capital risk.
- [x] **Token Persistence:** Database-backed token tracking with revocation upon logout.
- [x] **Encrypted Credentials:** Exchange API keys stored using AES-256-GCM.
- [x] **Sanitized Logging:** Passwords and keys scrubbed before disk write.
