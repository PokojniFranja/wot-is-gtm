/**
 * ============================================================================
 * GOOGLE CONSENT MODE V2 - COOKIE CONSENT BANNER
 * ============================================================================
 *
 * This file handles user consent for tracking cookies and integrates with
 * Google Consent Mode v2.
 *
 * KEY CONCEPTS:
 * - We already set default consent to "denied" in the HTML <head>
 * - This script checks if the user has previously made a choice
 * - If yes: automatically apply their saved choice
 * - If no: show the consent banner
 * - When user makes a choice: update consent via gtag() and save to localStorage
 *
 * CONSENT CATEGORIES:
 * 1. Analytics Storage (analytics_storage)
 *    - Enables cookies for analytics tools like Google Analytics
 *    - Tracks page views, user behavior, site performance
 *
 * 2. Advertising Storage (ad_storage)
 *    - Enables cookies for advertising purposes
 *    - Tracks ad performance, conversions from ads
 *
 * 3. Ad User Data (ad_user_data)
 *    - Allows sending user data to Google for advertising
 *    - Used for audience targeting and measurement
 *
 * 4. Ad Personalization (ad_personalization)
 *    - Enables personalized advertising (remarketing, custom audiences)
 *    - Shows ads based on user's browsing history
 *
 * 5. Functionality Storage (functionality_storage)
 *    - Enables cookies for site functionality (language prefs, UI settings)
 *    - Usually considered "necessary" cookies
 *
 * 6. Personalization Storage (personalization_storage)
 *    - Enables cookies for content personalization (video recommendations, etc.)
 *    - Customizes user experience based on preferences
 *
 * 7. Security Storage (security_storage)
 *    - ALWAYS granted - required for fraud prevention, authentication
 *    - Not included in user choices (mandatory)
 */

// localStorage key where we save the user's consent choice
const CONSENT_STORAGE_KEY = 'gtm_consent_preferences';

// Check if user has previously made a consent choice
// This runs immediately when the script loads
(function initializeConsent() {
    console.log('🔐 Consent.js initializing...');

    // Try to load saved consent preferences from localStorage
    const savedConsent = loadSavedConsent();

    if (savedConsent) {
        // User has previously made a choice - apply it automatically
        console.log('✅ Found saved consent preferences:', savedConsent);
        applyConsent(savedConsent);
    } else {
        // No saved consent - show the banner
        console.log('⚠️ No saved consent found - showing banner');
        showConsentBanner();
    }

    // Add the "Cookie Settings" button (always visible in bottom-left)
    createCookieSettingsButton();
})();

/**
 * Load saved consent preferences from localStorage
 * @returns {Object|null} - Saved consent object or null if not found
 */
function loadSavedConsent() {
    try {
        const saved = localStorage.getItem(CONSENT_STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error('Error loading saved consent:', error);
        return null;
    }
}

/**
 * Save consent preferences to localStorage
 * @param {Object} consent - Consent preferences object
 */
function saveConsent(consent) {
    try {
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
            ...consent,
            timestamp: new Date().toISOString()
        }));
        console.log('💾 Consent preferences saved to localStorage');
    } catch (error) {
        console.error('Error saving consent:', error);
    }
}

/**
 * Apply consent settings by pushing them to GTM's dataLayer
 * This is how we communicate the user's choice to Google Tag Manager
 *
 * @param {Object} consent - Object with consent values (granted/denied for each type)
 */
function applyConsent(consent) {
    // Use gtag to update consent - this was defined in the HTML <head>
    // gtag() pushes the consent update to the dataLayer
    // GTM reads this and adjusts tag behavior accordingly
    gtag('consent', 'update', {
        'ad_storage': consent.ad_storage || 'denied',
        'ad_user_data': consent.ad_user_data || 'denied',
        'ad_personalization': consent.ad_personalization || 'denied',
        'analytics_storage': consent.analytics_storage || 'denied',
        'functionality_storage': consent.functionality_storage || 'denied',
        'personalization_storage': consent.personalization_storage || 'denied'
        // security_storage is always 'granted' and set in the default
    });

    console.log('✅ Consent updated:', consent);

    // Push a custom event to dataLayer so GTM knows consent was updated
    // This can be used as a trigger in GTM
    window.dataLayer.push({
        'event': 'consent_updated',
        'consent_preferences': consent
    });
}

/**
 * Show the consent banner
 * Creates and displays the cookie consent UI
 */
