# Phase 7 Implementation Strategy: Financials & Chat

## 1. Data Schema Updates
### Provider Model
- `wallet_balance`: Float (Default: 0.0)
- `commission_rate`: Float (Default: 0.10 for 10%)

### Booking Model
- `final_price`: Float (The agreed-upon price after negotiation)
- `commission_amount`: Float (Calculated at completion)
- `is_paid`: Boolean (Internal check for commission settlement)

### Message Model (New)
- `id`: UUID
- `booking_id`: FK(bookings)
- `sender_id`: FK(users)
- `content`: Text
- `message_type`: String ("text" | "offer")
- `offer_amount`: Float (Optional)
- `is_accepted`: Boolean (For offer types)
- `created_at`: DateTime

## 2. Wallet & Commission Workflow
1. **Top-up**: For the hackathon, we will simulate a "Top-up" button that adds mock credits to the provider's wallet.
2. **Acceptance Check**: When a provider hits "Pickup Job", the backend verifies `wallet_balance > 0`.
3. **Completion**: When status changes to `completed`:
   - `commission = final_price * commission_rate`
   - `provider.wallet_balance -= commission`
   - `booking.commission_amount = commission`
   - `booking.is_paid = True`

## 3. Negotiation UI
- A message bubble system (similar to WhatsApp).
- If `message_type == "offer"`, show a special card with "Accept" or "Decline" buttons for the customer.
- Accepting an offer automatically updates `Booking.final_price`.

## 4. Direct Communication
- Integrated "Phone" icon next to the provider/customer name.
- Standard HTML5 `href="tel:+92..."` implementation for mobile compatibility.
