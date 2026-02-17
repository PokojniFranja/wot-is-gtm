/**
 * ============================================================================
 * GTM DEBUG DASHBOARD
 * ============================================================================
 *
 * A learning tool that helps you understand what GTM is doing in real-time.
 *
 * FEATURES:
 * 1. Consent State Monitor - Shows current consent values (granted/denied)
 * 2. Cookie Inspector - Lists all cookies with details, auto-refreshes
 * 3. dataLayer Logger - Shows all dataLayer pushes in chronological order
 * 4. Testing Tools - Reset consent, clear cookies
 *
 * This is purely a CLIENT-SIDE debugging tool - it reads from:
 * - document.cookie (for cookie inspection)
 * - window.dataLayer (for event tracking)
 * - localStorage (for saved consent)
 *
 * LEARNING OBJECTIVES:
 * - Understand what consent state means
 * - See which cookies are actually set
 * - Watch dataLayer events happen in real-time
 * - Test different consent scenarios
 */

(function initializeDebugDashboard() {
    console.log('🐛 Debug Dashboard initializing...');

    // Create the floating "GTM Debug" button
    createDebugButton();

    // Monitor dataLayer for changes
    monitorDataLayer();

    console.log('🐛 Debug Dashboard ready - click "GTM Debug" button to open');
})();

/**
 * Create the floating "GTM Debug" button (bottom-right corner)
 */
function createDebugButton() {
    const button = document.createElement('button');
    button.id = 'gtm-debug-btn';
    button.className = 'gtm-debug-btn';
    button.innerHTML = '🔍 GTM Debug';

    button.addEventListener('click', toggleDebugPanel);

    document.body.appendChild(button);
}

/**
 * Toggle the debug panel visibility
 */
function toggleDebugPanel() {
    let panel = document.getElementById('gtm-debug-panel');

    if (panel) {
        // Panel exists - toggle visibility
        const isVisible = panel.style.display !== 'none';
        panel.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            // Panel was just opened - refresh all data
            updateDebugPanel();
        }
    } else {
        // Panel doesn't exist - create it
        createDebugPanel();
    }
}

/**
 * Create the debug panel UI
 */
function createDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'gtm-debug-panel';
    panel.className = 'gtm-debug-panel';
    panel.innerHTML = `
        <div class="gtm-debug-header">
            <h2>🔍 GTM Debug Dashboard</h2>
            <button id="gtm-debug-close" class="gtm-debug-close">✕</button>
        </div>

        <div class="gtm-debug-content">
            <!-- CONSENT STATE SECTION -->
            <div class="gtm-debug-section">
                <h3>🔐 Consent State</h3>
                <p class="gtm-debug-help">
                    Shows the current consent status for each category.
                    <span class="status-granted">Green = Granted</span>,
                    <span class="status-denied">Red = Denied</span>
                </p>
                <div id="consent-state-display" class="consent-state-grid">
                    <!-- Will be populated by updateConsentDisplay() -->
                </div>
            </div>

            <!-- COOKIES SECTION -->
            <div class="gtm-debug-section">
                <h3>🍪 Cookies</h3>
                <p class="gtm-debug-help">
                    All cookies currently set in your browser. Auto-refreshes every 2 seconds.
                    Look for "_ga" cookies (Google Analytics) after granting analytics consent.
                </p>
                <div class="gtm-debug-actions">
                    <button id="clear-all-cookies" class="gtm-debug-btn-small gtm-debug-btn-danger">
                        Clear All Cookies
                    </button>
                    <button id="refresh-cookies" class="gtm-debug-btn-small">
                        Refresh Now
                    </button>
                </div>
                <div id="cookies-display" class="cookies-list">
                    <!-- Will be populated by updateCookiesDisplay() -->
                </div>
            </div>

            <!-- DATALAYER SECTION -->
            <div class="gtm-debug-section">
                <h3>📊 dataLayer Events</h3>
                <p class="gtm-debug-help">
                    Live log of all events pushed to the dataLayer. Most recent at the top.
                    Watch this as you interact with the page!
                </p>
                <div class="gtm-debug-actions">
                    <button id="clear-datalayer-log" class="gtm-debug-btn-small">
                        Clear Log
                    </button>
                </div>
                <div id="datalayer-display" class="datalayer-log">
                    <!-- Will be populated by dataLayer monitoring -->
                </div>
            </div>

            <!-- TESTING TOOLS SECTION -->
            <div class="gtm-debug-section">
                <h3>🧪 Testing Tools</h3>
                <p class="gtm-debug-help">
                    Tools to help you test different consent scenarios and cookie behavior.
                </p>
                <div class="gtm-debug-actions">
                    <button id="reset-consent" class="gtm-debug-btn-small gtm-debug-btn-warning">
                        Reset Consent & Reload
                    </button>
                    <button id="view-localstorage" class="gtm-debug-btn-small">
                        View localStorage
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(panel);

    // Attach event listeners
    document.getElementById('gtm-debug-close').addEventListener('click', () => {
        panel.style.display = 'none';
    });

    document.getElementById('clear-all-cookies').addEventListener('click', clearAllCookies);
    document.getElementById('refresh-cookies').addEventListener('click', updateCookiesDisplay);
    document.getElementById('clear-datalayer-log').addEventListener('click', clearDataLayerLog);
    document.getElementById('reset-consent').addEventListener('click', resetConsent);
    document.getElementById('view-localstorage').addEventListener('click', viewLocalStorage);

    // Initial data population
    updateDebugPanel();

    // Auto-refresh cookies every 2 seconds
    setInterval(updateCookiesDisplay, 2000);
}

/**
 * Update all sections of the debug panel
 */
function updateDebugPanel() {
    updateConsentDisplay();
    updateCookiesDisplay();
    // dataLayer is updated in real-time via monitoring
}

/**
 * ============================================================================
 * CONSENT STATE DISPLAY
 * ============================================================================
 */

/**
 * Update the consent state display
 * Reads the current consent values from dataLayer or localStorage
 */
function updateConsentDisplay() {
    const display = document.getElementById('consent-state-display');
    if (!display) return;

    // Try to get saved consent from localStorage
    let consentState = {};
    try {
        const saved = localStorage.getItem('gtm_consent_preferences');
        if (saved) {
            consentState = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error reading consent from localStorage:', e);
    }

    // Default consent types to check
    const consentTypes = [
        { key: 'analytics_storage', label: 'Analytics Storage', icon: '📊' },
        { key: 'ad_storage', label: 'Ad Storage', icon: '📢' },
        { key: 'ad_user_data', label: 'Ad User Data', icon: '👤' },
        { key: 'ad_personalization', label: 'Ad Personalization', icon: '🎯' },
        { key: 'functionality_storage', label: 'Functionality Storage', icon: '⚙️' },
        { key: 'personalization_storage', label: 'Personalization Storage', icon: '✨' },
        { key: 'security_storage', label: 'Security Storage', icon: '🔒' }
    ];

    let html = '';
    consentTypes.forEach(type => {
        // Get value from saved consent, default to 'denied' (except security)
        let value = consentState[type.key] || (type.key === 'security_storage' ? 'granted' : 'denied');
        const statusClass = value === 'granted' ? 'status-granted' : 'status-denied';

        html += `
            <div class="consent-state-item ${statusClass}">
                <span class="consent-icon">${type.icon}</span>
                <div class="consent-state-info">
                    <strong>${type.label}</strong>
                    <span class="consent-value">${value}</span>
                </div>
            </div>
        `;
    });

    display.innerHTML = html || '<p class="gtm-debug-empty">No consent state found (using defaults)</p>';
}

/**
 * ============================================================================
 * COOKIES DISPLAY
 * ============================================================================
 */

/**
 * Update the cookies display
 * Reads all cookies from document.cookie and parses them
 */
function updateCookiesDisplay() {
    const display = document.getElementById('cookies-display');
    if (!display) return;

    const cookies = getAllCookies();

    if (cookies.length === 0) {
        display.innerHTML = '<p class="gtm-debug-empty">No cookies set</p>';
        return;
    }

    let html = '<div class="cookies-table">';
    html += `
        <div class="cookies-table-header">
            <div>Name</div>
            <div>Value</div>
            <div>Info</div>
        </div>
    `;

    cookies.forEach(cookie => {
        // Truncate long values
        const displayValue = cookie.value.length > 40
            ? cookie.value.substring(0, 40) + '...'
            : cookie.value;

        html += `
            <div class="cookies-table-row">
                <div class="cookie-name">
                    ${highlightGACookies(cookie.name)}
                </div>
                <div class="cookie-value" title="${escapeHtml(cookie.value)}">
                    <code>${escapeHtml(displayValue)}</code>
                </div>
                <div class="cookie-info">
                    <small>Size: ${cookie.value.length} chars</small>
                </div>
            </div>
        `;
    });

    html += '</div>';
    display.innerHTML = html;
}

/**
 * Get all cookies as an array of objects
 * @returns {Array} Array of cookie objects
 */
function getAllCookies() {
    const cookies = document.cookie.split(';');
    const result = [];

    cookies.forEach(cookie => {
        const parts = cookie.trim().split('=');
        if (parts[0]) {
            result.push({
                name: parts[0],
                value: parts.slice(1).join('=') || '' // Handle values with '=' in them
            });
        }
    });

    return result;
}

/**
 * Highlight Google Analytics cookies in the display
 * @param {string} name - Cookie name
 * @returns {string} - HTML with highlighting
 */
function highlightGACookies(name) {
    if (name.startsWith('_ga')) {
        return `<strong style="color: #4285f4;">${escapeHtml(name)}</strong> <small>(GA4)</small>`;
    }
    return escapeHtml(name);
}

/**
 * Clear all cookies (for testing purposes)
 * WARNING: This will clear ALL cookies, including those not set by GTM
 */
function clearAllCookies() {
    if (!confirm('This will delete ALL cookies. Continue?')) return;

    const cookies = getAllCookies();
    let cleared = 0;

    cookies.forEach(cookie => {
        // Try to delete cookie with various path/domain combinations
        // Cookies can be path-specific, so we try multiple paths
        const paths = ['/', '', window.location.pathname];
        paths.forEach(path => {
            document.cookie = `${cookie.name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
        });
        cleared++;
    });

    console.log(`🗑️ Cleared ${cleared} cookies`);
    alert(`Cleared ${cleared} cookies. Some cookies may persist due to different paths/domains.`);
    updateCookiesDisplay();
}