function showConsentBanner() {
    // Check if banner already exists (avoid duplicates)
    if (document.getElementById('consent-banner')) return;

    // Create the banner HTML
    const banner = document.createElement('div');
    banner.id = 'consent-banner';
    banner.className = 'consent-banner';
    banner.innerHTML = `
        <div class="consent-banner-content">
            <div class="consent-banner-text">
                <h3>🍪 We Use Cookies</h3>
                <p>
                    This site uses cookies and tracking technologies to improve your experience
                    and analyze site usage. You can choose which types of cookies to allow.
                </p>
            </div>

            <div class="consent-banner-buttons">
                <button id="consent-accept-all" class="consent-btn consent-btn-primary">
                    Accept All
                </button>
                <button id="consent-reject-all" class="consent-btn consent-btn-secondary">
                    Reject All
                </button>
                <button id="consent-manage" class="consent-btn consent-btn-tertiary">
                    Manage Preferences
                </button>
            </div>

            <!-- Expandable preferences section (hidden by default) -->
            <div id="consent-preferences" class="consent-preferences" style="display: none;">
                <h4>Cookie Preferences</h4>
                <p class="consent-preferences-intro">
                    Choose which types of cookies you want to allow. You can change these settings at any time.
                </p>

                <!-- Analytics Cookies -->
                <div class="consent-preference-item">
                    <label class="consent-toggle">
                        <input type="checkbox" id="consent-analytics" data-consent-type="analytics_storage">
                        <span class="consent-toggle-slider"></span>
                    </label>
                    <div class="consent-preference-info">
                        <strong>Analytics Cookies</strong>
                        <p>
                            Help us understand how visitors interact with our website by collecting
                            and reporting information anonymously. Examples: Google Analytics.
                        </p>
                    </div>
                </div>

                <!-- Advertising Cookies -->
                <div class="consent-preference-item">
                    <label class="consent-toggle">
                        <input type="checkbox" id="consent-advertising" data-consent-type="ad_storage">
                        <span class="consent-toggle-slider"></span>
                    </label>
                    <div class="consent-preference-info">
                        <strong>Advertising Cookies</strong>
                        <p>
                            Used to make advertising messages more relevant to you. They perform functions
                            like preventing the same ad from continuously reappearing, ensuring ads display
                            properly, and in some cases selecting ads based on your interests.
                            <br><small>(Controls: ad_storage, ad_user_data, ad_personalization)</small>
                        </p>
                    </div>
                </div>

                <!-- Functionality Cookies -->
                <div class="consent-preference-item">
                    <label class="consent-toggle">
                        <input type="checkbox" id="consent-functionality" data-consent-type="functionality_storage">
                        <span class="consent-toggle-slider"></span>
                    </label>
                    <div class="consent-preference-info">
                        <strong>Functionality Cookies</strong>
                        <p>
                            Enable enhanced functionality and personalization, such as remembering your
                            language preference or region. These are often considered "necessary" for
                            basic site functionality.
                        </p>
                    </div>
                </div>

                <!-- Personalization Cookies -->
                <div class="consent-preference-item">
                    <label class="consent-toggle">
                        <input type="checkbox" id="consent-personalization" data-consent-type="personalization_storage">
                        <span class="consent-toggle-slider"></span>
                    </label>
                    <div class="consent-preference-info">
                        <strong>Personalization Cookies</strong>
                        <p>
                            Allow the website to remember choices you make (like username or language)
                            and provide enhanced, more personal features. Examples: video player
                            preferences, customized content recommendations.
                        </p>
                    </div>
                </div>

                <div class="consent-preferences-buttons">
                    <button id="consent-save-preferences" class="consent-btn consent-btn-primary">
                        Save My Preferences
                    </button>
                    <button id="consent-cancel" class="consent-btn consent-btn-tertiary">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add banner to the page
    document.body.appendChild(banner);

    // Attach event listeners to buttons
    attachConsentEventListeners();

    console.log('🎯 Consent banner displayed');
}

/**
 * Attach event listeners to consent banner buttons
 */
function attachConsentEventListeners() {
    // "Accept All" button - grant all consent types
    document.getElementById('consent-accept-all')?.addEventListener('click', () => {
        const allGranted = {
            ad_storage: 'granted',
            ad_user_data: 'granted',
            ad_personalization: 'granted',
            analytics_storage: 'granted',
            functionality_storage: 'granted',
            personalization_storage: 'granted'
        };

        applyConsent(allGranted);
        saveConsent(allGranted);
        hideConsentBanner();

        console.log('✅ User accepted all cookies');
    });

    // "Reject All" button - deny all consent types (keep security_storage granted)
    document.getElementById('consent-reject-all')?.addEventListener('click', () => {
        const allDenied = {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            functionality_storage: 'denied',
            personalization_storage: 'denied'
        };

        applyConsent(allDenied);
        saveConsent(allDenied);
        hideConsentBanner();

        console.log('❌ User rejected all cookies');
    });

    // "Manage Preferences" button - show expandable preferences section
    document.getElementById('consent-manage')?.addEventListener('click', () => {
        const prefsSection = document.getElementById('consent-preferences');
        if (prefsSection) {
            prefsSection.style.display = 'block';
            // Hide the main buttons when preferences are shown
            document.querySelector('.consent-banner-buttons').style.display = 'none';
        }
    });

    // "Save My Preferences" button - save custom choices
    document.getElementById('consent-save-preferences')?.addEventListener('click', () => {
        // Read the checkbox states
        const analyticsChecked = document.getElementById('consent-analytics')?.checked;
        const advertisingChecked = document.getElementById('consent-advertising')?.checked;
        const functionalityChecked = document.getElementById('consent-functionality')?.checked;
        const personalizationChecked = document.getElementById('consent-personalization')?.checked;

        // Build consent object based on user choices
        const customConsent = {
            analytics_storage: analyticsChecked ? 'granted' : 'denied',
            // Advertising checkbox controls 3 related consent types
            ad_storage: advertisingChecked ? 'granted' : 'denied',
            ad_user_data: advertisingChecked ? 'granted' : 'denied',
            ad_personalization: advertisingChecked ? 'granted' : 'denied',
            functionality_storage: functionalityChecked ? 'granted' : 'denied',
            personalization_storage: personalizationChecked ? 'granted' : 'denied'
        };

        applyConsent(customConsent);
        saveConsent(customConsent);
        hideConsentBanner();

        console.log('💾 User saved custom preferences:', customConsent);
    });

    // "Cancel" button - hide preferences and show main buttons again
    document.getElementById('consent-cancel')?.addEventListener('click', () => {
        document.getElementById('consent-preferences').style.display = 'none';
        document.querySelector('.consent-banner-buttons').style.display = 'flex';
    });
}

/**
 * Hide the consent banner
 */
function hideConsentBanner() {
    const banner = document.getElementById('consent-banner');
    if (banner) {
        // Fade out animation
        banner.style.opacity = '0';
        setTimeout(() => banner.remove(), 300);
    }
}

/**
 * Create the "Cookie Settings" button (fixed bottom-left corner)
 * This allows users to change their consent choice at any time
 */
function createCookieSettingsButton() {
    // Check if button already exists
    if (document.getElementById('cookie-settings-btn')) return;

    const button = document.createElement('button');
    button.id = 'cookie-settings-btn';
    button.className = 'cookie-settings-btn';
    button.innerHTML = '🍪 Cookie Settings';

    // When clicked, show the consent banner again
    button.addEventListener('click', () => {
        // Load current preferences and pre-check the boxes
        const saved = loadSavedConsent();
        showConsentBanner();

        // If there are saved preferences, pre-populate the checkboxes
        if (saved) {
            setTimeout(() => {
                document.getElementById('consent-analytics').checked = saved.analytics_storage === 'granted';
                document.getElementById('consent-advertising').checked = saved.ad_storage === 'granted';
                document.getElementById('consent-functionality').checked = saved.functionality_storage === 'granted';
                document.getElementById('consent-personalization').checked = saved.personalization_storage === 'granted';

                // Auto-open the preferences section
                document.getElementById('consent-manage')?.click();
            }, 100);
        }
    });

    document.body.appendChild(button);
}

// Export functions for debugging purposes (accessible via browser console)
window.consentDebug = {
    loadSaved: loadSavedConsent,
    apply: applyConsent,
    save: saveConsent,
    showBanner: showConsentBanner,
    reset: () => {
        localStorage.removeItem(CONSENT_STORAGE_KEY);
        console.log('🔄 Consent preferences reset - reload page to see banner');
    }
};

console.log('🔐 Consent.js loaded - use window.consentDebug for manual testing');
