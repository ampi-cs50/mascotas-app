#!/usr/bin/env bash
# ====================================================================
# Script de Puesta en Marcha: App de Cuidado Preventivo para Mascotas
# ====================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "🐾 Iniciando App de Cuidado Preventivo para Mascotas..."

# 1. Verificar y levantar PostgreSQL si no está activo
PG_ISREADY="/Applications/Postgres.app/Contents/Versions/18/bin/pg_isready"
PG_PSQL="/Applications/Postgres.app/Contents/Versions/18/bin/psql"
PG_DATA="/Users/ampi/Library/Application Support/Postgres/var-18"

if [ -f "$PG_ISREADY" ]; then
    if ! "$PG_ISREADY" -h localhost -p 5432 >/dev/null 2>&1; then
        echo "🐘 Iniciando PostgreSQL..."
        open -a Postgres || true
        sleep 2
    fi
    echo "✅ Base de datos PostgreSQL activa en localhost:5432 (mascotas_db)"
fi

# 2. Iniciar Backend (Node/Express + TypeScript) en puerto 3000
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Backend ya está activo en http://localhost:3000"
else
    echo "🚀 Iniciando Backend..."
    (cd backend && npm run dev) &
    sleep 2
fi

# 3. Iniciar Frontend (Angular 21 Standalone) en puerto 4200
if lsof -Pi :4200 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Frontend ya está activo en http://localhost:4200"
else
    echo "🚀 Iniciando Frontend..."
    (cd frontend && npm start -- --port 4200 --host 0.0.0.0)
fi
