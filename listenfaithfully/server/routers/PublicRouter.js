const express = require('express')
const ShareController = require('../controllers/ShareController')
const SessionController = require('../controllers/SessionController')

class PublicRouter {
  constructor(playbackSessionManager) {
    /** @type {import('../managers/PlaybackSessionManager')} */
    this.playbackSessionManager = playbackSessionManager

    this.router = express()
    this.router.disable('x-powered-by')
    this.init()
  }

  init() {
    // Middleware to allow embedding for embed routes
    this.router.use('/share/:slug', (req, res, next) => {
      // Check if this is being accessed via embed route (via referer or query param)
      const isEmbed = req.query.embed === 'true' || (req.headers.referer && req.headers.referer.includes('/embed/'))
      if (isEmbed) {
        res.setHeader('X-Frame-Options', 'ALLOWALL')
        res.setHeader('Content-Security-Policy', 'frame-ancestors *')
      }
      next()
    })

    this.router.get('/share/:slug', ShareController.getMediaItemShareBySlug.bind(this))
    this.router.get('/share/:slug/track/:index', ShareController.getMediaItemShareAudioTrack.bind(this))
    this.router.get('/share/:slug/cover', ShareController.getMediaItemShareCoverImage.bind(this))
    this.router.get('/share/:slug/download', ShareController.downloadMediaItemShare.bind(this))
    this.router.patch('/share/:slug/progress', ShareController.updateMediaItemShareProgress.bind(this))
    this.router.get('/shares', ShareController.getAllPublicMediaItemShares.bind(this))
    this.router.get('/shares/groups', ShareController.getPublicShareGroups.bind(this))
    this.router.get('/shares/group/:name', ShareController.getPublicSharesByGroup.bind(this))
    this.router.get('/session/:id/track/:index', SessionController.getTrack.bind(this))
  }
}
module.exports = PublicRouter
