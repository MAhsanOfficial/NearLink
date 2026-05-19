# Phase 2: Core AI Agent Orchestration

## Overview
Develop the brain of NearLink: a multi-agent system that parses user intent, searches for local providers across multiple sources, and ranks them intelligently.

## Tasks
- [x] **T201: Intent Agent**
  - Implement language detection and parsing for Urdu, Roman Urdu, and English.
  - Extract service type, location, time, and urgency from raw text.
  - Integrate with Google Gemini API.
- [x] **T202: Local Discovery Agents**
  - **OSM Search Agent:** Implement discovery logic using OpenStreetMap data for local shops and services.
  - **Google Places Agent:** Integrate Google Places API for real-world, high-fidelity provider data.
- [x] **T203: Ranking & Selection Agent**
  - Implement logic to rank providers based on distance (haversine formula), ratings, and data trust scores.
  - Handle merging of internal and external provider data.
- [x] **T204: Unified Search API**
  - Create the `unified-search` endpoint that orchestrates the Intent, Discovery, and Ranking agents.
  - Implement fallback mechanisms for when primary data sources are unavailable.

## Status: 100% Complete
