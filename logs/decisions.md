# Decisions Log — NearLink Mobile App Conversion
**Date:** 2026-05-19

---

## Decision 1: CSS-First Approach (No Page Rewrites)
**Options considered:**
- A) Rewrite each page with mobile-specific JSX
- B) Add className hooks + CSS media queries
- C) Use Tailwind responsive prefixes

**Chosen:** B — CSS hooks + media queries

**Reason:** Option A breaks the "no rewrite" constraint and introduces regression risk. Option C would require installing Tailwind and migrating all inline styles. Option B is surgical, reversible, and doesn't touch any logic.

---

## Decision 2: !important for Inline Style Overrides
**Problem:** Inline `style={{}}` props have higher specificity than CSS selectors.

**Solution:** CSS `!important` declarations beat inline styles per the CSS cascade spec (author !important > inline styles).

**Risk:** Over-use of `!important` can create specificity wars. Mitigated by scoping all `!important` rules inside `@media (max-width: 768px)` blocks.

---

## Decision 3: BottomNav Hidden by CSS, Not by JS
**Options:**
- A) Render conditionally with `window.innerWidth` check
- B) Always render, hide with `display: none` on desktop via CSS

**Chosen:** B

**Reason:** Server-side rendering in Next.js means `window` is unavailable on first render. CSS `display: none` is safe across SSR/CSR and requires no hydration mismatch handling.

---

## Decision 4: Keep Navbar on Mobile
**Options:**
- A) Remove Navbar on mobile, rely solely on BottomNav
- B) Keep both — Navbar for logo/branding, BottomNav for navigation

**Chosen:** B

**Reason:** The Navbar shows the NearLink logo and branding. Removing it entirely would lose visual identity. The hamburger in Navbar is already hidden when BottomNav is present (since `desktop-nav` is `display:none` on mobile). The existing mobile menu still handles edge cases like logout fallback.

---

## Decision 5: PWA Manifest over Native Build
**Chosen:** Document both PWA and native (TWA/Capacitor) paths. Default delivery = PWA.

**Reason:** PWA "Add to Home Screen" works immediately with zero extra tooling. TWA/Capacitor are documented for judges who want a real APK file.

---

## Decision 6: Hero Robot Hidden on Mobile
**Reason:** The 3D robot animation requires a 380px×380px canvas. On a 375px wide phone, it would overflow or crush the text. Hiding it keeps the hero clean and focused on the CTA. The text content alone communicates the value proposition effectively on mobile.

---

## Decision 7: 16px Input Font Size
**Reason:** iOS Safari automatically zooms the viewport when an input field with `font-size < 16px` receives focus. Setting `font-size: 16px !important` on `.input-field` prevents this zoom — a major UX friction point on mobile.
