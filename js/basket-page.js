/**
 * ============================================================================
 * BASKET PAGE - JavaScript
 * ============================================================================
 *
 * Renders the basket contents, handles quantity changes and item removal,
 * and manages the checkout flow.
 *
 * This file is responsible for the UI on basket.html.
 * The actual dataLayer pushes happen in basket.js.
 *
 * ECOMMERCE FUNNEL STEP 2:
 *   Browse (products.html) -> CART (basket.html) -> Purchase (thankyou.html)
 *
 * GTM EVENTS ON THIS PAGE:
 *   - remove_from_cart: When user removes an item (via basket.js)
 *   - begin_checkout: When user clicks "Proceed to Checkout" (via basket.js)
 *   - purchase: When user completes the fake checkout (via basket.js)
 */

document.addEventListener('DOMContentLoaded', function () {

    // Render the basket on page load
    renderBasket();
    pushViewCart();

    // Set up checkout form handler
    setupCheckoutForm();

    // Set up cancel checkout button
    var cancelBtn = document.getElementById('cancel-checkout-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function () {
            document.getElementById('checkout-section').style.display = 'none';
            document.getElementById('basket-contents').style.display = 'block';
            renderBasket();
            pushViewCart();
        });
    }
});

/**
 * Render the basket contents from localStorage
 * Builds the entire basket HTML including item rows, totals, and action buttons
 */
function renderBasket() {
    var container = document.getElementById('basket-contents');
    if (!container) return;

    var basket = getBasket(); // From basket.js

    // ---- EMPTY BASKET STATE ----
    if (basket.length === 0) {
        container.innerHTML = ''
            + '<div class="card text-center">'
            + '  <h2>Your basket is empty</h2>'
            + '  <p>Browse our products and add some items to get started.</p>'
            + '  <a href="products.html" class="btn">Continue Shopping</a>'
            + '</div>';
        return;
    }

    // ---- BASKET WITH ITEMS ----
    var total = getBasketTotal(); // From basket.js
    var html = '';

    // Table header
    html += '<div class="basket-table">';
    html += '  <div class="basket-header">';
    html += '    <div class="basket-col-product">Product</div>';
    html += '    <div class="basket-col-price">Price</div>';
    html += '    <div class="basket-col-quantity">Quantity</div>';
    html += '    <div class="basket-col-subtotal">Subtotal</div>';
    html += '    <div class="basket-col-action"></div>';
    html += '  </div>';

    // Item rows
    basket.forEach(function (item) {
        var subtotal = Math.round(item.price * item.quantity * 100) / 100;

        html += '  <div class="basket-row" data-item-id="' + item.item_id + '">';
        html += '    <div class="basket-col-product">';
        html += '      <strong>' + escapeHtmlBasket(item.item_name) + '</strong>';
        html += '      <br><small class="text-muted">' + escapeHtmlBasket(item.item_id) + '</small>';
        html += '    </div>';
        html += '    <div class="basket-col-price">' + item.price.toFixed(2) + ' EUR</div>';
        html += '    <div class="basket-col-quantity">';
        html += '      <button class="qty-btn qty-minus" data-item-id="' + item.item_id + '">-</button>';
        html += '      <span class="qty-value">' + item.quantity + '</span>';
        html += '      <button class="qty-btn qty-plus" data-item-id="' + item.item_id + '">+</button>';
        html += '    </div>';
        html += '    <div class="basket-col-subtotal"><strong>' + subtotal.toFixed(2) + ' EUR</strong></div>';
        html += '    <div class="basket-col-action">';
        html += '      <button class="btn-remove" data-item-id="' + item.item_id + '">Remove</button>';
        html += '    </div>';
        html += '  </div>';
    });

    html += '</div>'; // Close basket-table

    // Order total
    html += '<div class="basket-total">';
    html += '  <strong>Order Total: ' + total.toFixed(2) + ' EUR</strong>';
    html += '</div>';

    // Action buttons
    html += '<div class="basket-actions">';
    html += '  <a href="products.html" class="btn btn-secondary">Continue Shopping</a>';
    html += '  <button id="proceed-checkout-btn" class="btn">Proceed to Checkout</button>';
    html += '</div>';

    container.innerHTML = html;

    // ---- ATTACH EVENT LISTENERS ----

    // Quantity minus buttons
    var minusBtns = container.querySelectorAll('.qty-minus');
    minusBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var itemId = this.getAttribute('data-item-id');
            var basket = getBasket();
            for (var i = 0; i < basket.length; i++) {
                if (basket[i].item_id === itemId) {
                    // updateBasketQuantity handles removal if quantity hits 0
                    updateBasketQuantity(itemId, basket[i].quantity - 1);
                    renderBasket(); // Re-render the page
                    break;
                }
            }
        });
    });

    // Quantity plus buttons
    var plusBtns = container.querySelectorAll('.qty-plus');
    plusBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var itemId = this.getAttribute('data-item-id');
            var basket = getBasket();
            for (var i = 0; i < basket.length; i++) {
                if (basket[i].item_id === itemId) {
                    updateBasketQuantity(itemId, basket[i].quantity + 1);
                    renderBasket(); // Re-render the page
                    break;
                }
            }
        });
    });

    // Remove buttons
    var removeBtns = container.querySelectorAll('.btn-remove');
    removeBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var itemId = this.getAttribute('data-item-id');
            // removeFromBasket (from basket.js) pushes remove_from_cart to dataLayer
            removeFromBasket(itemId);
            renderBasket(); // Re-render the page
            showNotification('Item removed from basket');
        });
    });

    // "Proceed to Checkout" button
    var checkoutBtn = document.getElementById('proceed-checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function () {
            // =========================================================
            // GTM REQUIRED: Push begin_checkout event
            // =========================================================
            // This tells GTM/GA4 that the user has started the checkout
            // process. It is an important step in the ecommerce funnel.
            // The actual dataLayer push happens inside basket.js.
            // =========================================================
            pushBeginCheckout(); // From basket.js

            // Show the checkout form, hide the basket table
            document.getElementById('basket-contents').style.display = 'none';
            document.getElementById('checkout-section').style.display = 'block';
        });
    }
}

/**
 * Set up the checkout form submission handler
 *
 * When the form is submitted:
 * 1. Prevent the default form submission (this is a demo)
 * 2. Push the purchase event to dataLayer (the most important ecommerce event)
 * 3. Redirect to thankyou.html
 */
function setupCheckoutForm() {
    var form = document.getElementById('checkout-form');
    if (!form) return;

    form.addEventListener('submit', function (event) {
        // Prevent actual form submission - this is just a demo
        event.preventDefault();

        // =========================================================
        // GTM REQUIRED: Push purchase event
        // =========================================================
        // pushPurchaseEvent (from basket.js) does several things:
        //   1. Generates a unique transaction_id
        //   2. Saves the order to localStorage (for thankyou.html)
        //   3. Pushes the 'purchase' event to dataLayer
        //   4. Clears the basket from localStorage
        //
        // The purchase event is THE MOST IMPORTANT ecommerce event.
        // Without it, GA4 cannot track revenue and Google Ads
        // cannot optimize for purchase conversions.
        // =========================================================
        pushPurchaseEvent(); // From basket.js

        // Redirect to the thank you page
        // The thank you page will read the order from localStorage
        // and display the order summary
        window.location.href = 'thankyou.html';
    });
}

/**
 * Simple HTML escape to prevent XSS in rendered basket items
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtmlBasket(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
