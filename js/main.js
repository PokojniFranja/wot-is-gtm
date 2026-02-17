/**
 * Main JavaScript File
 *
 * This file contains shared functionality across all pages.
 * Keep it simple and well-commented for learning purposes.
 */

// Wait for DOM to be fully loaded before running scripts
document.addEventListener('DOMContentLoaded', function() {

    // Highlight active navigation link based on current page
    highlightActiveNavLink();

    // Log page load for debugging (we'll use this to understand dataLayer later)
    console.log('Page loaded:', document.title);
});

/**
 * Highlight the active navigation link
 * This helps users know which page they're currently on
 */
function highlightActiveNavLink() {
    // Get current page filename
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Find all navigation links
    const navLinks = document.querySelectorAll('nav a');

    // Loop through links and add 'active' class to the matching one
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
}

/**
 * Utility function to show/hide elements
 * @param {string} elementId - The ID of the element to toggle
 */
function toggleElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * Simple notification/toast message
 * Useful for showing feedback to users (form submissions, etc.)
 * @param {string} message - The message to display
 */
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
