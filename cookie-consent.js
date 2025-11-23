/**
 * Cookie Consent Banner for AdSense Compliance
 * Complies with GDPR, CCPA, and Google AdSense requirements
 */

(function() {
    'use strict';

    // Cookie consent settings
    const COOKIE_CONSENT_KEY = 'cookie_consent';
    const COOKIE_CONSENT_EXPIRY_DAYS = 365;

    // Create cookie consent banner
    function createCookieBanner() {
        // Check if consent has already been given
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (consent) {
            try {
                const consentData = JSON.parse(consent);
                // Check if consent is valid and not expired
                if (consentData.status && (consentData.status === 'accepted' || consentData.status === 'essential' || consentData.status === 'declined')) {
                    const expiryDate = new Date(consentData.expiry);
                    if (new Date() <= expiryDate) {
                        return; // Don't show banner if valid consent already exists
                    }
                }
            } catch (e) {
                // If parsing fails, continue to show banner
            }
        }

        // Create banner element
        const banner = document.createElement('div');
        banner.id = 'cookieConsentBanner';
        banner.className = 'cookie-consent-banner';
        banner.setAttribute('role', 'alert');
        banner.setAttribute('aria-live', 'polite');

        banner.innerHTML = `
            <div class="cookie-consent-content">
                <div class="cookie-consent-text">
                    <h4>🍪 Cookie Consent</h4>
                    <p>We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. We also use Google AdSense to show relevant advertisements. 
                    <a href="privacy-policy.html#cookie-policy" target="_blank">Learn more about our Cookie Policy</a>.</p>
                </div>
                <div class="cookie-consent-actions">
                    <button id="cookieAcceptAll" class="cookie-btn cookie-btn-accept" aria-label="Accept all cookies">
                        Accept All
                    </button>
                    <button id="cookieAcceptEssential" class="cookie-btn cookie-btn-essential" aria-label="Accept essential cookies only">
                        Essential Only
                    </button>
                    <button id="cookieDecline" class="cookie-btn cookie-btn-decline" aria-label="Decline cookies">
                        Decline
                    </button>
                </div>
            </div>
        `;

        // Add banner to body
        document.body.appendChild(banner);

        // Add event listeners using event delegation for reliability
        setupCookieListeners(banner);
    }

    // Setup event listeners for cookie consent buttons using event delegation
    function setupCookieListeners(banner) {
        // Use event delegation - attach listener to banner and check which button was clicked
        banner.addEventListener('click', function(e) {
            const target = e.target;
            
            // Check if clicked element is a button or inside a button
            if (target.id === 'cookieAcceptAll' || target.closest('#cookieAcceptAll')) {
                e.preventDefault();
                e.stopPropagation();
                acceptCookies('all');
                hideBanner(banner);
                return false;
            } else if (target.id === 'cookieAcceptEssential' || target.closest('#cookieAcceptEssential')) {
                e.preventDefault();
                e.stopPropagation();
                acceptCookies('essential');
                hideBanner(banner);
                return false;
            } else if (target.id === 'cookieDecline' || target.closest('#cookieDecline')) {
                e.preventDefault();
                e.stopPropagation();
                declineCookies();
                hideBanner(banner);
                return false;
            }
        });
    }

    // Accept cookies
    function acceptCookies(type) {
        const consentData = {
            status: type === 'all' ? 'accepted' : 'essential',
            timestamp: new Date().toISOString(),
            expiry: new Date(Date.now() + COOKIE_CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()
        };

        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));

        // If user accepted all cookies, we can initialize AdSense
        if (type === 'all') {
            initializeAdSense();
        }

        // Dispatch custom event for other scripts
        window.dispatchEvent(new CustomEvent('cookieConsentChanged', {
            detail: { type: type }
        }));
    }

    // Decline cookies (only essential cookies)
    function declineCookies() {
        const consentData = {
            status: 'declined',
            timestamp: new Date().toISOString(),
            expiry: new Date(Date.now() + COOKIE_CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()
        };

        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));

        // Disable non-essential cookies/ads
        disableNonEssentialCookies();

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('cookieConsentChanged', {
            detail: { type: 'declined' }
        }));
    }

    // Hide banner with animation
    function hideBanner(banner) {
        if (!banner) {
            // Try to find banner by ID if not provided
            banner = document.getElementById('cookieConsentBanner');
            if (!banner) return;
        }
        
        // Prevent multiple clicks from trying to hide multiple times
        if (banner.classList.contains('cookie-consent-banner-hiding')) {
            return; // Already hiding
        }
        
        // Add hiding class for animation
        banner.classList.add('cookie-consent-banner-hiding');
        
        // Remove banner after animation completes
        setTimeout(function() {
            try {
                // Try multiple methods to ensure removal
                const bannerToRemove = document.getElementById('cookieConsentBanner');
                if (bannerToRemove) {
                    if (bannerToRemove.parentNode) {
                        bannerToRemove.parentNode.removeChild(bannerToRemove);
                    } else {
                        bannerToRemove.remove();
                    }
                }
            } catch (e) {
                console.error('Error removing cookie banner:', e);
                // Fallback: just hide it with CSS
                const bannerFallback = document.getElementById('cookieConsentBanner');
                if (bannerFallback) {
                    bannerFallback.style.display = 'none';
                }
            }
        }, 350); // Slightly longer than animation duration (300ms)
    }

    // Initialize AdSense if consent given
    function initializeAdSense() {
        // Check if AdSense script is already loaded
        if (typeof adsbygoogle !== 'undefined') {
            // Push ad units to initialize
            (adsbygoogle = window.adsbygoogle || []).push({});
        }
    }

    // Disable non-essential cookies/ads
    function disableNonEssentialCookies() {
        // This would typically disable analytics and advertising cookies
        // For now, we'll just ensure ads are hidden
        const adContainers = document.querySelectorAll('.ad-container');
        adContainers.forEach(function(container) {
            container.style.display = 'none';
        });
    }

    // Check cookie consent status
    function getCookieConsent() {
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!consent) {
            return null;
        }

        try {
            const consentData = JSON.parse(consent);
            // Check if consent has expired
            const expiryDate = new Date(consentData.expiry);
            if (new Date() > expiryDate) {
                localStorage.removeItem(COOKIE_CONSENT_KEY);
                return null;
            }
            return consentData.status;
        } catch (e) {
            return null;
        }
    }

    // Initialize on page load
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createCookieBanner);
        } else {
            createCookieBanner();
        }
    }

    // Expose public API
    window.CookieConsent = {
        accept: acceptCookies,
        decline: declineCookies,
        getStatus: getCookieConsent,
        reset: function() {
            localStorage.removeItem(COOKIE_CONSENT_KEY);
            createCookieBanner();
        }
    };

    // Initialize
    init();
})();



