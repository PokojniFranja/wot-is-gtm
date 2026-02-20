/**
 * ============================================================================
 * BASKET / CART MODULE - E-commerce Flow for GTM Learning
 * ============================================================================
 *
 * This file manages the shopping basket using localStorage and pushes
 * GA4-compliant ecommerce events to the dataLayer for GTM to capture.
 *
 * KEY CONCEPTS FOR GTM LEARNING:
 * - Every ecommerce action (add, remove, checkout, purchase) pushes a
 *   specific event to the dataLayer
 * - These events follow Google's GA4 ecommerce schema EXACTLY
 *   (see: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)
 * - GTM reads these events and forwards them to GA4 (or other tools)
 * - The 'ecommerce' object must be cleared before each new push to avoid
 *   stale data bleeding into subsequent events
 *
 * LOCALSTORAGE KEY: 'gtm_basket'
 * FORMAT: Array of item objects: [{ item_id, item_name, price, quantity }]
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** localStorage key for basket data */
const BASKET_STORAGE_KEY = 'gtm_basket';

/** localStorage key for completed order (used by thankyou.html) */
const ORDER_STORAGE_KEY = 'gtm_last_order';

/** Currency used across all ecommerce events - GTM/GA4 requires ISO 4217 format */
const CURRENCY = 'EUR';

// ============================================================================
// BASKET STATE MANAGEMENT (localStorage)
// ============================================================================

/**
 * Get the current basket from localStorage
 * @returns {Array} Array of basket item objects
 */
function getBasket() {
    try {
        const saved = localStorage.getItem(BASKET_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Error reading basket from localStorage:', error);
        return [];
    }
}

/**
 * Save the basket to localStorage
 * @param {Array} basket - Array of basket item objects
 */
function saveBasket(basket) {
    try {
        localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(basket));
    } catch (error) {
        console.error('Error saving basket to localStorage:', error);
    }
}

/**
 * Clear the basket entirely from localStorage
 * Called after a successful purchase
 */
function clearBasket() {
    localStorage.removeItem(BASKET_STORAGE_KEY);
    console.log('Basket cleared from localStorage');
}

/**
 * Get the total number of items in the basket
 * This counts total quantity, not unique products
 * @returns {number} Total item count
 */
function getBasketItemCount() {
    const basket = getBasket();
    return basket.reduce(function (total, item) {
        return total + item.quantity;
    }, 0);
}

/**
 * Calculate the total value of all items in the basket
 * @returns {number} Total basket value rounded to 2 decimal places
 */
function getBasketTotal() {
    const basket = getBasket();
    var total = basket.reduce(function (sum, item) {
        return sum + (item.price * item.quantity);
    }, 0);
    // Round to 2 decimal places to avoid floating-point issues (e.g. 29.99 * 3)
    return Math.round(total * 100) / 100;
}

// ============================================================================
// BASKET OPERATIONS (with dataLayer pushes)
// ============================================================================

/**
 * Add a product to the basket
 *
 * If the product already exists, increment its quantity.
 * If it's new, add it with quantity 1.
 *
 * GTM REQUIRED: Pushes 'add_to_cart' event to dataLayer
 * This follows the GA4 ecommerce schema for the add_to_cart event.
 * In GTM, you would create a trigger for this event and wire it to
 * a GA4 Event tag to send the data to Google Analytics.
 *
 * @param {Object} product - Product to add
 * @param {string} product.item_id - Unique product identifier (SKU)
 * @param {string} product.item_name - Human-readable product name
 * @param {number} product.price - Product price (number, not string)
 */
function addToBasket(product) {
    var basket = getBasket();

    // Check if product already exists in basket
    var existingIndex = -1;
    for (var i = 0; i < basket.length; i++) {
        if (basket[i].item_id === product.item_id) {
            existingIndex = i;
            break;
        }
    }

    if (existingIndex >= 0) {
        // Product exists - increment quantity
        basket[existingIndex].quantity += 1;
        console.log('Basket: Increased quantity for', product.item_name,
            'to', basket[existingIndex].quantity);
    } else {
        // New product - add with quantity 1
        basket.push({
            item_id: product.item_id,
            item_name: product.item_name,
            item_category: product.item_category || '',
            price: product.price,
            quantity: 1
        });
        console.log('Basket: Added new product', product.item_name);
    }

    // Save updated basket to localStorage
    saveBasket(basket);

    // =========================================================================
    // GTM REQUIRED: Push add_to_cart event to dataLayer
    // =========================================================================
    //
    // WHY: This tells GTM that a user added a product to their cart.
    //       GTM will forward this to GA4 as an ecommerce event.
    //
    // IMPORTANT: We clear the 'ecommerce' object first to prevent
    //            stale data from a previous push contaminating this one.
    //            This is a Google best practice for ecommerce tracking.
    //
    // WHAT GTM DOES WITH THIS:
    //   1. GTM trigger fires on event = 'add_to_cart'
    //   2. GA4 Event tag reads the ecommerce.items array
    //   3. GA4 records: which product, its price, and quantity
    //   4. This data appears in GA4 > Reports > Monetization > Ecommerce
    //
    // SCHEMA: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
    // =========================================================================
    window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce data
    window.dataLayer.push({
        'event': 'add_to_cart',
        'ecommerce': {
            'currency': CURRENCY,
            'value': product.price,
            'items': [{
                'item_name': product.item_name,
                'item_id': product.item_id,
                'price': product.price,
                'item_category': product.item_category,
                'quantity': 1
            }]
        }
    });

    console.log('dataLayer: Pushed add_to_cart event for', product.item_name);

    // Update the basket counter badge in the navigation
    updateBasketCounter();
}

