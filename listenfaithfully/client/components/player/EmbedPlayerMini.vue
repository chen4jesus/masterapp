<template>
  <div class="embed-player-mini" :class="{ 'theme-light': theme !== 'dark', 'theme-dark': theme === 'dark' }" :style="containerStyle">
    <!-- Cover Image -->
    <div class="embed-cover" @click="playPause">
      <img v-if="coverUrl" :src="coverUrl" alt="Cover" class="embed-cover-img" />
      <div v-else class="embed-cover-placeholder">
        <span class="material-symbols">library_music</span>
      </div>
      <div class="embed-cover-overlay">
        <span class="material-symbols embed-play-icon">{{ loading ? 'autorenew' : paused ? 'play_arrow' : 'pause' }}</span>
      </div>
    </div>

    <!-- Content -->
    <div class="embed-content">
      <!-- Title and Author -->
      <div class="embed-info">
        <p class="embed-title">{{ title || 'Untitled' }}</p>
        <p v-if="author" class="embed-author">{{ author }}</p>
      </div>

      <!-- Progress Bar -->
      <div class="embed-progress-container" @click="seekFromClick">
        <div class="embed-progress-bar">
          <div class="embed-progress-fill" :style="{ width: progressPercent + '%' }"></div>
          <div class="embed-progress-handle" :style="{ left: progressPercent + '%' }"></div>
        </div>
      </div>

      <!-- Time Display and Controls -->
      <div class="embed-controls">
        <span class="embed-time">{{ currentTimeFormatted }}</span>
        <div class="embed-control-buttons">
          <button class="embed-btn" @click="jumpBackward" :title="'Back ' + jumpAmount + 's'">
            <span class="material-symbols">replay</span>
          </button>
          <button class="embed-btn embed-btn-play" @click="playPause">
            <span class="material-symbols" :class="{ 'animate-spin': loading }">
              {{ loading ? 'autorenew' : paused ? 'play_arrow' : 'pause' }}
            </span>
          </button>
          <button class="embed-btn" @click="jumpForward" :title="'Forward ' + jumpAmount + 's'">
            <span class="material-symbols">forward_media</span>
          </button>
          <div class="embed-speed-control">
            <button class="embed-btn embed-speed-btn" @click.stop="toggleSpeedMenu" title="Playback Speed">
              <span class="embed-speed-text">{{ currentPlaybackRate }}x</span>
            </button>
            <div v-if="showSpeedMenu" class="embed-speed-menu">
              <button v-for="rate in playbackRates" :key="rate" class="embed-speed-item" :class="{ active: rate === currentPlaybackRate }" @click="selectPlaybackRate(rate)">{{ rate }}x</button>
            </div>
          </div>
        </div>
        <span class="embed-time embed-time-duration">{{ durationFormatted }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: String,
    author: String,
    coverUrl: String,
    currentTime: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    },
    paused: {
      type: Boolean,
      default: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      default: 'light'
    },
    accentColor: {
      type: String,
      default: '#4ade80'
    },
    jumpAmount: {
      type: Number,
      default: 10
    },
    playbackRate: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      showSpeedMenu: false,
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
    }
  },
  computed: {
    progressPercent() {
      if (!this.duration || this.duration === 0) return 0
      return Math.min(100, (this.currentTime / this.duration) * 100)
    },
    currentTimeFormatted() {
      return this.formatTime(this.currentTime)
    },
    durationFormatted() {
      return this.formatTime(this.duration)
    },
    containerStyle() {
      return {
        '--accent-color': this.accentColor
      }
    },
    currentPlaybackRate() {
      return this.playbackRate
    }
  },
  methods: {
    formatTime(seconds) {
      if (!seconds || isNaN(seconds)) return '0:00'
      const hrs = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = Math.floor(seconds % 60)
      if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      }
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },
    playPause() {
      this.$emit('playPause')
    },
    jumpBackward() {
      this.$emit('jumpBackward')
    },
    jumpForward() {
      this.$emit('jumpForward')
    },
    seekFromClick(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      const seekTime = percent * this.duration
      this.$emit('seek', Math.max(0, Math.min(seekTime, this.duration)))
    },
    toggleSpeedMenu() {
      this.showSpeedMenu = !this.showSpeedMenu
      if (this.showSpeedMenu) {
        // Close menu when clicking outside
        document.addEventListener('click', this.closeSpeedMenu)
      }
    },
    closeSpeedMenu() {
      this.showSpeedMenu = false
      document.removeEventListener('click', this.closeSpeedMenu)
    },
    selectPlaybackRate(rate) {
      this.$emit('setPlaybackRate', rate)
      this.showSpeedMenu = false
    }
  }
}
</script>

