# Workplan — NearLink Mobile App Conversion
**Date:** 2026-05-19 | **Session:** Mobile-First Conversion

---

## Objective
Convert the existing Next.js web app into a mobile-app-ready version without breaking any existing business logic, backend, or AI agent pipeline.

## Phases

### Phase 1 — Audit (DONE)
- Read all 9 page files: layout, home, login, signup, dashboard, request, booking, followup, history, traces
- Read Navbar, AuthContext, api.js
- Identified all inline styles that need mobile overrides
- Assessed grid layouts, touch target sizes, overflow issues

### Phase 2 — Mobile CSS (DONE)
- Appended ~290 lines of mobile-first CSS to `globals.css`
- CSS variables: `--bottom-nav-height: 70px`, `--bottom-nav-safe`
- `!important` overrides for `.page-wrapper` padding (top 68px, bottom nav-safe)
- Hero grid collapse: `hero-grid` → single column on `max-width: 768px`
- Robot section hidden on mobile via `.hero-robot-section`
- CTA buttons: full-width column layout on mobile
- Stats cards: 2-column grid on mobile
- Quick actions: 3-column grid on mobile
- Booking action rows: vertical stack on mobile
- Touch targets: all buttons ≥ 52px, inputs 16px font (iOS zoom prevention)
- Safe area inset support for iPhone home indicator

### Phase 3 — BottomNav Component (DONE)
- Created `src/components/BottomNav.js`
- Shows only when user is logged in (`if (!user) return null`)
- Customer tabs: Home, Request, History, Alerts, Traces + Logout
- Provider tabs: Home, Profile, Traces + Logout
- Active tab detection via `usePathname`
- Framer Motion `layoutId` indicator bar
- Hidden on desktop via CSS `display: none`

### Phase 4 — Layout Updates (DONE)
- Added viewport meta, theme-color, apple-mobile-web-app meta, manifest link to `layout.js`
- Imported and rendered `<BottomNav />` inside `AuthProvider`

### Phase 5 — Page className Hooks (DONE)
- `page.js`: hero-grid, hero-robot-section, hero-cta-buttons, hero-stats-row, features-grid
- `dashboard/page.js`: stats-cards-grid, quick-actions-grid
- `booking/[id]/page.js`: booking-action-row, success-action-row
- `followup/page.js`: timeline-wrapper

### Phase 6 — PWA Manifest (DONE)
- Created `public/manifest.json` with shortcuts, icons, categories
- Enables Android TWA / Bubblewrap APK packaging

### Phase 7 — Documentation (DONE)
- README.md: added full Mobile App section with feature table, per-page table, 3 APK options
- All 8 log files updated

## Status: ✅ COMPLETE
