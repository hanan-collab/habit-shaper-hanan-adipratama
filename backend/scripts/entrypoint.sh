#!/bin/sh
set -eu
npm run migrate:deploy --workspace backend
exec node backend/dist/server.js
