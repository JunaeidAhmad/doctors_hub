#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install requirements
pip install --upgrade pip
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --no-input

# Apply database migrations
python manage.py migrate

# Seed database if explicitly requested
if [ "${SEED_ON_BUILD}" = "true" ] || [ "${SEED_ON_BUILD}" = "1" ]; then
  python seed_full_database.py
fi

