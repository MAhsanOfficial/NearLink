# Fallback & Recovery Log: Fault-Tolerance Mechanics

This document explains the recovery policies built into NearLink to ensure continuous operations under network failures, API rate-limits, or LLM issues.

## 🛡️ Resilience Matrix

| Failure Point | Impact | Recovery Policy |
| :--- | :--- | :--- |
| **Nominatim/OSM Timeout** | Cannot resolve coordinates from string | Fall back to local city coordinate matches parsed from Roman Urdu (e.g. "Karachi" $\rightarrow$ `24.8607`, `67.0011`). |
| **Google Places Quota Limit** | External search crashes | Fall back to Overpass OpenStreetMap (OSM) public servers to query physical plumbing/electrician nodes. |
| **Gemini LLM Outage** | Provider ranking crashes | Fall back to standard mathematical ranking (`fallback_ranking` inside `ranking_agent.py`) sorting exclusively by proximity and ratings. |
| **Integrations NameError** | Entire live search engine crashes | Added robust standard library imports (`os`, `datetime`) to prevent backend script crashes. |
| **Complex ID Mismatches** | Providers dropped in output | Simplified token representation (`prov_1`, `prov_2`) ensures Gemini returns parseable IDs without losing elements. |
| **Database Disconnections** | Server fails to fetch | Automatic transaction rollbacks (`await db.rollback()`) to restore db integrity and log detailed errors. |
