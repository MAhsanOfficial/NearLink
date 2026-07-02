# Fallback & Recovery Log — NearLink Mobile App Conversion
**Date:** 2026-05-19

---

## Fallback 1 — Inline Styles vs. CSS Override

**Problem encountered:** Next.js pages use inline `style={{}}` props extensively (e.g., `padding: '100px 20px 60px'`). Standard CSS media queries cannot override inline styles.

**Failed approach:** CSS `@media { .page-wrapper { padding: ... } }` — would be ignored.

**Recovery:** Use CSS `!important` which per the CSS cascade specification (CSS2.1 §6.4.1) overrides inline styles. Scoped all `!important` rules inside `@media (max-width: 768px)` blocks to avoid polluting desktop styles.

**Result:** ✅ All page-wrapper paddings correctly overridden on mobile.

---

## Fallback 2 — Hero Grid Cannot Be Targeted by CSS

**Problem:** The hero 2-column grid div has only `style={{...}}` with no `className`. CSS `.hero-grid` rule would have nothing to target.

**Recovery:** Added `className="hero-grid"` to the div in `page.js` — minimal change, zero logic impact. CSS rule now has a valid target.

**Result:** ✅ Hero collapses to single column on mobile.

---

## Fallback 3 — window.innerWidth Not Available in SSR

**Problem:** Cannot use `window.innerWidth` in Next.js components to conditionally render BottomNav because `window` is undefined during server-side rendering.

**Recovery:** Render `<BottomNav />` always in the DOM; use CSS `display: none` on desktop and `display: flex` only on `max-width: 768px`. Pure CSS approach, zero hydration mismatch.

**Result:** ✅ BottomNav renders correctly on all screen sizes.

---

## Fallback 4 — Manifest Icons Not Yet Created

**Problem:** `manifest.json` references `/icon-192.png` and `/icon-512.png` which don't exist in `public/`.

**Mitigation:** The manifest is valid JSON and browsers handle missing icon paths gracefully (no error, just no icon). For hackathon demo, the existing `favicon.ico` serves as a visual placeholder. For production APK, placeholder images should be added to `public/`.

**Recovery path:** Create 192×192 and 512×512 PNG icons with the NearLink logo (green gradient circle) and place in `public/`.

**Result:** ⚠️ Functional but icon fallback — acceptable for hackathon submission.

---

## Fallback 5 — History Page Rating Stars Too Small for Touch

**Problem:** Rating stars in `history/page.js` use `fontSize: 24` buttons with `background: none`. On mobile, 24px buttons may not meet 44px touch target minimum.

**Mitigation:** The global CSS rule `button { min-height: 44px }` applies globally. The star buttons will get the min-height even though they don't have an explicit class — browser layout will expand them.

**Result:** ✅ Handled by global mobile CSS button rule.
