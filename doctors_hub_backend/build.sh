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

# Seed database with base catalog and test admin accounts
python seed_full_database.py
