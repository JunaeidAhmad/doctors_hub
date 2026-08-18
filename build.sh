#!/usr/bin/env bash
# Exit on error
set -o errexit

# Navigate into doctors_hub_backend if executing from root
if [ -d "doctors_hub_backend" ]; then
  cd doctors_hub_backend
fi

# Install requirements
pip install --upgrade pip
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --no-input

# Apply database migrations
python manage.py migrate

# Seed database with base catalog and test admin accounts
python seed_full_database.py
