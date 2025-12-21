// ===== VIDEO CONTROLS COMPONENT =====

const VideoControls = {
    // Toggle play/pause
    togglePlayPause() {
        const videoElement = document.getElementById('videoElement');
        if (!videoElement) return;
        
        if (videoElement.paused) {
            videoElement.play();
            document.getElementById('playPauseBtn').textContent = '⏸️';
        } else {
            videoElement.pause();
            document.getElementById('playPauseBtn').textContent = '▶️';
        }
    },
    
    // Toggle mute
    toggleMute() {
        const videoElement = document.getElementById('videoElement');
        if (!videoElement) return;
        
        videoElement.muted = !videoElement.muted;
        document.getElementById('muteBtn').textContent = videoElement.muted ? '🔇' : '🔊';
    },
    
    // Update time display
    updateTimeDisplay() {
        const videoElement = document.getElementById('videoElement');
        const timeDisplay = document.getElementById('timeDisplay');
        if (!videoElement || !timeDisplay) return;
        
        const currentTime = Helpers.formatTime(videoElement.currentTime);
        const duration = Helpers.formatTime(videoElement.duration);
        timeDisplay.textContent = `${currentTime} / ${duration}`;
    },
    
    // Reload stream
    async reloadStream() {
        const videoElement = document.getElementById('videoElement');
        if (videoElement) {
            videoElement.src = videoElement.src + '?t=' + Date.now();
            videoElement.load();
            videoElement.play().catch(e => console.log('Autoplay prevented:', e));
        }
    },
    
    // Toggle fullscreen
    toggleFullscreen() {
        const videoElement = document.getElementById('videoElement');
        if (!videoElement) return;
        
        if (!document.fullscreenElement) {
            if (videoElement.requestFullscreen) {
                videoElement.requestFullscreen();
            } else if (videoElement.webkitRequestFullscreen) {
                videoElement.webkitRequestFullscreen();
            } else if (videoElement.mozRequestFullScreen) {
                videoElement.mozRequestFullScreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
        }
    },
    
    // Set volume
    setVolume(value) {
        const videoElement = document.getElementById('videoElement');
        if (!videoElement) return;
        
        videoElement.volume = value / 100;
    },
    
    // Seek to time
    seekTo(seconds) {
        const videoElement = document.getElementById('videoElement');
        if (!videoElement) return;
        
        videoElement.currentTime = seconds;
    },
    
    // Get current time
    getCurrentTime() {
        const videoElement = document.getElementById('videoElement');
        return videoElement ? videoElement.currentTime : 0;
    },
    
    // Get duration
    getDuration() {
        const videoElement = document.getElementById('videoElement');
        return videoElement ? videoElement.duration : 0;
    }
};

// Make controls globally available
window.VideoControls = VideoControls;