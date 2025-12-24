// ===== VIDEO CONTROLS COMPONENT =====
const VideoControls = {
    togglePlayPause() {
        const videoElement = document.getElementById('videoElement');
        if (!videoElement) return;
        
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (videoElement.paused) {
            videoElement.play().catch(e => console.log('Play prevented:', e));
            if (playPauseBtn) playPauseBtn.textContent = '⏸️';
        } else {
            videoElement.pause();
            if (playPauseBtn) playPauseBtn.textContent = '▶️';
        }
    },
    
    toggleMute() {
        const videoElement = document.getElementById('videoElement');
        if (!videoElement) return;
        
        const muteBtn = document.getElementById('muteBtn');
        videoElement.muted = !videoElement.muted;
        if (muteBtn) muteBtn.textContent = videoElement.muted ? '🔇' : '🔊';
    },
    
    updateTimeDisplay() {
        const videoElement = document.getElementById('videoElement');
        const timeDisplay = document.getElementById('timeDisplay');
        if (!videoElement || !timeDisplay) return;
        
        const currentTime = Helpers.formatTime(videoElement.currentTime);
        const duration = Helpers.formatTime(videoElement.duration);
        timeDisplay.textContent = `${currentTime} / ${duration}`;
    },
    
    reloadStream() {
        if (window.VideoPlayer && VideoPlayer.reloadCurrentStream) {
            VideoPlayer.reloadCurrentStream();
        }
    },
    
    toggleFullscreen() {
        const videoElement = document.getElementById('videoElement');
        const container = document.querySelector('.player-wrapper');
        const target = container || videoElement;
        
        if (!target) return;
        
        if (!document.fullscreenElement) {
            if (target.requestFullscreen) target.requestFullscreen();
            else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
            else if (target.mozRequestFullScreen) target.mozRequestFullScreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        }
    },
    
    setVolume(value) {
        const videoElement = document.getElementById('videoElement');
        if (!videoElement) return;
        videoElement.volume = Math.max(0, Math.min(1, value / 100));
    },
    
    seekTo(seconds) {
        const videoElement = document.getElementById('videoElement');
        if (!videoElement) return;
        videoElement.currentTime = Math.max(0, Math.min(videoElement.duration, seconds));
    },
    
    getCurrentTime() {
        const videoElement = document.getElementById('videoElement');
        return videoElement ? videoElement.currentTime : 0;
    },
    
    getDuration() {
        const videoElement = document.getElementById('videoElement');
        return videoElement ? videoElement.duration : 0;
    }
};

window.VideoControls = VideoControls;