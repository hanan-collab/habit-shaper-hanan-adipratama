#!/bin/sh
set -eu
npm run migrate:deploy --workspace backend
if [ "${SEED_DEMO_DATA:-true}" = "true" ]; then
  npm run seed --workspace backend
fi
exec node backend/dist/server.js
