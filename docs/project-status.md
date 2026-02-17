# GTM Demo Project - Status Audit

Last updated: 2026-02-17

---

## 1. Pages That Exist

| File | Purpose | GTM Snippet | Consent Default | JS Files Loaded |
|------|---------|-------------|-----------------|-----------------|
| `index.html` | Homepage, introduces GTM concepts | YES (GTM-WNS3P8L9) | YES (all denied) | dataLayer.js, consent.js, debug.js, main.js |
| `about.html` | Explains GTM key concepts (educational content) | YES | YES | dataLayer.js, consent.js, debug.js, main.js |
| `products.html` | 8 demo products, "Add to Basket" buttons, ecommerce tracking | YES | YES | dataLayer.js, consent.js, debug.js, basket.js, main.js, products.js |
| `contact.html` | Contact form for form-submission tracking practice | YES | YES | dataLayer.js, consent.js, debug.js, main.js + inline script |
| `privacy.html` | Privacy policy, documents Consent Mode concepts | YES | YES | dataLayer.js, consent.js, debug.js, main.js |
| `basket.html` | Shopping basket, checkout flow, purchase event | YES | YES | dataLayer.js, consent.js, debug.js, basket.js, main.js, basket-page.js |

Pages listed in CLAUDE.md that are present: index, about, products, contact, privacy - all present.
Extra page added beyond CLAUDE.md spec: `basket.html`.

---

## 2. GTM Container

- Container ID: `GTM-WNS3P8L9`
- Installed on every HTML page using the standard two-part pattern:
  - Script tag in `<head>` (async loader)
  - Noscript `<iframe>` as the first element inside `<body>`
- The consent default is always set in an inline `<script>` that appears BEFORE the GTM script tag. This is correct per Google Consent Mode v2 requirements.

---

## 3. Consent Mode Implementation

### Default State (set inline in every HTML page head)

All seven consent types are declared before GTM loads:

```javascript
gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'functionality_storage': 'denied',
    'personalization_storage': 'denied',
    'security_storage': 'granted',
    'wait_for_update': 500
});
```

### Consent Banner (`js/consent.js`)

Fully implemented. Features include:

- Reads localStorage key `gtm_consent_preferences` on page load
- If a saved preference exists, applies it immediately via `gtag('consent', 'update', {...})`
- If no saved preference exists, renders a consent banner dynamically into the DOM
- Banner has three buttons:
  - "Accept All" - grants all six non-security types
  - "Reject All" - denies all six non-security types
  - "Manage Preferences" - expands a panel with four toggle switches (analytics, advertising, functionality, personalization)
- "Cookie Settings" button (fixed bottom-left) is always rendered so users can change their choice later
- On every consent action, pushes `consent_updated` event to `window.dataLayer`
- Exposes `window.consentDebug` object for manual testing in the browser console

### Consent Update Push

Every time consent changes, `applyConsent()` calls both:
1. `gtag('consent', 'update', {...})` - the official Consent Mode v2 signal
2. `window.dataLayer.push({ event: 'consent_updated', consent_preferences: {...} })` - a custom event GTM can use as a trigger

---

## 4. dataLayer Events Being Pushed

### From `js/consent.js`

| Event | When | Key Fields |
|-------|------|------------|
| `consent_updated` | Any time user changes consent | `consent_preferences` object |

### From `js/basket.js`

All ecommerce events follow the GA4 ecommerce schema. Each push is preceded by `window.dataLayer.push({ ecommerce: null })` to clear stale data (Google best practice).

| Event | When | Key Fields |
|-------|------|------------|
| `add_to_cart` | User clicks "Add to Basket" on products.html | `ecommerce.currency`, `ecommerce.value`, `ecommerce.items[]` |
| `remove_from_cart` | User clicks "Remove" on basket.html | `ecommerce.currency`, `ecommerce.value`, `ecommerce.items[]` |
| `begin_checkout` | User clicks "Proceed to Checkout" on basket.html | `ecommerce.currency`, `ecommerce.value`, `ecommerce.items[]` (full basket) |
| `purchase` | User submits the fake checkout form | `ecommerce.transaction_id`, `ecommerce.value`, `ecommerce.currency`, `ecommerce.items[]` |

### From `contact.html` (inline script)

No dataLayer push is currently happening. The form submission handler only calls `console.log()` and shows a notification. The actual dataLayer push is commented out as a placeholder (labeled "TODO").

---

## 5. JavaScript Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `js/dataLayer.js` | Initializes `window.dataLayer = window.dataLayer \|\| []` | Minimal placeholder - no helper functions implemented yet |
| `js/consent.js` | Full Consent Mode v2 banner, save/load/apply logic | Complete and working |
| `js/debug.js` | Floating debug panel with consent state, cookie inspector, dataLayer log, testing tools | Complete and working |
| `js/main.js` | Active nav link highlighting, `showNotification()` toast, CSS animation injection | Complete and working |
| `js/basket.js` | Basket state in localStorage, all GA4 ecommerce dataLayer pushes | Complete and working |
| `js/basket-page.js` | Renders basket UI, quantity controls, checkout form handler | Complete and working |
| `js/products.js` | Reads `data-*` attributes from product cards, calls `addToBasket()` | Complete and working |

---

## 6. CSS (`css/style.css`)

Single stylesheet covering:
- Base reset and typography
- Header and sticky nav
- Hero section (homepage)
- Card component
- Product grid (responsive, auto-fill)
- Form styles
- Footer
- Consent banner (full styles including toggle switches)
- GTM Debug Dashboard (dark-theme panel, consent state grid, cookies table, dataLayer log)
- Responsive breakpoints at 768px

