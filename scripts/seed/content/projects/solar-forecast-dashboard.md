Built as an interview project for the Power Forecasting Group at the Arizona Institute for Resilience.

## What it does

Pulls hourly weather for configured Arizona locations, stores it in MySQL, and retrains an XGBoost model every morning against the growing historical record. Serves 24-hour forecasts via a JSON API and a lightweight Chart.js dashboard. Containerized with Docker and deployed to a VPS via Dokploy.

## What I learned

- **Alpine vs Debian base images matter for ML workloads.** XGBoost wouldn't build cleanly on Alpine's musl libc; switching to the Debian slim image fixed it.
- **JSON serialization breaks on `NaN` silently.** I wrote a recursive `_sanitize()` helper that walks the response dict and replaces non-finite floats before `jsonify`.
- **APScheduler + gunicorn workers** need a single-worker lock, or the scheduler fires N times. I used a file lock for the daily retrain job.

## Stack

Flask, MySQL, APScheduler, XGBoost, Open-Meteo API, Chart.js, Docker, Dokploy.
