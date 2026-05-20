# Phase 8: Anti-Fraud, Trust & Safety

## Overview
Secure the NearLink marketplace against revenue leakage and service ghosting. This phase introduces automated customer verification loops, a dynamic trust scoring system, and proof-of-work requirements to ensure providers remain honest and the platform remains profitable.

## Tasks
- [x] **T801: Customer-Led Completion & Auto-Settlement**
  - Update `PATCH /api/bookings/{id}/status` to allow customers to mark a job as `completed`.
  - Implement "Force Completion" logic: if a customer confirms completion, commission is deducted regardless of provider action.
  - Create a "Follow-up Nudge" UI component that appears for customers when a job is past its scheduled time.

- [x] **T802: Provider Trust Score & Performance Penalties**
  - Add `trust_score` (Float, Default: 1.0) to the `Provider` model.
  - Implement logic to deduct Trust Score (e.g., -0.05) if a job is force-completed by the customer or if the provider is unresponsive.
  - Integrate `trust_score` into the `RankingAgent` as a primary sorting factor.

- [x] **T803: Proof-of-Work (Image/File Upload)**
  - Add `completion_image_url` and `completion_notes` to the `Booking` model.
  - Update the Provider Dashboard to require a photo upload (e.g., of the fixed appliance or a manual receipt) before the "Mark as Completed" button is enabled.
  - Implement a mock file upload endpoint `POST /api/bookings/{id}/upload-work`.

- [x] **T804: Safety & SOS Integration**
  - Add an "SOS / Emergency" button to the active Booking UI for both users.
  - Implement a simulated alert system that logs safety concerns to the `AgentTrace` and `Notifications` tables.

## Status: 100% Complete
