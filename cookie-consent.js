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
                    <button type="button" id="cookieAcceptAll" class="cookie-btn cookie-btn-accept" aria-label="Accept all cookies">
                        Accept All
                    </button>
                    <button type="button" id="cookieAcceptEssential" class="cookie-btn cookie-btn-essential" aria-label="Accept essential cookies only">
                        Essential Only
                    </button>
                    <button type="button" id="cookieDecline" class="cookie-btn cookie-btn-decline" aria-label="Decline cookies">
                        Decline
                    </button>
                </div>
            </div>
        `;

        // Add banner to body
        document.body.appendChild(banner);

        // Wait for DOM to be ready, then setup listeners
        setTimeout(function() {
            setupCookieListeners(banner);
        }, 10);
    }

    // Setup event listeners for cookie consent buttons
    function setupCookieListeners(banner) {
        // Get buttons directly from the banner element
        const acceptAllBtn = banner.querySelector('#cookieAcceptAll');
        const acceptEssentialBtn = banner.querySelector('#cookieAcceptEssential');
        const declineBtn = banner.querySelector('#cookieDecline');

        // Direct event listeners on each button using addEventListener for better reliability
        if (acceptAllBtn) {
            // Remove any existing listeners
            acceptAllBtn.replaceWith(acceptAllBtn.cloneNode(true));
            const newAcceptBtn = banner.querySelector('#cookieAcceptAll');
            newAcceptBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('Accept All button clicked');
                acceptCookies('all');
                hideBanner(banner);
                return false;
            }, { once: true }); // Only fire once
        }

        if (acceptEssentialBtn) {
            acceptEssentialBtn.replaceWith(acceptEssentialBtn.cloneNode(true));
            const newEssentialBtn = banner.querySelector('#cookieAcceptEssential');
            newEssentialBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('Essential Only button clicked');
                acceptCookies('essential');
                hideBanner(banner);
                return false;
            }, { once: true });
        }

        if (declineBtn) {
            declineBtn.replaceWith(declineBtn.cloneNode(true));
            const newDeclineBtn = banner.querySelector('#cookieDecline');
            newDeclineBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('Decline button clicked');
                declineCookies();
                hideBanner(banner);
                return false;
            }, { once: true });
        }
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
        console.log('hideBanner called', banner);
        
        // Find banner if not provided
        if (!banner) {
            banner = document.getElementById('cookieConsentBanner');
        }
        
        if (!banner) {
            console.warn('Banner not found to hide');
            return;
        }
        
        // Prevent multiple clicks from trying to hide multiple times
        if (banner.classList.contains('cookie-consent-banner-hiding') || banner.style.display === 'none') {
            console.log('Banner already hiding');
            return; // Already hiding
        }
        
        console.log('Starting banner hide animation');
        
        // Add hiding class for animation
        banner.classList.add('cookie-consent-banner-hiding');
        
        // Immediately hide it visually
        banner.style.opacity = '0';
        banner.style.pointerEvents = 'none';
        banner.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
        
        // Remove banner from DOM after a short delay
        setTimeout(function() {
            try {
                const bannerToRemove = document.getElementById('cookieConsentBanner');
                if (bannerToRemove) {
                    console.log('Removing banner from DOM');
                    
                    // Add final transform to slide it down
                    bannerToRemove.style.transform = 'translateY(100%)';
                    
                    // Wait a bit more then remove
                    setTimeout(function() {
                        try {
                            const finalBanner = document.getElementById('cookieConsentBanner');
                            if (finalBanner) {
                                if (finalBanner.remove) {
                                    finalBanner.remove();
                                } else if (finalBanner.parentNode) {
                                    finalBanner.parentNode.removeChild(finalBanner);
                                }
                                console.log('Banner removed successfully');
                            }
                        } catch (err) {
                            console.error('Error in final removal:', err);
                            // Last resort - hide with CSS
                            const fallbackBanner = document.getElementById('cookieConsentBanner');
                            if (fallbackBanner) {
                                fallbackBanner.style.display = 'none';
                                fallbackBanner.style.visibility = 'hidden';
                                fallbackBanner.style.position = 'fixed';
                                fallbackBanner.style.bottom = '-1000px';
                            }
                        }
                    }, 50);
                } else {
                    console.log('Banner already removed');
                }
            } catch (e) {
                console.error('Error removing cookie banner:', e);
                // Final fallback: just hide it with CSS
                const bannerFallback = document.getElementById('cookieConsentBanner');
                if (bannerFallback) {
                    bannerFallback.style.display = 'none';
                    bannerFallback.style.visibility = 'hidden';
                    bannerFallback.style.position = 'fixed';
                    bannerFallback.style.bottom = '-1000px';
                }
            }
        }, 300); // Wait for animation to start
    }

    // Initialize AdSense if consent given
    function initializeAdSense() {
        // Check if AdSense script is already loaded
        if (typeof adsbygoogle === 'undefined') {
            console.log('AdSense script not loaded yet');
            return;
        }

        // Only initialize ads for visible ad containers
        // Check if any ad containers are visible before initializing
        const adContainers = document.querySelectorAll('.ad-container');
        let hasVisibleAds = false;

        adContainers.forEach(function(container) {
            const style = window.getComputedStyle(container);
            const isVisible = style.display !== 'none' && 
                             style.visibility !== 'hidden' && 
                             container.offsetWidth > 0 &&
                             container.offsetHeight > 0;

            if (isVisible) {
                hasVisibleAds = true;
                // Initialize only this visible ad container
                const adUnit = container.querySelector('ins.adsbygoogle');
                if (adUnit) {
                    try {
                        (adsbygoogle = window.adsbygoogle || []).push({});
                        console.log('AdSense initialized for visible ad container');
                    } catch (e) {
                        console.error('Error initializing AdSense for ad unit:', e);
                    }
                }
            }
        });

        if (!hasVisibleAds) {
            console.log('No visible ad containers found. AdSense initialization skipped.');
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
        initializeAdSense: initializeAdSense,
        reset: function() {
            localStorage.removeItem(COOKIE_CONSENT_KEY);
            createCookieBanner();
        }
    };

    // Initialize
    init();
})();



