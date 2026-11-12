#!/usr/bin/env bash
set -e

# Explainable Deep Learning NIDS (CICIDS2017)
# Starts FastAPI server hosting both the REST API and the React production build

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

PORT="${PORT:-8000}"

echo "=========================================================="
echo " Starting Explainable Deep Learning NIDS (CICIDS2017)"
echo " Binary Classification: BENIGN = 0, ATTACK = 1"
echo " Models: Scikit-Learn Baseline + PyTorch ANN + SHAP"
echo "=========================================================="
echo ""
echo "Access the Web Interface at:"
echo "  ➜ http://localhost:${PORT}"
echo ""
echo "API Docs available at:"
echo "  ➜ http://localhost:${PORT}/docs"
echo ""

export PYTHONPATH=.
export MPLCONFIGDIR=/tmp/matplotlib

exec ./venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port "${PORT}"
