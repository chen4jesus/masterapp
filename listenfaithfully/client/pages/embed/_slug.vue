<template>
  <div class="embed-container" :style="{ backgroundColor: bgColor }">
    <player-embed-player-mini
      :title="displayTitle"
      :author="displayAuthor"
      :cover-url="coverUrl"
      :current-time="currentTime"
      :duration="totalDuration"
      :paused="isPaused"
      :loading="!hasLoaded"
      :theme="theme"
      :accent-color="accentColor"
      :jump-amount="jumpAmount"
      :playback-rate="playbackRate"
      @playPause="playPause"
      @jumpForward="jumpForward"
      @jumpBackward="jumpBackward"
      @seek="seek"
      @setPlaybackRate="setPlaybackRate"
    />
  </div>
</template>

<script>
import LocalAudioPlayer from '../../players/LocalAudioPlayer'

export default {
  layout: 'embed',
  async asyncData({ params, error, app, query }) {
    // Include embed=true to indicate this is an embedded player request
    let endpoint = `/public/share/${params.slug}?embed=true`
    if (query.t && !isNaN(query.t)) {
      endpoint += `&t=${query.t}`
    }
    const mediaItemShare = await app.$axios.$get(endpoint, { timeout: 10000 }).catch((err) => {
      console.error('Failed to load share', err)
      return null
    })
    if (!mediaItemShare) {
      return error({ statusCode: 404, message: 'Media item not found or expired' })
    }

    return {
      mediaItemShare: mediaItemShare,
      theme: query.theme || 'light',
      accentColor: query.accent ? `#${query.accent}` : '#4ade80',
      playbackRate: query.sp ? parseFloat(query.sp) : 1
    }
  },
  data() {
    return {
      localAudioPlayer: new LocalAudioPlayer(),
      playerState: null,
      playInterval: null,
      hasLoaded: false,
      totalDuration: 0,
      currentTime: 0,
      listeningTimeSinceSync: 0
    }
  },
  computed: {
    playbackSession() {
      return this.mediaItemShare?.playbackSession
    },
    displayTitle() {
      return this.playbackSession?.displayTitle || 'Untitled'
    },
    displayAuthor() {
      return this.playbackSession?.displayAuthor || ''
    },
    coverUrl() {
      if (!this.playbackSession?.coverPath) return null
      return `${this.$config.routerBasePath}/public/share/${this.mediaItemShare.slug}/cover`
    },
    audioTracks() {
      return (this.playbackSession?.audioTracks || []).map((track) => {
        track.relativeContentUrl = track.contentUrl
        return track
      })
    },
    isPlaying() {
      return this.playerState === 'PLAYING'
    },
    isPaused() {
      return !this.isPlaying
    },
    jumpAmount() {
      return this.$store?.getters['user/getUserSetting']?.('jumpForwardAmount') || 10
    },
    bgColor() {
      return this.theme === 'light' ? 'transparent' : 'transparent'
    }
  },
  methods: {
    playPause() {
      if (this.isPlaying) {
        this.pause()
      } else {
        this.play()
      }
    },
    play() {
      if (!this.localAudioPlayer || !this.hasLoaded) return
      this.localAudioPlayer.play()
    },
    pause() {
      if (!this.localAudioPlayer || !this.hasLoaded) return
      this.localAudioPlayer.pause()
    },
    jumpForward() {
      if (!this.localAudioPlayer || !this.hasLoaded) return
      const current = this.localAudioPlayer.getCurrentTime()
      const duration = this.localAudioPlayer.getDuration()
      this.seek(Math.min(current + this.jumpAmount, duration))
    },
    jumpBackward() {
      if (!this.localAudioPlayer || !this.hasLoaded) return
      const current = this.localAudioPlayer.getCurrentTime()
      this.seek(Math.max(current - this.jumpAmount, 0))
    },
    seek(time) {
      if (!this.localAudioPlayer || !this.hasLoaded) return
      this.localAudioPlayer.seek(time, this.isPlaying)
      this.currentTime = time
    },
    setPlaybackRate(rate) {
      if (!this.localAudioPlayer) return
      this.playbackRate = rate
      this.localAudioPlayer.setPlaybackRate(rate)
    },
    setCurrentTime(time) {
      this.currentTime = time
    },
    setDuration() {
      if (!this.localAudioPlayer) return
      this.totalDuration = this.localAudioPlayer.getDuration()
    },
    sendProgressSync(currentTime) {
      const progress = { currentTime }
      this.$axios.$patch(`/public/share/${this.mediaItemShare.slug}/progress`, progress, { progress: false }).catch((err) => {
        console.error('Failed to send progress sync', err)
      })
    },
    startPlayInterval() {
      let lastTick = Date.now()
      clearInterval(this.playInterval)
      this.playInterval = setInterval(() => {
        if (!this.localAudioPlayer) return
        const current = this.localAudioPlayer.getCurrentTime()
        this.setCurrentTime(current)
        const elapsed = (Date.now() - lastTick) / 1000
        lastTick = Date.now()
        this.listeningTimeSinceSync += elapsed
        if (this.listeningTimeSinceSync >= 30) {
          this.listeningTimeSinceSync = 0
          this.sendProgressSync(current)
        }
      }, 1000)
    },
    stopPlayInterval() {
      clearInterval(this.playInterval)
      this.playInterval = null
    },
    playerStateChange(state) {
      this.playerState = state
      if (state === 'LOADED' || state === 'PLAYING') {
        this.setDuration()
      }
      if (state === 'LOADED') {
        this.hasLoaded = true
      }
      if (state === 'PLAYING') {
        this.startPlayInterval()
      } else {
        this.stopPlayInterval()
      }
    },
    playerTimeUpdate(time) {
      this.setCurrentTime(time)
    },
    playerError(error) {
      console.error('Player error', error)
    },
    playerFinished() {
      console.log('Player finished')
    }
  },
  mounted() {
    try {
      this.$store?.dispatch('user/loadUserSettings')
    } catch (e) {
      // Store may not be available in embed context
    }

    const startTime = this.playbackSession?.currentTime || 0
    this.localAudioPlayer.set(null, this.audioTracks, false, startTime, false)
    this.localAudioPlayer.on('stateChange', this.playerStateChange.bind(this))
    this.localAudioPlayer.on('timeupdate', this.playerTimeUpdate.bind(this))
    this.localAudioPlayer.on('error', this.playerError.bind(this))
    this.localAudioPlayer.on('finished', this.playerFinished.bind(this))

    if (this.playbackRate !== 1) {
      this.localAudioPlayer.setPlaybackRate(this.playbackRate)
    }
  },
  beforeDestroy() {
    this.localAudioPlayer.off('stateChange', this.playerStateChange.bind(this))
    this.localAudioPlayer.off('timeupdate', this.playerTimeUpdate.bind(this))
    this.localAudioPlayer.off('error', this.playerError.bind(this))
    this.localAudioPlayer.off('finished', this.playerFinished.bind(this))
    this.localAudioPlayer.destroy()
  }
}
</script>

<style scoped>
.embed-container {
  width: 100%;
  height: 100%;
  min-height: 100px;
}
</style>
