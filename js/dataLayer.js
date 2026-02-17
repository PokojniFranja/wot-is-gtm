/**
 * GTM dataLayer Helper Functions
 *
 * The dataLayer is a JavaScript array that GTM reads to get information
 * about your page, user interactions, and custom events.
 *
 * Think of it as a "messenger" between your website and GTM.
 * You push data into the dataLayer, and GTM listens for it.
 *
 * For now, this is a placeholder - we'll implement dataLayer pushes
 * when we start learning about GTM events and variables.
 */

/**
 * Initialize dataLayer array
 * GTM will also create this, but it's good practice to initialize it
 * This prevents errors if GTM hasn't loaded yet
 */
window.dataLayer = window.dataLayer || [];

console.log('dataLayer.js loaded - ready for GTM integration');

/**
 * Future implementations will include helper functions like:
 *
 * pushPageView() - Push page view data
 * pushEvent(eventName, eventData) - Push custom events
 * pushFormSubmit(formName) - Track form submissions
 * pushProductClick(productData) - Track product interactions
 * pushCustomDimension(key, value) - Send custom data to analytics
 *
 * Example of what a dataLayer push looks like:
 *
 * window.dataLayer.push({
 *     'event': 'custom_event_name',
 *     'eventCategory': 'category',
 *     'eventAction': 'action',
 *     'eventLabel': 'label'
 * });
 */
