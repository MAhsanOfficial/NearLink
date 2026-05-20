# Phase 7: Financial Integrity & Real-time Negotiation

## Overview
Elevate the NearLink marketplace by introducing a sustainable financial model and real-time communication. This phase implements a provider wallet system for commission management and a negotiation-focused chat interface to finalize service prices.

## Tasks
- [x] **T701: Provider Digital Wallet & Commission Logic**
  - Add `wallet_balance` to the `Provider` model.
  - Add `final_price` and `commission_amount` to the `Booking` model.
  - Implement backend logic to deduct a percentage-based commission (e.g., 10%) automatically when a booking is marked as `completed`.
  - Enforce a "Minimum Balance" rule: Providers cannot accept (`pickup`) new jobs if their wallet balance is below 0.

- [x] **T702: Real-time Communication & Negotiation**
  - Create a `Message` model to store chat history and price offers.
  - Implement `POST /api/chat/send` and `GET /api/chat/{booking_id}` endpoints.
  - Implement a "Price Offer" system where providers can propose a final price and customers can accept it within the chat.
  - Add "Call Now" functionality using `tel:` links for direct voice communication.

- [x] **T703: Financial & Chat UI**
  - Build a "Wallet Dashboard" for providers showing current balance and transaction history (commission deductions).
  - Create a responsive Chat UI integrated into the Booking status page for both Users and Providers.
  - Implement real-time polling or status indicators for new messages and price updates.

- [x] **T704: System Integration & Validation**
  - Update the `RankingAgent` to optionally mention provider "Verified Wallet" status.
  - Perform end-to-end testing: Negotiate price -> Complete job -> Verify wallet deduction.
  - Create a seed script for "Pre-funded" test wallets.

- [x] **T705: AI-Verified Negotiation Flow**
  - Implement `NegotiationAgent` to analyze chat history and verify the "Closed Deal" amount.
  - Update `PATCH /api/bookings/{id}/status` to trigger AI verification when moving to `in_progress`.
  - Prevent job pickup if the provider's manually entered amount contradicts the chat history.

- [x] **T706: Enhanced Financial Enforcement**
  - Add "Starter Balance" (e.g., Rs. 500) for new providers upon registration to encourage initial usage.
  - Refine error messages in the UI when a provider has insufficient balance to pick up a job.
  - Update the "Mark as Completed" flow to ensure commission deduction happens *before* the rating is allowed.

## Status: 100% Complete
