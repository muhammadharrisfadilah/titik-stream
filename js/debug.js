// debug.js - Debug utilities for development
const Debug = {
    enabled: window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1' ||
             window.location.search.includes('debug=1'),
    
    init() {
        if (!this.enabled) return;
        
        console.log('ðŸ”§ Debug mode enabled');
        
        this.interceptAPI();
        this.addDebugPanel();
        this.logPerformance();
    },
    
    interceptAPI() {
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const url = args[0];
            const options = args[1] || {};
            
            console.group(`ðŸŒ API Request: ${url}`);
            console.log('Method:', options.method || 'GET');
            console.log('Headers:', options.headers);
            
            const startTime = Date.now();
            
            try {
                const response = await originalFetch.apply(this, args);
                const clone = response.clone();
                
                // Log response time
                const endTime = Date.now();
                console.log(`â±ï¸ Response time: ${endTime - startTime}ms`);
                console.log(`ðŸ“Š Status: ${response.status} ${response.statusText}`);
                
                // Try to parse as JSON
                try {
                    const data = await clone.json();
                    console.log('ðŸ“¦ Response data:', data);
                    
                    // Save for debug panel
                    Debug.saveRequest({
                        url,
                        method: options.method || 'GET',
                        status: response.status,
                        time: endTime - startTime,
                        data,
                        timestamp: new Date().toISOString()
                    });
                    
                } catch (e) {
                    console.log('Response is not JSON');
                }
                
                console.groupEnd();
                return response;
                
            } catch (error) {
                console.error('âŒ Fetch error:', error);
                console.groupEnd();
                throw error;
            }
        };
    },
    
    saveRequest(requestData) {
        if (!window.apiRequests) window.apiRequests = [];
        window.apiRequests.push(requestData);
        
        // Keep only last 20 requests
        if (window.apiRequests.length > 20) {
            window.apiRequests.shift();
        }
    },
    
    addDebugPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            max-width: 300px;
            max-height: 400px;
            overflow: auto;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        panel.innerHTML = `
            <div style="margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid #666; padding-bottom: 4px;">
                ðŸ”§ Debug Panel
            </div>
            <div id="debug-info"></div>
            <button onclick="Debug.showAPILogs()" style="margin-top: 8px; background: #666; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
                Show API Logs
            </button>
        `;
        
        document.body.appendChild(panel);
        this.updateDebugInfo();
        
        // Update info periodically
        setInterval(() => this.updateDebugInfo(), 2000);
    },
    
    updateDebugInfo() {
        const infoDiv = document.getElementById('debug-info');
        if (!infoDiv) return;
        
        const app = window.App;
        const info = `
            Match ID: ${app?.state?.matchId || 'N/A'}<br>
            Active Tab: ${app?.state?.activeTab || 'N/A'}<br>
            Loading: ${app?.state?.isLoading ? 'âœ…' : 'âŒ'}<br>
            Live: ${app?.state?.isLive ? 'ðŸŸ¢' : 'âš«'}<br>
            Data loaded: ${app?.state?.data ? 'âœ…' : 'âŒ'}<br>
            API Calls: ${window.apiRequests?.length || 0}
        `;
        
        infoDiv.innerHTML = info;
    },
    
    showAPILogs() {
        const logs = window.apiRequests || [];
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.95);
            z-index: 10000;
            padding: 20px;
            overflow: auto;
            color: white;
            font-family: monospace;
            font-size: 12px;
        `;
        
        let content = '<h2>API Request Logs</h2>';
        
        if (logs.length === 0) {
            content += '<p>No API requests recorded</p>';
        } else {
            logs.forEach((log, index) => {
                content += `
                    <div style="background: #222; padding: 10px; margin: 10px 0; border-radius: 4px; border-left: 4px solid ${log.status === 200 ? '#4CAF50' : '#ff4757'}">
                        <strong>${index + 1}. ${log.method} ${log.url}</strong><br>
                        Status: ${log.status} | Time: ${log.time}ms<br>
                        <button onclick="Debug.toggleJSON(${index})" style="background: #444; color: white; border: none; padding: 2px 6px; border-radius: 2px; margin-top: 4px; cursor: pointer;">
                            Toggle JSON
                        </button>
                        <pre id="json-${index}" style="display: none; background: #111; padding: 8px; border-radius: 4px; margin-top: 8px; overflow: auto; max-height: 200px;">
${JSON.stringify(log.data, null, 2)}
                        </pre>
                    </div>
                `;
            });
        }
        
        content += '<button onclick="this.parentElement.remove()" style="position: fixed; top: 20px; right: 20px; background: #ff4757; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>';
        
        modal.innerHTML = content;
        document.body.appendChild(modal);
    },
    
    toggleJSON(index) {
        const pre = document.getElementById(`json-${index}`);
        if (pre) {
            pre.style.display = pre.style.display === 'none' ? 'block' : 'none';
        }
    },
    
    logPerformance() {
        window.addEventListener('load', () => {
            const timing = performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            console.log(`ðŸš€ Page load time: ${loadTime}ms`);
        });
        
        // Monitor memory usage
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                console.log(`ðŸ§  Memory: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB / ${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`);
            }, 30000);
        }
    }
};

// Auto-init debug mode
if (Debug.enabled) {
    document.addEventListener('DOMContentLoaded', () => Debug.init());
}

// Make debug functions available globally
window.Debug = Debug;