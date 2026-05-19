# Task Plan Log: Execution Breakdown

This document outlines the detailed list of actionable technical tasks executed during the hackathon development cycles.

## 📋 Task Matrix

| Task ID | Task Category | Description | Status | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **TSK-01** | Database | Implement dual-role JWT Authentication (Customer vs. Provider) | `Done` | High |
| **TSK-02** | Geolocation | Build Nominatim OpenStreetMap fallback geocoder for queries | `Done` | High |
| **TSK-03** | Live Fetching | Integrate Google Places API with Place Details for phone numbers | `Done` | High |
| **TSK-04** | LLM Parsing | Standardize Intent Parsing to extract localized Urdu terms | `Done` | High |
| **TSK-05** | UI Rebrand | Rewrite QuickFix UI styling elements to modern "NearLink" theme | `Done` | Medium |
| **TSK-06** | Integration | Prevent foreign key relational crashes when booking external map shops | `Done` | High |
| **TSK-07** | Optimization | Resolve `os` and `datetime` runtime NameErrors in search backend | `Done` | Critical |
| **TSK-08** | LLM Safety | Map long place ID strings to `prov_1`/`prov_2` keys to avoid Gemini ranking typos | `Done` | High |

## ⚙️ Detail Specification for TSK-08 (Gemini Typo Mitigation)
- **Problem**: When passing 27-character Google `place_id` strings (e.g., `ChIJs_QxW9c-z0cR0H92aMpyTmg`) to the Gemini-based `RankingAgent`, the model occasionally returned misspelled IDs or minor casing changes in JSON.
- **Solution**: Before feeding the provider array to the Gemini prompt, we map each provider to a simplified index key: `prov_{i+1}`. We save the mapping in an in-memory dictionary. Once Gemini outputs the ranked index keys, we automatically map them back to their original `place_id` values. This ensures absolute stability and prevents any provider from being dropped due to a string typo.