/**
 * ============================================================================
 * DATALAYER MONITORING
 * ============================================================================
 */

// Keep track of dataLayer events we've already logged
let dataLayerLoggedCount = 0;

/**
 * Monitor the dataLayer for new events
 * Uses a setInterval to check for new items
 */
function monitorDataLayer() {
    // Check for new dataLayer items every 500ms
    setInterval(() => {
        const dataLayer = window.dataLayer || [];

        // Check if there are new items we haven't logged yet
        if (dataLayer.length > dataLayerLoggedCount) {
            // Get the new items
            const newItems = dataLayer.slice(dataLayerLoggedCount);
            newItems.forEach(item => logDataLayerEvent(item));
            dataLayerLoggedCount = dataLayer.length;
        }
    }, 500);
}

/**
 * Log a dataLayer event to the debug panel
 * @param {Object} event - dataLayer event object
 */
function logDataLayerEvent(event) {
    const display = document.getElementById('datalayer-display');
    if (!display) return;

    // Remove "empty" message if it exists
    const emptyMsg = display.querySelector('.gtm-debug-empty');
    if (emptyMsg) emptyMsg.remove();

    // Create event entry
    const entry = document.createElement('div');
    entry.className = 'datalayer-event';

    const timestamp = new Date().toLocaleTimeString();
    const eventName = event.event || '(no event name)';
    const isImportant = ['consent_updated', 'gtm.js', 'gtm.load'].includes(event.event);

    if (isImportant) {
        entry.classList.add('datalayer-event-important');
    }

    entry.innerHTML = `
        <div class="datalayer-event-header">
            <strong>${escapeHtml(eventName)}</strong>
            <span class="datalayer-timestamp">${timestamp}</span>
        </div>
        <pre class="datalayer-event-data">${JSON.stringify(event, null, 2)}</pre>
    `;

    // Add to top of log (most recent first)
    display.insertBefore(entry, display.firstChild);

    // Limit log to 20 most recent events to avoid performance issues
    const events = display.querySelectorAll('.datalayer-event');
    if (events.length > 20) {
        events[events.length - 1].remove();
    }
}

/**
 * Clear the dataLayer log display
 */
function clearDataLayerLog() {
    const display = document.getElementById('datalayer-display');
    if (display) {
        display.innerHTML = '<p class="gtm-debug-empty">Log cleared. New events will appear here.</p>';
    }
}

/**
 * ============================================================================
 * TESTING TOOLS
 * ============================================================================
 */

/**
 * Reset consent preferences and reload the page
 */
function resetConsent() {
    if (!confirm('This will reset your consent preferences and reload the page. Continue?')) return;

    // Clear consent from localStorage
    localStorage.removeItem('gtm_consent_preferences');

    console.log('🔄 Consent reset - reloading page...');

    // Reload page to show consent banner again
    window.location.reload();
}

/**
 * View localStorage contents
 */
function viewLocalStorage() {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        items.push({ key, value });
    }

    console.log('📦 localStorage contents:', items);
    alert(`localStorage has ${items.length} items. Check the console for details.`);
}

/**
 * ============================================================================
 * UTILITY FUNCTIONS
 * ============================================================================
 */

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Export debug functions for console access
window.gtmDebug = {
    openPanel: toggleDebugPanel,
    updateConsent: updateConsentDisplay,
    updateCookies: updateCookiesDisplay,
    clearCookies: clearAllCookies,
    resetConsent: resetConsent,
    viewStorage: viewLocalStorage
};

console.log('🐛 Debug.js loaded - use window.gtmDebug for manual control');
