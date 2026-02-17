# GTM Learning Notes

This document tracks what has been built, what each concept means, and what
still needs to be configured in the GTM UI. It follows the learning order
defined in `CLAUDE.md`.

---

## Quick Reference

| # | Concept | Code Status | GTM UI Status |
|---|---------|-------------|---------------|
| 1 | GTM container setup | Done | Done |
| 2 | Consent Mode v2 | Done | Pending (add consent settings to tags) |
| 3 | Page view tracking with GA4 | Done (dataLayer ready) | **Next step** |
| 4 | Click tracking | Partial (ecommerce clicks tracked) | Pending |
| 5 | Form submission tracking | Scaffolded | Pending |
| 6 | Custom event tracking via dataLayer | Done (events firing) | Pending (need GA4 tags) |
| 7 | Variable types | — | Pending |
| 8 | Trigger types | — | Pending |
| 9 | Tag sequencing & firing priority | — | Pending |
| 10 | Debug mode & Tag Assistant | Done (custom panel) | Pending (use Preview Mode) |

---

## Step 1 — GTM Container Setup

### What it is

The GTM container is a snippet of JavaScript that loads GTM on your page. Once
installed, GTM becomes the "control panel" for all your tags. You never have to
edit your site's code again to add a new tracking tag — you do it in the GTM
web interface and hit Publish.

