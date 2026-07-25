#!/usr/bin/env bash
# exit on error
set -o errexit

if [ -d "doctors_hub_backend" ]; then
  cd doctors_hub_backend
fi

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