/**
 * Remove a product from the basket entirely
 *
 * GTM REQUIRED: Pushes 'remove_from_cart' event to dataLayer
 * GA4 uses this to track when users remove items, which helps
 * understand cart abandonment patterns.
 *
 * @param {string} itemId - The item_id of the product to remove
 */
function removeFromBasket(itemId) {
    var basket = getBasket();

    // Find the item before removing so we can include it in the dataLayer push
    var removedItem = null;
    for (var i = 0; i < basket.length; i++) {
        if (basket[i].item_id === itemId) {
            removedItem = basket[i];
            break;
        }
    }

    if (!removedItem) {
        console.warn('Basket: Item not found for removal:', itemId);
        return;
    }

    // Remove the item from the basket array
    basket = basket.filter(function (item) {
        return item.item_id !== itemId;
    });

    // Save updated basket
    saveBasket(basket);

    // =========================================================================
    // GTM REQUIRED: Push remove_from_cart event to dataLayer
    // =========================================================================
    //
    // WHY: GA4 tracks when users remove items from their cart.
    //       This helps analyze cart abandonment and product performance.
    //
    // WHAT GTM DOES WITH THIS:
    //   1. GTM trigger fires on event = 'remove_from_cart'
    //   2. GA4 Event tag reads the ecommerce.items array
    //   3. GA4 records the removal with product details and quantity
    //   4. This data appears in GA4 funnel reports
    //
    // SCHEMA: Same structure as add_to_cart but with event name 'remove_from_cart'
    // =========================================================================
    window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce data
    window.dataLayer.push({
        'event': 'remove_from_cart',
        'ecommerce': {
            'currency': CURRENCY,
            'value': removedItem.price * removedItem.quantity,
            'items': [{
                'item_name': removedItem.item_name,
                'item_id': removedItem.item_id,
                'item_category': removedItem.item_category || '',
                'price': removedItem.price,
                'quantity': removedItem.quantity
            }]
        }
    });

    console.log('dataLayer: Pushed remove_from_cart event for', removedItem.item_name);

    // Update the basket counter badge in the navigation
    updateBasketCounter();
}

/**
 * Update the quantity of a product in the basket
 * Does NOT push a dataLayer event (quantity changes are not a standard GA4 event).
 * If quantity becomes 0 or less, remove the item entirely (which does push an event).
 *
 * @param {string} itemId - The item_id of the product
 * @param {number} newQuantity - The new quantity
 */
function updateBasketQuantity(itemId, newQuantity) {
    // If new quantity is zero or less, remove the item
    if (newQuantity <= 0) {
        removeFromBasket(itemId);
        return;
    }

    var basket = getBasket();

    for (var i = 0; i < basket.length; i++) {
        if (basket[i].item_id === itemId) {
            basket[i].quantity = newQuantity;
            console.log('Basket: Updated quantity for', basket[i].item_name, 'to', newQuantity);
            break;
        }
    }

    saveBasket(basket);
    updateBasketCounter();
}

/**
 * Push the begin_checkout event to dataLayer
 *
 * GTM REQUIRED: Pushes 'begin_checkout' event to dataLayer
 * Called when the user clicks "Proceed to Checkout" on the basket page.
 * This is an important funnel event -- it tells GA4 that the user has
 * moved from browsing/cart to the checkout step.
 */
function pushBeginCheckout() {
    var basket = getBasket();
    var total = getBasketTotal();

    // =========================================================================
    // GTM REQUIRED: Push begin_checkout event to dataLayer
    // =========================================================================
    //
    // WHY: This marks the transition from "shopping" to "buying" in the funnel.
    //       GA4 uses this to calculate checkout conversion rates.
    //
    // WHAT GTM DOES WITH THIS:
    //   1. GTM trigger fires on event = 'begin_checkout'
    //   2. GA4 Event tag reads ecommerce.items (all items in cart)
    //   3. GA4 records the checkout initiation with total value
    //   4. This data feeds into GA4's checkout funnel visualization
    //
    // NOTE: The 'items' array includes ALL items in the basket, not just one.
    //       The 'value' is the total basket value.
    // =========================================================================
    window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce data
    window.dataLayer.push({
        'event': 'begin_checkout',
        'ecommerce': {
            'currency': CURRENCY,
            'value': total,
            'items': basket.map(function (item) {
                return {
                    'item_name': item.item_name,
                    'item_id': item.item_id,
                    'item_category': item.item_category || '',
                    'price': item.price,
                    'quantity': item.quantity
                };
            })
        }
    });

    console.log('dataLayer: Pushed begin_checkout event with', basket.length, 'items, total:', total);
}