The container snippet has two parts:
- A `<script>` tag in the `<head>` — loads GTM asynchronously (doesn't block page rendering)
- A `<noscript><iframe>` immediately after `<body>` — fallback for users with JavaScript disabled

### What's done in this project

Container ID: **GTM-WNS3P8L9**

Both parts of the snippet are installed on all pages:
- `index.html`, `about.html`, `products.html`, `contact.html`,
  `privacy.html`, `basket.html`, `thankyou.html`

The `<script>` is in `<head>` and the `<noscript>` is the first element
inside `<body>` on every page. This is the correct installation order.

### How to verify

1. Open any page in the browser
2. Open the browser console
3. Type `window.dataLayer` — you should see an array with at least one object
   containing `gtm.start` and `event: 'gtm.js'`
4. Install the [Tag Assistant Chrome extension](https://tagassistant.google.com/)
   and visit any page — it should detect container `GTM-WNS3P8L9`

---

## Step 2 — Google Consent Mode v2

### What it is

Consent Mode v2 is Google's framework for adjusting tag behaviour based on
whether the user has given consent. It signals to Google tags whether they are
allowed to use cookies or collect user data.

There are seven consent types. The most important ones:

| Type | Controls |
|------|----------|
| `analytics_storage` | Analytics cookies (e.g. `_ga`) |
| `ad_storage` | Advertising cookies (e.g. Google Ads) |
| `ad_user_data` | Sending user data to Google for ads |
| `ad_personalization` | Personalised ads and remarketing |
| `functionality_storage` | Feature cookies (e.g. language preferences) |
| `personalization_storage` | Personalisation cookies |
| `security_storage` | Security features — almost always `granted` |

**Default denied** means all types start as `denied`. Tags will not fire
(or will fire in a limited "cookieless" mode) until the user gives consent.
This is a GDPR requirement.

The `wait_for_update: 500` setting tells GTM to wait up to 500ms for a consent
update before acting. This gives the consent banner time to apply a saved
preference before GTM starts evaluating tags.

### What's done in this project

**In every HTML `<head>` (before the GTM snippet):**

```javascript
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }

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

**In `js/consent.js`:**
- Reads saved preferences from `localStorage` (`gtm_consent_preferences`)
- If a preference exists, calls `gtag('consent', 'update', {...})` immediately
- Otherwise, renders the consent banner
- Banner has: Accept All / Reject All / Manage Preferences (granular toggles)
- A "Cookie Settings" button (bottom-left) re-opens the banner at any time
- Every consent action also pushes `event: 'consent_updated'` to `dataLayer`

### What to do in the GTM UI

When you create tags in GTM (Steps 3+), you must add Consent Settings to each
tag to tell it which consent type it requires:

1. In GTM, open any tag
2. Expand **Advanced Settings → Consent Settings**
3. Set **Require additional consent checks**: Yes
4. For analytics tags: add `analytics_storage`
5. For ad tags: add `ad_storage` and `ad_user_data`

This is how GTM respects the consent signals set by `consent.js`.

### How to verify

1. Open the debug panel (orange button, bottom-right) on any page
2. The Consent State grid shows each type as GRANTED or DENIED
3. Click "Accept All" — all types should flip to GRANTED
4. Click "Reject All" — all types except `security_storage` should flip to DENIED
5. Refresh the page — the saved preference should be re-applied automatically
   (the banner should not reappear)

---

## Step 3 — Page View Tracking with GA4

### What it is

A page view event tells GA4 that a user loaded a page. GA4 uses page views to
calculate sessions, users, bounce rate, and most traffic reports.

In GTM, you create a **GA4 Event tag** with the event name `page_view`, attach
it to an **All Pages trigger**, and point it at your **GA4 Measurement ID**.
Every time GTM fires on a page load, the tag sends a page_view hit to GA4.

### What's done in this project

The GTM container is installed and `dataLayer` is initialised on every page.
GTM is ready to fire a page view tag — it just doesn't exist yet in the GTM UI.

### What to do in the GTM UI

> You need a GA4 Measurement ID (`G-XXXXXXXXXX`) first.
> Create a GA4 property at [analytics.google.com](https://analytics.google.com)
> if you don't have one.

**Step-by-step:**

1. Open [tagmanager.google.com](https://tagmanager.google.com) → container
   `GTM-WNS3P8L9`
2. Go to **Tags → New**
3. Tag name: `GA4 - Page View`
4. Tag type: **Google Tag** (or **GA4 Event** depending on GTM version)
5. Measurement ID: `G-XXXXXXXXXX` (your GA4 property ID)
6. Event name: `page_view`
7. Expand **Advanced Settings → Consent Settings**
8. Add consent check: `analytics_storage`
9. Triggering: **All Pages** (built-in trigger)
10. Save, then click **Preview** to test before publishing

**Verifying in Preview Mode:**
1. Click Preview → enter the site URL
2. GTM opens a debug session in a new tab
3. Load any page — the GA4 Page View tag should appear in the "Tags Fired" list
4. Accept cookies in the consent banner
5. Check the debug panel's Cookie Inspector — `_ga` and `_ga_XXXXXXXX` cookies
   should appear

**Publish when ready:**
Go to **Submit → Publish** in GTM. Use a version name like `"GA4 page view tag"`.

---

## Step 4 — Click Tracking

### What it is

Click tracking tells GTM/GA4 when users click specific elements — buttons,
links, CTAs. There are two approaches:

1. **GTM Auto-Event triggers** — GTM can listen for all clicks automatically
   using the built-in "Click" trigger type. You filter by element attributes
   (class, ID, text) to target specific elements. No code changes needed.

2. **dataLayer pushes from code** — You push a custom event in JavaScript when
   a click happens. This gives you more control over the data sent.

This project uses approach 2 for ecommerce clicks (Add to Basket), but has no
generic click tracking set up yet.

### What's done in this project

**Already tracked (dataLayer events firing):**

| Click | Event pushed | File |
|-------|-------------|------|
| "Add to Basket" on any product | `add_to_cart` | `js/basket.js` via `js/products.js` |
| "Remove" item in basket | `remove_from_cart` | `js/basket.js` |
| "Proceed to Checkout" | `begin_checkout` | `js/basket.js` |

**Not yet tracked:**
- Clicks on nav links
- Clicks on the "Learn More" or "Continue Shopping" buttons
- Any generic outbound link clicks

### What to do in the GTM UI

**Option A — Generic button click trigger (no code change):**

1. GTM → Triggers → New
2. Trigger type: **Click – All Elements** (or "Just Links" for `<a>` tags)
3. This trigger fires on: **Some Clicks**
4. Condition: `Click Classes` contains `btn` (or whatever class your buttons have)
5. Attach this trigger to a GA4 Event tag with event name `button_click`
6. Add a variable to capture the button text: use the built-in `Click Text` variable

**Option B — Create a GTM trigger for the existing `add_to_cart` event:**

1. GTM → Triggers → New
2. Trigger type: **Custom Event**
3. Event name: `add_to_cart`
4. Attach to a GA4 Event tag (event name: `add_to_cart`)
5. In the tag, enable **Send Ecommerce data** → Data Layer

---

## Step 5 — Form Submission Tracking

### What it is

Form submission tracking fires when a user submits a form. In GA4 this appears
as a `form_submit` event and can be used to measure lead conversion rate.

There are two common patterns:
- **GTM Form Submission trigger** — GTM listens for the form `submit` event
  automatically. No code needed, but you cannot easily add custom fields.
- **dataLayer push on submit** — Your code intercepts the form submit,
  pushes a custom event with extra data (form name, fields filled, etc.),
  then GTM picks it up.

### What's done in this project

The contact form (`contact.html`) exists and has a submit handler in place.
The dataLayer push is **scaffolded but commented out** — the handler currently
only calls `console.log()`.

To activate it, the submit handler in `contact.html` needs to be updated to
push to `dataLayer`.

### What to do in this project (code change)

Find the form submit handler in `contact.html` and update it to push:

```javascript
window.dataLayer.push({
    'event': 'form_submit',
    'form_name': 'contact_form',
    'form_location': 'contact_page'
});
```

Then in GTM:
1. Triggers → New → Custom Event → Event name: `form_submit`
2. Tags → New → GA4 Event tag → Event name: `form_submit`
3. Add event parameter `form_name` → Value: `{{DLV - form_name}}` (a dataLayer variable)

---

## Step 6 — Custom Event Tracking via dataLayer

### What it is

The `dataLayer` is a JavaScript array that acts as a communication channel
between your website code and GTM. Your code pushes objects (events + data)
into the array. GTM reads those objects and can trigger tags based on them.

The dataLayer pattern:
```javascript
// 1. Clear any previous ecommerce data (Google best practice)
window.dataLayer.push({ ecommerce: null });

// 2. Push your event
window.dataLayer.push({
    'event': 'your_event_name',    // GTM listens for this
    'some_data': 'some_value'       // GTM can read this via dataLayer variables
});
```

The `event` key is special — GTM uses it to trigger tags.
Everything else is data you can read using **dataLayer Variables** (Step 7).

### What's done in this project

All these events are currently firing on user actions:

| Event | Fired from | Data included |
|-------|-----------|---------------|
| `consent_updated` | `js/consent.js` | `consent_preferences` object |
| `add_to_cart` | `js/basket.js` | `ecommerce.currency`, `ecommerce.value`, `ecommerce.items[]` |
| `remove_from_cart` | `js/basket.js` | `ecommerce.currency`, `ecommerce.value`, `ecommerce.items[]` |
| `begin_checkout` | `js/basket.js` | `ecommerce.currency`, `ecommerce.value`, `ecommerce.items[]` |
| `purchase` | `js/basket.js` | `ecommerce.transaction_id`, `ecommerce.value`, `ecommerce.currency`, `ecommerce.items[]` |
| `thankyou_page_view` | `thankyou.html` | `transaction_id`, `order_value`, `order_currency`, `order_items_count` |

You can see all of these in real time using the debug panel (orange button).

### What to do in the GTM UI

For each event, you need to:
1. Create a **Custom Event trigger** matching the event name
2. Create a **GA4 Event tag** wired to that trigger
3. For ecommerce events, enable **Send Ecommerce data → Data Source: Data Layer**

The `purchase` event is the most valuable one to configure — it unlocks GA4
revenue reports and Google Ads conversion tracking.

---

## Step 7 — Variable Types

### What it is

Variables are how GTM reads dynamic values — page URLs, button text, dataLayer
values, cookie values, etc. You use variables inside tags and triggers.

**Built-in variables** (enabled in GTM under Variables → Configure):

| Variable | Returns |
|----------|---------|
| `Page URL` | Current page URL |
| `Page Path` | URL path (e.g. `/products.html`) |
| `Page Title` | `<title>` tag content |
| `Click Text` | Text content of clicked element |
| `Click ID` | `id` attribute of clicked element |
| `Click Classes` | `class` attribute of clicked element |
| `Form ID` | `id` of submitted form |

**dataLayer Variables** — read a key from the `dataLayer` push:

For example, after `window.dataLayer.push({ 'event': 'purchase', 'ecommerce': { 'transaction_id': 'T-123' } })`:
- Variable name: `DLV - transaction_id`
- Variable type: Data Layer Variable
- Data Layer Variable Name: `ecommerce.transaction_id`

**Custom JavaScript Variables** — run arbitrary JS and return a value:

```javascript
function() {
    return localStorage.getItem('gtm_basket') ? JSON.parse(localStorage.getItem('gtm_basket')).length : 0;
}
```

### What to do in the GTM UI

1. Go to **Variables → Built-In Variables → Configure**
2. Enable: `Page URL`, `Page Path`, `Page Title`, `Click Text`, `Click ID`,
   `Click Classes`, `Form ID`, `Form Classes`
3. Go to **Variables → User-Defined Variables → New**
4. Create a dataLayer Variable for each piece of ecommerce data you want to
   pass to GA4 tags:
   - `DLV - transaction_id` → `ecommerce.transaction_id`
   - `DLV - ecommerce_value` → `ecommerce.value`
   - `DLV - ecommerce_currency` → `ecommerce.currency`

---

## Step 8 — Trigger Types

### What it is

Triggers tell GTM *when* to fire a tag. Without a trigger, a tag never fires.

**The main trigger types:**

| Trigger Type | Fires when |
|-------------|-----------|
| Page View – DOM Ready | DOM is fully built, JS has run |
| Page View – Window Loaded | Full page including images loaded |
| Initialization – All Pages | Very early in page load (before GA4 fires) |
| Custom Event | `window.dataLayer.push({ event: 'your_event' })` |
| Click – All Elements | Any element is clicked |
| Click – Just Links | Any `<a>` link is clicked |
| Form Submission | A form is submitted |
| Timer | Fires every N milliseconds |
| History Change | URL hash or pushState changes (for SPAs) |

**Trigger conditions** — you can add filters to any trigger so it only fires
on certain pages or for certain elements:
- `Page Path equals /thankyou.html` → only fire on the thank you page
- `Click Classes contains btn` → only fire when a `.btn` element is clicked
- `Event equals purchase` → only fire for the purchase dataLayer push

### What to do in the GTM UI

For the events already in this project, create these triggers:

| Trigger Name | Type | Condition |
|-------------|------|-----------|
| `All Pages` | Page View | (built-in, already exists) |
| `CE - add_to_cart` | Custom Event | Event name: `add_to_cart` |
| `CE - remove_from_cart` | Custom Event | Event name: `remove_from_cart` |
| `CE - begin_checkout` | Custom Event | Event name: `begin_checkout` |
| `CE - purchase` | Custom Event | Event name: `purchase` |
| `CE - thankyou_page_view` | Custom Event | Event name: `thankyou_page_view` |
| `CE - consent_updated` | Custom Event | Event name: `consent_updated` |
| `CE - form_submit` | Custom Event | Event name: `form_submit` |

---

## Step 9 — Tag Sequencing and Firing Priority

### What it is

Sometimes tags need to fire in a specific order. GTM has two mechanisms:

**Firing Priority** (simple ordering):
- Set a number on a tag under Advanced Settings → Tag firing priority
- Higher number = fires first
- Default is 0; use 10, 20, 30 for important ordering

**Tag Sequencing** (explicit dependencies):
- Under Advanced Settings → Tag Sequencing
- "Setup tag": runs *before* this tag fires
- "Cleanup tag": runs *after* this tag fires
- If the setup tag fails, this tag will not fire

### Common use cases

**GA4 Configuration before GA4 Event tags:**
If you use a GA4 Configuration tag (sets the Measurement ID globally), all GA4
Event tags should have it as a Setup Tag. This ensures the configuration is
loaded before any events fire.

**Consent initialisation before all other tags:**
The consent default is set inline in the HTML (before GTM loads), so GTM
automatically respects it. No tag sequencing is needed for this project.

**Purchase tag fires once:**
Use **Tag Firing Options → Once per page** on the purchase GA4 tag to prevent
duplicate conversion counting if the user somehow triggers the event twice.

---

## Step 10 — Debug Mode and Tag Assistant

### What it is

GTM's **Preview Mode** runs your container in debug mode without publishing it
to live users. It opens a side panel showing exactly which tags fired, which
triggers activated them, and the full dataLayer state at each moment.

**Tag Assistant** is the Chrome extension that powers Preview Mode.

### Tools available in this project

**Custom debug panel** (`js/debug.js`) — available on every page via the
orange "GTM Debug" button (bottom-right):
- Consent state grid (live view of all 7 consent types)
- Cookie inspector (auto-refreshes every 2 seconds — watch `_ga` cookies appear)
- dataLayer event log (all pushes captured in real time)
- Testing tools: Reset consent, clear all cookies, view localStorage

### How to use GTM Preview Mode

1. In GTM, click **Preview** (top right)
2. Enter your site URL (e.g. `https://pokojnifranja.github.io/wot-is-gtm/`)
3. A new tab opens with Tag Assistant connected
4. GTM Preview panel appears at the bottom of the page
5. Every tag that fires appears under **Tags Fired**
6. Every dataLayer push appears under **Data Layer**
7. Click on any event in the left panel to see which tags fired in response

### Useful things to test in Preview Mode

| Action | What to look for |
|--------|-----------------|
| Load any page | GTM initialisation, page_view tag fires |
| Accept cookies | `consent_updated` event, analytics tags unblocked |
| Click "Add to Basket" | `add_to_cart` event in dataLayer |
| Go to basket, click Checkout | `begin_checkout` event |
| Fill form, click Complete Purchase | `purchase` event with transaction_id |
| Arrive on thankyou.html | `thankyou_page_view` event |

---

## dataLayer Events Reference

All events currently firing in this project:

```javascript
// Consent updated (any time user changes consent)
{
    event: 'consent_updated',
    consent_preferences: {
        analytics: 'granted' | 'denied',
        advertising: 'granted' | 'denied',
        functionality: 'granted' | 'denied',
        personalization: 'granted' | 'denied'
    }
}

// Add to cart (products.html — "Add to Basket" button)
{ ecommerce: null }  // always clear first
{
    event: 'add_to_cart',
    ecommerce: {
        currency: 'EUR',
        value: 29.99,
        items: [{ item_id: 'SKU_001', item_name: 'Product Name', price: 29.99, quantity: 1 }]
    }
}

// Remove from cart (basket.html — "Remove" button)
{ ecommerce: null }
{
    event: 'remove_from_cart',
    ecommerce: {
        currency: 'EUR',
        value: 59.98,
        items: [{ item_id: 'SKU_001', item_name: 'Product Name', price: 29.99, quantity: 2 }]
    }
}

// Begin checkout (basket.html — "Proceed to Checkout")
{ ecommerce: null }
{
    event: 'begin_checkout',
    ecommerce: {
        currency: 'EUR',
        value: 89.97,
        items: [ /* all basket items */ ]
    }
}

// Purchase (basket.html — checkout form submit, fires BEFORE redirect)
{ ecommerce: null }
{
    event: 'purchase',
    ecommerce: {
        transaction_id: 'T-847293',   // unique per purchase
        value: 89.97,
        currency: 'EUR',
        items: [ /* all purchased items */ ]
    }
}

// Thank you page view (thankyou.html — fires on DOMContentLoaded)
{
    event: 'thankyou_page_view',
    transaction_id: 'T-847293',
    order_value: 89.97,
    order_currency: 'EUR',
    order_items_count: 3
}
```

---

## localStorage Keys Used

| Key | Set by | Read by | Content |
|-----|--------|---------|---------|
| `gtm_consent_preferences` | `consent.js` | `consent.js` | User's consent choices |
| `gtm_basket` | `basket.js` | `basket.js`, `basket-page.js` | Array of cart items |
| `gtm_last_order` | `basket.js` | `thankyou.html` | Last completed order object |

---

## Container & Property IDs

| Thing | ID |
|-------|----|
| GTM Container | `GTM-WNS3P8L9` |
| GA4 Measurement ID | *(not yet configured — get from analytics.google.com)* |

---

*Last updated: 2026-02-17*
