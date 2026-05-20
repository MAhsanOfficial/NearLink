# Phase 8 Implementation Strategy: Anti-Fraud & Trust

## 1. Data Schema Updates
### Provider Model
- `trust_score`: Float (Default: 1.0, Range: 0.0 - 1.0)
- `auto_complete_count`: Integer (Tracking how many times the system had to force complete)

### Booking Model
- `completion_image_url`: String (Path to uploaded proof)
- `force_completed`: Boolean (True if completed by customer/system nudge)
- `safety_alert_triggered`: Boolean (For SOS feature)

## 2. Force Completion Workflow
1. **The Nudge**: A background process (simulated via frontend check) identifies bookings where `status == 'in_progress'` and `scheduled_time` is > 4 hours ago.
2. **Customer Action**: Customer sees a "Did Zahid finish the work?" button.
3. **Settlement**: If Customer clicks "Yes":
   - Update `Booking.status = 'completed'`
   - Update `Booking.force_completed = True`
   - Calculate and deduct commission from `Provider.wallet_balance`.
   - **Penalty**: `Provider.trust_score -= 0.05`.

## 3. Proof-of-Work (T803)
- The "Mark as Completed" button on the Provider Dashboard will be `disabled` until a file is selected.
- For the prototype, `POST /api/bookings/{id}/upload-work` will accept a form-data file and return a mock URL.

## 4. Ranking Impact
- `RankingAgent` prompt will be updated to: *"Heavily penalize providers with a trust_score below 0.8. Mention high trust scores as 'Reliable Partner' in reasoning."*

## 5. Safety (SOS)
- A prominent red "SOS" button on the `/booking/[id]` page.
- Triggers a `POST /api/bookings/{id}/sos` which:
  - Creates a high-priority `Notification` for admins.
  - Logs a special `AgentTrace` with location and user details.
