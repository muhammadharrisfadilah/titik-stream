// ===== APPLICATION CONFIGURATION =====

const AppConfig = {
    version: '2.0.0',
    
    api: {
        BASE_URL: 'https://www.fotmob.com/api',
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000,
        CACHE_TTL: 5 * 60 * 1000
    },
    
    supabase: {
        URL: 'https://oodzcqhmvixwiyyroplf.supabase.co',
        ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZHpjcWhtdml4d2l5eXJvcGxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NTI1ODIsImV4cCI6MjA3NzAyODU4Mn0.dFI-z-6Ja_jV7DZs6cgNH1L2f_z04Yv-shRzHghST_4'
    },
    
    video: {
        HLS_CONFIG: {
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
        }
    },
    
    features: {
        ENABLE_CACHE: true,
        ENABLE_MOCK_DATA: false,
        DEBUG_MODE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    }
};

// Make config globally available
window.AppConfig = AppConfig;