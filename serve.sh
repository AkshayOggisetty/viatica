#!/usr/bin/env bash
# Serve Viatica on http://localhost:8080  (override the port with: ./serve.sh 3000)
cd "$(dirname "$0")"
exec node server.mjs "${1:-8080}"
