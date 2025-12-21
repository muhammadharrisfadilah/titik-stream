// ===== CACHE SERVICE =====

const IndexCacheService = {
    memoryCache: new Map(),
    
    // Set cache with TTL
    set(key, data, ttl = IndexConfig.cache.MATCHES_TTL) {
        const item = {
            data,
            expires: Date.now() + ttl,
            timestamp: Date.now()
        };
        
        // Store in memory
        this.memoryCache.set(key, item);
        
        // Store in localStorage
        try {
            localStorage.setItem(`ts_${key}`, JSON.stringify(item));
        } catch (e) {
            IndexConfig.log.warn('LocalStorage error:', e);
            this.clearOldItems();
        }
    },
    
    // Get from cache
    get(key) {
        // Check memory first
        const memoryItem = this.memoryCache.get(key);
        if (memoryItem && memoryItem.expires > Date.now()) {
            return memoryItem.data;
        }
        
        // Check localStorage
        try {
            const stored = localStorage.getItem(`ts_${key}`);
            if (stored) {
                const item = JSON.parse(stored);
                if (item.expires > Date.now()) {
                    this.memoryCache.set(key, item);
                    return item.data;
                } else {
                    localStorage.removeItem(`ts_${key}`);
                }
            }
        } catch (e) {
            IndexConfig.log.warn('Cache read error:', e);
        }
        
        return null;
    },
    
    // Clear specific cache
    clear(key) {
        this.memoryCache.delete(key);
        
        try {
            localStorage.removeItem(`ts_${key}`);
        } catch (e) {
            IndexConfig.log.warn('Cache clear error:', e);
        }
    },
    
    // Clear old items
    clearOldItems() {
        try {
            const keys = Object.keys(localStorage).filter(key => key.startsWith('ts_'));
            
            keys.forEach(key => {
                try {
                    const item = JSON.parse(localStorage.getItem(key));
                    if (item && item.expires < Date.now()) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            IndexConfig.log.warn('Clear old items error:', e);
        }
    },
    
    // Clear all cache
    clearAll() {
        this.memoryCache.clear();
        
        try {
            const keys = Object.keys(localStorage).filter(key => key.startsWith('ts_'));
            keys.forEach(key => localStorage.removeItem(key));
        } catch (e) {
            IndexConfig.log.warn('Clear all error:', e);
        }
    },
    
    // Get all cache keys
    getAllKeys() {
        try {
            return Object.keys(localStorage).filter(key => key.startsWith('ts_'));
        } catch (e) {
            return [];
        }
    },
    
    // Get cache stats
    getStats() {
        const keys = this.getAllKeys();
        let totalSize = 0;
        let validItems = 0;
        let expiredItems = 0;
        
        keys.forEach(key => {
            try {
                const item = localStorage.getItem(key);
                totalSize += item.length;
                
                const parsed = JSON.parse(item);
                if (parsed.expires > Date.now()) {
                    validItems++;
                } else {
                    expiredItems++;
                }
            } catch (e) {
                // Ignore
            }
        });
        
        return {
            totalKeys: keys.length,
            validItems,
            expiredItems,
            totalSize: `${(totalSize / 1024).toFixed(2)} KB`
        };
    }
};

// Make service globally available
window.IndexCacheService = IndexCacheService;