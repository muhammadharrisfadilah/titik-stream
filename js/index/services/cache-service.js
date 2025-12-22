// ===== IMPROVED CACHE SERVICE - IndexedDB + Memory =====

const IndexCacheService = {
    db: null,
    memoryCache: new Map(),
    DB_NAME: 'TitikSportsCache',
    DB_VERSION: 1,
    STORE_NAME: 'matchData',
    
    // Initialize IndexedDB
    async init() {
        if (this.db) return true;
        
        // Check if IndexedDB is supported
        if (!window.indexedDB) {
            console.warn('IndexedDB not supported, falling back to memory-only cache');
            return false;
        }
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                resolve(false); // Fallback to memory cache
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ IndexedDB initialized');
                
                // Clean expired items on init
                this.cleanExpired();
                resolve(true);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const objectStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
                    objectStore.createIndex('expires', 'expires', { unique: false });
                    console.log('IndexedDB store created');
                }
            };
        });
    },
    
    // Set cache (dual layer: memory + IndexedDB)
    async set(key, data, ttl = 5 * 60 * 1000) {
        const item = {
            key,
            data,
            expires: Date.now() + ttl,
            timestamp: Date.now()
        };
        
        // Always store in memory cache for fast access
        this.memoryCache.set(key, item);
        
        // Store in IndexedDB if available
        if (this.db) {
            try {
                const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                store.put(item);
                
                return new Promise((resolve) => {
                    transaction.oncomplete = () => resolve(true);
                    transaction.onerror = () => {
                        console.warn('IndexedDB write failed, using memory only');
                        resolve(true); // Still succeed with memory cache
                    };
                });
            } catch (error) {
                console.warn('IndexedDB error:', error);
            }
        }
        
        // Fallback: Try localStorage with size limit
        try {
            // Only store small data in localStorage (< 500KB)
            const dataStr = JSON.stringify(item);
            if (dataStr.length < 500000) { // 500KB limit
                localStorage.setItem(`ts_${key}`, dataStr);
            }
        } catch (e) {
            // Quota exceeded or localStorage disabled - that's okay
            console.log('localStorage unavailable, using memory cache only');
        }
        
        return true;
    },
    
    // Get from cache (memory first, then IndexedDB)
    async get(key) {
        const now = Date.now();
        
        // Check memory cache first (fastest)
        const memItem = this.memoryCache.get(key);
        if (memItem && memItem.expires > now) {
            return memItem.data;
        }
        
        // Check IndexedDB
        if (this.db) {
            try {
                const item = await new Promise((resolve, reject) => {
                    const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
                    const store = transaction.objectStore(this.STORE_NAME);
                    const request = store.get(key);
                    
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
                
                if (item && item.expires > now) {
                    // Restore to memory cache
                    this.memoryCache.set(key, item);
                    return item.data;
                } else if (item) {
                    // Expired, delete it
                    this.delete(key);
                }
            } catch (error) {
                console.warn('IndexedDB read error:', error);
            }
        }
        
        // Fallback: Check localStorage
        try {
            const stored = localStorage.getItem(`ts_${key}`);
            if (stored) {
                const item = JSON.parse(stored);
                if (item.expires > now) {
                    this.memoryCache.set(key, item);
                    return item.data;
                } else {
                    localStorage.removeItem(`ts_${key}`);
                }
            }
        } catch (e) {
            // localStorage error - ignore
        }
        
        return null;
    },
    
    // Delete specific cache
    async delete(key) {
        // Remove from memory
        this.memoryCache.delete(key);
        
        // Remove from IndexedDB
        if (this.db) {
            try {
                const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                store.delete(key);
            } catch (error) {
                console.warn('IndexedDB delete error:', error);
            }
        }
        
        // Remove from localStorage
        try {
            localStorage.removeItem(`ts_${key}`);
        } catch (e) {
            // Ignore
        }
    },
    
    // Clean expired items
    async cleanExpired() {
        const now = Date.now();
        
        // Clean memory cache
        for (const [key, item] of this.memoryCache.entries()) {
            if (item.expires < now) {
                this.memoryCache.delete(key);
            }
        }
        
        // Clean IndexedDB
        if (this.db) {
            try {
                const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                const index = store.index('expires');
                const range = IDBKeyRange.upperBound(now);
                const request = index.openCursor(range);
                
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        cursor.continue();
                    }
                };
            } catch (error) {
                console.warn('IndexedDB cleanup error:', error);
            }
        }
        
        // Clean localStorage
        try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('ts_'));
            keys.forEach(key => {
                try {
                    const item = JSON.parse(localStorage.getItem(key));
                    if (item && item.expires < now) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    // Invalid item, remove it
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            // Ignore localStorage errors
        }
    },
    
    // Clear all cache
    async clearAll() {
        // Clear memory
        this.memoryCache.clear();
        
        // Clear IndexedDB
        if (this.db) {
            try {
                const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                store.clear();
            } catch (error) {
                console.warn('IndexedDB clear error:', error);
            }
        }
        
        // Clear localStorage
        try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('ts_'));
            keys.forEach(key => localStorage.removeItem(key));
        } catch (e) {
            // Ignore
        }
    },
    
    // Get cache stats
    async getStats() {
        const stats = {
            memoryItems: this.memoryCache.size,
            memorySize: 0,
            indexedDBItems: 0,
            indexedDBSize: 0
        };
        
        // Calculate memory size
        for (const item of this.memoryCache.values()) {
            try {
                stats.memorySize += JSON.stringify(item).length;
            } catch (e) {
                // Skip
            }
        }
        
        // Count IndexedDB items
        if (this.db) {
            try {
                stats.indexedDBItems = await new Promise((resolve) => {
                    const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
                    const store = transaction.objectStore(this.STORE_NAME);
                    const request = store.count();
                    
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => resolve(0);
                });
            } catch (error) {
                console.warn('IndexedDB stats error:', error);
            }
        }
        
        return {
            ...stats,
            memorySizeKB: (stats.memorySize / 1024).toFixed(2),
            totalItems: stats.memoryItems + stats.indexedDBItems
        };
    }
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        IndexCacheService.init();
    });
} else {
    IndexCacheService.init();
}

// Auto-cleanup every 5 minutes
setInterval(() => {
    IndexCacheService.cleanExpired();
}, 5 * 60 * 1000);

// Make globally available
window.IndexCacheService = IndexCacheService;