<style scoped>
.embed-player-mini {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 100px;
  max-height: 140px;
}

/* Theme: Dark */
.theme-dark {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #ffffff;
}

/* Theme: Light */
.theme-light {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #212529;
}
.theme-light .embed-author {
  color: #6c757d;
}
.theme-light .embed-progress-bar {
  background: #dee2e6;
}
.theme-light .embed-btn {
  color: #495057;
}
.theme-light .embed-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* Cover */
.embed-cover {
  position: relative;
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.embed-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.embed-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #374151, #1f2937);
}
.embed-cover-placeholder .material-symbols {
  font-size: 32px;
  color: #9ca3af;
}
.embed-cover-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity 0.2s ease;
}
.embed-cover:hover .embed-cover-overlay {
  opacity: 1;
}
.embed-play-icon {
  font-size: 32px;
  color: white;
}

/* Content */
.embed-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Info */
.embed-info {
  min-width: 0;
}
.embed-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.embed-author {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Progress */
.embed-progress-container {
  padding: 4px 0;
  cursor: pointer;
}
.embed-progress-bar {
  position: relative;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: visible;
}
.embed-progress-fill {
  height: 100%;
  background: var(--accent-color, #4ade80);
  border-radius: 2px;
  transition: width 0.1s ease;
}
.embed-progress-handle {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background: var(--accent-color, #4ade80);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease;
}
.embed-progress-container:hover .embed-progress-handle {
  opacity: 1;
}

/* Controls */
.embed-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.embed-time {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: #9ca3af;
  min-width: 40px;
}
.embed-time-duration {
  text-align: right;
}
.embed-control-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  margin-right: auto;
}
.embed-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #d1d5db;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}
.embed-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}
.embed-btn .material-symbols {
  font-size: 20px;
}
.embed-btn-play {
  width: 36px;
  height: 36px;
  background: var(--accent-color, #4ade80);
  color: #1a1a2e;
}
.embed-btn-play:hover {
  background: var(--accent-color, #4ade80);
  filter: brightness(1.1);
  color: #1a1a2e;
}
.embed-btn-play .material-symbols {
  font-size: 22px;
}
.embed-speed-control {
  position: relative;
}
.embed-speed-btn {
  width: auto;
  min-width: 40px;
  padding: 0 4px;
  font-size: 11px;
  font-weight: 600;
}
.embed-speed-text {
  font-variant-numeric: tabular-nums;
}
.embed-speed-menu {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #2d3436;
  border-radius: 8px;
  padding: 2px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  z-index: 100;
  max-height: 60px;
  overflow-y: auto;
  min-width: 130px;
}
.embed-speed-item {
  background: transparent;
  border: none;
  color: #d1d5db;
  padding: 3px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  white-space: nowrap;
  text-align: center;
  transition: all 0.2s ease;
}
.embed-speed-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}
.embed-speed-item.active {
  color: var(--accent-color, #4ade80);
  background: rgba(74, 222, 128, 0.1);
}
.theme-light .embed-speed-menu {
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.theme-light .embed-speed-item {
  color: #495057;
}
.theme-light .embed-speed-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* Spin animation */
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 400px) {
  .embed-cover {
    width: 60px;
    height: 60px;
  }
  .embed-title {
    font-size: 13px;
  }
  .embed-btn {
    width: 28px;
    height: 28px;
  }
  .embed-btn-play {
    width: 32px;
    height: 32px;
  }
}
</style>
