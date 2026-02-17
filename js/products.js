/**
 * ============================================================================
 * PRODUCTS PAGE - JavaScript
 * ============================================================================
 *
 * Handles the "Add to Basket" button clicks on the products page.
 *
 * HOW IT WORKS:
 * 1. Each product card has data-* attributes storing product info
 * 2. When "Add to Basket" is clicked, we read those attributes
 * 3. We call addToBasket() from basket.js (which handles localStorage + dataLayer)
 * 4. We show a notification to the user
 *
 * The actual dataLayer push happens inside basket.js, not here.
 * This keeps the code organized: this file handles UI, basket.js handles data.
 */

document.addEventListener('DOMContentLoaded', function () {

    // Find all "Add to Basket" buttons
    var buttons = document.querySelectorAll('.add-to-basket-btn');

    buttons.forEach(function (button) {
        button.addEventListener('click', function () {

            // The product card is the parent element of the button
            // It contains all the product data in data-* attributes
            var card = this.closest('.product-card');

            if (!card) {
                console.error('Could not find parent product card for button');
                return;
            }

            // Read product data from the card's data-* attributes
            // These values will be passed to basket.js and eventually
            // included in the GA4 add_to_cart dataLayer push
            var product = {
                item_id: card.getAttribute('data-item-id'),
                item_name: card.getAttribute('data-item-name'),
                price: parseFloat(card.getAttribute('data-item-price'))
            };

            // Validate that we got valid product data
            if (!product.item_id || !product.item_name || isNaN(product.price)) {
                console.error('Invalid product data:', product);
                return;
            }

            // Add the product to the basket
            // This function (from basket.js) handles:
            //   - Saving to localStorage
            //   - Pushing add_to_cart event to dataLayer for GTM
            //   - Updating the basket counter badge
            addToBasket(product);

            // Show a notification to the user
            // showNotification() is defined in main.js
            showNotification('Product added! "' + product.item_name + '"');
        });
    });

    console.log('Products page initialized -', buttons.length, 'Add to Basket buttons ready');
});