The CSS includes the `.container-wide` class referenced by `products.html` but it is not defined in `style.css`. The `products.html` uses `class="container-wide"` on its main div while `style.css` only defines `.container`. This means the products page main content is not width-constrained in the same way as other pages (minor visual inconsistency, not a functional bug).

---

## 7. Infrastructure and Tooling

- **Claude agents** defined in `.claude/agents/`:
  - `gtm-teacher.md` - read-only teaching agent (uses Claude Opus)
  - `site-builder.md` - file creation/modification agent (uses Claude Opus)
  - `project-scanner.md` - audit agent (uses Claude Sonnet)
- **Claude commands** defined in `.claude/commands/`:
  - `/build-page` - triggers site-builder for a specific page
  - `/teach-me` - triggers gtm-teacher for a concept explanation
  - `/where-am-i` - triggers project-scanner audit

---

## 8. Issues and Inconsistencies Found

### Critical (broken functionality)

1. **`thankyou.html` is missing.** `js/basket-page.js` redirects to `thankyou.html` on purchase (`window.location.href = 'thankyou.html'`). This page does not exist. After completing checkout, the user will land on a 404. The `ORDER_STORAGE_KEY` (`gtm_last_order`) data is saved in localStorage and waiting to be read by a thank-you page that does not exist.

### Functional but incomplete

2. **Contact form has no dataLayer push.** The `form_submit` and `form_start` events are written in the code as comments/placeholders. The form submission fires `console.log()` only. This is explicitly marked as a TODO in the code, but it means step 5 of the learning order (form submission tracking) is scaffolded but not implemented.

3. **`js/dataLayer.js` is a placeholder.** It only runs `window.dataLayer = window.dataLayer || []` and a `console.log`. The documented helper functions (`pushPageView`, `pushEvent`, `pushFormSubmit`, etc.) do not exist yet. All actual dataLayer pushes are done inline within `basket.js` and `consent.js`.

### Minor (no broken functionality)

4. **`.container-wide` CSS class is missing.** Used in `products.html` but not defined in `style.css`. The page still renders correctly because there is no corresponding style to apply, but it will behave like an unstyled div (inherits `main` max-width).

5. **Navigation inconsistency: Basket link is absent on most pages.** The basket nav link with the item-count badge exists on `products.html` and `basket.html` but is absent from the nav on `index.html`, `about.html`, `contact.html`, and `privacy.html`. The basket badge counter (`updateBasketCounter()`) is called by `basket.js` on DOM ready, but the `#basket-count` span it targets does not exist on those pages, so the badge simply does not render.

6. **Logo text is inconsistent.** `index.html`, `contact.html`, and `privacy.html` use "GTM Prčkanje" while `products.html` and `basket.html` use "GTM Prckanje" (missing the diacritic on the c). Cosmetic only.

7. **`docs/gtm-notes.md` is missing.** CLAUDE.md lists this file as part of the project structure but it does not exist.

8. **GitHub link on `about.html` and `contact.html`.** These pages link to `https://github.com` (generic) while `index.html`, `products.html`, and `basket.html` correctly link to the actual repo at `https://github.com/PokojniFranja/wot-is-gtm`.

---

## 9. GTM Learning Progress (Against CLAUDE.md Order)

| Step | Concept | Status |
|------|---------|--------|
| 1 | Basic GTM container setup and installation | DONE - GTM-WNS3P8L9 installed on all pages with correct head + noscript pattern |
| 2 | Google Consent Mode v2 (default denied, update on user action) | DONE - Full implementation in consent.js, defaults in every HTML head |
| 3 | Page view tracking with GA4 | NOT DONE - No GA4 tag configured in GTM UI, no `page_view` dataLayer push from code |
| 4 | Click tracking (buttons, links) | PARTIALLY DONE - Add to Basket clicks push `add_to_cart` to dataLayer; no generic click tracking trigger set up in GTM |
| 5 | Form submission tracking | SCAFFOLDED ONLY - Form exists on contact.html, dataLayer push is commented out |
| 6 | Custom event tracking via dataLayer | PARTIALLY DONE - `consent_updated`, `add_to_cart`, `remove_from_cart`, `begin_checkout`, `purchase` are all pushed; no GA4 tags configured in GTM to receive them |
| 7 | Variable types (built-in, custom JS, dataLayer) | NOT DONE - No GTM variables configured |
| 8 | Trigger types (page view, click, custom event, timer) | NOT DONE - No GTM triggers configured |
| 9 | Tag sequencing and firing priority | NOT DONE |
| 10 | Debug mode and Tag Assistant | NOT DONE (as a learning exercise; the custom debug.js panel exists as a local tool) |

---

## 10. Next Logical Step

The project code is ahead of the GTM UI configuration. Steps 1 and 2 are done at the code level. The next logical step per the learning order is:

**Step 3: Configure a GA4 Page View tag in the GTM workspace.**

Concretely, this means opening the GTM UI (tagmanager.google.com) and:

1. Creating a GA4 Configuration tag (or GA4 Event tag in newer GTM) using the GA4 Measurement ID
2. Setting the trigger to "All Pages" (Initialization - All Pages, or Page View - Window Loaded)
3. Enabling the Consent Settings on the tag to check `analytics_storage`
4. Publishing the container
5. Verifying in GTM Preview Mode that the tag fires on each page

The local debugging infrastructure (`debug.js` panel) is already in place to watch the dataLayer. Once the GA4 tag is live, the `_ga` and `_ga_XXXXXX` cookies should appear in the debug panel's cookie inspector after the user grants analytics consent.

After Step 3 is working, the immediate next code-level fix that should happen is building `thankyou.html` so the purchase funnel is not broken.