function pushViewCart() {
    var basket = getBasket();
    var total = getBasketTotal();

    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
        event: 'view_cart',
        ecommerce: {
            currency: CURRENCY,
            value: total,
            items: basket.map(function (item) {
                return {
                    item_id: item.item_id,
                    item_name: item.item_name,
                    item_category: item.item_category || '',
                    price: item.price,
                    quantity: item.quantity
                };
            })
        }
    });
}


/**
 * Push the purchase event to dataLayer and save order details
 *
 * GTM REQUIRED: Pushes 'purchase' event to dataLayer
 *
 * THIS IS THE MOST IMPORTANT ECOMMERCE EVENT FOR GA4 AND GOOGLE ADS.
 * The purchase event is what GA4 uses to calculate revenue, and what
 * Google Ads uses for conversion tracking (e.g., "how many sales did
 * my ad campaign generate?").
 *
 * Without this event, you cannot track revenue in GA4 or set up
 * ROAS (Return on Ad Spend) bidding in Google Ads.
 *
 * @returns {Object} The order object (for display on thank you page)
 */
function pushPurchaseEvent() {
    var basket = getBasket();
    var total = getBasketTotal();

    // Generate a unique transaction ID
    // In a real store, this would come from your backend/payment system
    var transactionId = 'T-' + Math.floor(Math.random() * 1000000);

    // Build the order object
    var order = {
        transaction_id: transactionId,
        value: total,
        currency: CURRENCY,
        items: basket.map(function (item) {
            return {
                item_name: item.item_name,
                item_id: item.item_id,
                item_category: item.item_category || '',
                price: item.price,
                quantity: item.quantity
            };
        })
    };

    // Save order to localStorage so thankyou.html can display it
    try {
        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
    } catch (error) {
        console.error('Error saving order:', error);
    }

    // =========================================================================
    // GTM REQUIRED: Push purchase event to dataLayer
    // =========================================================================
    //
    // THIS IS THE MOST IMPORTANT ECOMMERCE EVENT.
    //
    // WHY: The purchase event is what GA4 uses to:
    //   - Calculate total revenue
    //   - Track conversion rates through the entire funnel
    //   - Attribute revenue to marketing channels and campaigns
    //
    // WHY IT MATTERS FOR GOOGLE ADS:
    //   - Google Ads reads this event (via GA4 link) for conversion tracking
    //   - Enables "Target ROAS" bidding strategy (optimize for return on ad spend)
    //   - Allows you to see exactly which ads/keywords drove purchases
    //
    // CRITICAL FIELDS:
    //   - transaction_id: MUST be unique per purchase to avoid duplicate counting
    //   - value: Total revenue from this purchase
    //   - currency: ISO 4217 format (EUR, USD, GBP, etc.)
    //   - items: Array of all purchased products with prices and quantities
    //
    // WHAT GTM DOES WITH THIS:
    //   1. GTM trigger fires on event = 'purchase'
    //   2. GA4 Event tag reads the full ecommerce object
    //   3. GA4 records the purchase with transaction_id, revenue, and item details
    //   4. This appears in GA4 > Reports > Monetization > Ecommerce purchases
    //   5. Revenue data flows to Google Ads if GA4-Ads linking is configured
    //
    // SCHEMA: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
    // =========================================================================
    window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce data
    window.dataLayer.push({
        'event': 'purchase',
        'ecommerce': {
            'transaction_id': transactionId,
            'value': total,
            'currency': CURRENCY,
            'items': order.items
        }
    });

    console.log('dataLayer: Pushed purchase event - Transaction:', transactionId, 'Value:', total, CURRENCY);

    // Clear the basket after purchase
    clearBasket();

    // Update the basket counter (should now show 0)
    updateBasketCounter();

    return order;
}

/**
 * Get the last completed order from localStorage
 * Used by thankyou.html to display the order summary
 * @returns {Object|null} Order object or null
 */
function getLastOrder() {
    try {
        var saved = localStorage.getItem(ORDER_STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error('Error reading last order:', error);
        return null;
    }
}

/**
 * Clear the last order from localStorage
 * Called after the thank you page has displayed and the purchase event has fired
 */
function clearLastOrder() {
    localStorage.removeItem(ORDER_STORAGE_KEY);
}

// ============================================================================
// UI HELPERS
// ============================================================================

/**
 * Update the basket counter badge in the navigation
 * This runs on every page to keep the badge in sync with localStorage
 */
function updateBasketCounter() {
    var count = getBasketItemCount();
    var badge = document.getElementById('basket-count');

    if (badge) {
        badge.textContent = count;
        // Show/hide the badge based on whether there are items
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// When this script loads on any page, update the basket counter
// We wait for DOM to be ready so the badge element exists
document.addEventListener('DOMContentLoaded', function () {
    updateBasketCounter();
});

// Export basket functions for debugging via browser console
window.basketDebug = {
    getBasket: getBasket,
    getCount: getBasketItemCount,
    getTotal: getBasketTotal,
    clear: clearBasket,
    getOrder: getLastOrder
};

console.log('basket.js loaded - use window.basketDebug for manual testing');
