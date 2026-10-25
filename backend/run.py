"""Convenience runner script to start the Algo Boost X Trading System server."""

import argparse
import sys
from pathlib import Path
import uvicorn

# Ensure backend directory is in path
CURRENT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(CURRENT_DIR))


def main():
    parser = argparse.ArgumentParser(description="Start Algo Boost X Algorithmic Trading Server")
    parser.add_argument("--host", default="0.0.0.0", help="Binding host address (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="Binding port (default: 8000)")
    parser.add_argument("--reload", action="store_true", help="Enable automatic file reload for development")
    args = parser.parse_args()

    print("=" * 70)
    print("  Algo Boost X -- Algorithmic Trading System (Delta Testnet)")
    print(f"  Server URL:    http://localhost:{args.port}")
    print(f"  Dashboard UI:  http://localhost:{args.port}/")
    print(f"  Swagger Docs:  http://localhost:{args.port}/docs")
    print(f"  Health Check:  http://localhost:{args.port}/health")
    print("=" * 70)

    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info",
    )


if __name__ == "__main__":
    main()
