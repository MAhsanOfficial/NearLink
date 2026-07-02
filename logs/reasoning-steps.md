# Reasoning Steps — NearLink Mobile App Conversion
**Date:** 2026-05-19

---

## Step 1: Audit Strategy
**Question:** How do we make a Next.js app mobile-ready without rewriting it?
**Answer:** Read every file first. Identify only what stops it from being a great mobile experience. Change only that.

## Step 2: Identifying the Core Issues

After reading all 9 page files and 2 components:

1. **No bottom navigation** — The top navbar hamburger is hard to use on mobile. Real mobile apps have bottom tabs.
2. **Inline styles block CSS** — Most padding/grid values are inline `style={}` props. CSS media queries won't override them by default. Solution: use `!important` (CSS spec allows it to override inline styles) AND add className hooks where needed.
3. **Two-column hero grid** — `gridTemplateColumns: '1fr 1fr'` with inline style = invisible to CSS. Need `className="hero-grid"` so CSS can target it.
4. **No viewport meta** — Without `maximum-scale=1, viewport-fit=cover`, mobile browsers will zoom on input focus and won't fill the safe area.
5. **No PWA manifest** — Without a manifest, Android "Add to Home Screen" doesn't work and TWA/APK packaging isn't possible.
6. **Input font size** — Inputs at `font-size: 15px` cause iOS to zoom in on focus. Must be ≥ 16px.
7. **Glass card hover** — `whileHover={{ y: -4 }}` on cards creates a "sticky hover" effect on touch screens where the card stays lifted. Should disable on mobile.
8. **Bottom padding** — All pages have inline `padding: '100px 20px 60px'`. With a fixed 70px bottom nav, the last content item hides behind the nav bar.

## Step 3: Architecture Decision — CSS-First, Surgery Minimal

**Decision:** Do NOT rewrite pages. Instead:
1. Add CSS class names only where inline styles block the needed behavior
2. All responsive behavior lives in `globals.css` mobile section
3. Single new component: `BottomNav.js`
4. Single layout update: `layout.js` (meta + BottomNav)

This respects the "no business logic changes" constraint and minimizes regression risk.

## Step 4: !important Validity
`!important` in author stylesheets overrides inline styles per the CSS cascade specification (CSS2.1 §6.4.1). Verified: `padding-top: 68px !important` will override `style={{ padding: '100px 20px 60px' }}`.

## Step 5: Bottom Nav Design
- Only shown when `user` is truthy (logged in) — no nav for unauthenticated visitors
- Separate link sets for customer vs. provider role
- `layoutId` on the active indicator creates smooth Framer Motion shared layout animation between tabs
- `display: none` on desktop — zero impact on desktop experience
- `-webkit-tap-highlight-color: transparent` removes the blue flash on tap

## Step 6: PWA → APK Path
- `manifest.json` with `display: standalone` = full-screen app shell
- `viewport-fit=cover` + `env(safe-area-inset-bottom)` = proper iPhone X+ support
- Android TWA via Bubblewrap reads the manifest directly — no code changes needed
- Capacitor is also documented as an alternative for full native bridge access
