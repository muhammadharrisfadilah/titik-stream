// ===== SERVICE WORKER REGISTRATION =====
// Register our custom SW (sw-app.js) while avoiding conflict with Monetag's sw.js

(function() {
    'use strict';
    
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
        console.warn('[SW] Service Workers not supported');
        return;
    }
    
    // Wait for page load
    window.addEventListener('load', async () => {
        try {
            console.log('[SW] Registering sw-app.js...');
            
            // Register our service worker
            const registration = await navigator.serviceWorker.register('sw-app.js', {
                scope: '/'
            });
            
            console.log('✅ [SW] Registered successfully:', registration.scope);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('[SW] Update found, new SW installing...');
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('[SW] New version available! Refresh to update.');
                        
                        // Optional: Show update notification to user
                        if (window.IndexHelpers && window.IndexHelpers.showToast) {
                            window.IndexHelpers.showToast('New version available! Refresh to update.', 'info');
                        }
                        
                        // Auto-activate new SW after 3 seconds
                        setTimeout(() => {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }, 3000);
                    }
                });
            });
            
            // Listen for controller change (new SW activated)
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('[SW] Controller changed, reloading page...');
                window.location.reload();
            });
            
            // Periodic update check (every 1 hour)
            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000);
            
        } catch (error) {
            console.error('❌ [SW] Registration failed:', error);
        }
    });
    
    // Unregister Monetag's sw.js if it conflicts
    // (Only if you're having issues - otherwise leave it alone)
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
            // Check scope to avoid unregistering our own SW
            if (registration.active && registration.active.scriptURL.includes('sw.js')) {
                console.log('[SW] Found Monetag sw.js:', registration.scope);
                // Don't unregister - let it coexist
            }
        });
    });
    
})();