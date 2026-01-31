const { Request, Response } = require('express')
const uuid = require('uuid')
const Path = require('path')
const { Op } = require('sequelize')
const Logger = require('../Logger')
const Database = require('../Database')

const { PlayMethod } = require('../utils/constants')
const { getAudioMimeTypeFromExtname, encodeUriPath } = require('../utils/fileUtils')
const zipHelpers = require('../utils/zipHelpers')

const PlaybackSession = require('../objects/PlaybackSession')
const ShareManager = require('../managers/ShareManager')

/**
 * @typedef RequestUserObject
 * @property {import('../models/User')} user
 *
 * @typedef {Request & RequestUserObject} RequestWithUser
 */

class ShareController {
  constructor() {}

  /**
   * Public route
   * GET: /api/share/:slug
   * Get media item share by slug
   *
   * @this {import('../routers/PublicRouter')}
   *
   * @param {Request} req
   * @param {Response} res
   */
  async getMediaItemShareBySlug(req, res) {
    const { slug } = req.params
    // Optional start time
    let startTime = req.query.t && !isNaN(req.query.t) ? Math.max(0, parseInt(req.query.t)) : 0

    const mediaItemShare = ShareManager.findBySlug(slug)
    if (!mediaItemShare) {
      Logger.warn(`[ShareController] Media item share not found with slug ${slug}`)
      return res.sendStatus(404)
    }
    if (mediaItemShare.expiresAt && mediaItemShare.expiresAt.valueOf() < Date.now()) {
      ShareManager.removeMediaItemShare(mediaItemShare.id)
      return res.status(404).send('Media item share not found')
    }

    if (req.cookies.share_session_id) {
      const playbackSession = ShareManager.findPlaybackSessionBySessionId(req.cookies.share_session_id)

      if (playbackSession) {
        if (mediaItemShare.id === playbackSession.mediaItemShareId) {
          Logger.debug(`[ShareController] Found share playback session ${req.cookies.share_session_id}`)
          mediaItemShare.playbackSession = playbackSession.toJSONForClient()
          return res.json(mediaItemShare)
        } else {
          // Changed media item share - close other session
          Logger.debug(`[ShareController] Other playback session is already open for share session. Closing session "${playbackSession.displayTitle}"`)
          ShareManager.closeSharePlaybackSession(playbackSession)
        }
      } else {
        Logger.info(`[ShareController] Share playback session not found with id ${req.cookies.share_session_id}`)
        if (!uuid.validate(req.cookies.share_session_id) || uuid.version(req.cookies.share_session_id) !== 4) {
          Logger.warn(`[ShareController] Invalid share session id ${req.cookies.share_session_id}`)
          res.clearCookie('share_session_id')
        }
      }
    }

    try {
      const libraryItem = await Database.mediaItemShareModel.getMediaItemsLibraryItem(mediaItemShare.mediaItemId, mediaItemShare.mediaItemType)
      if (!libraryItem) {
        return res.status(404).send('Media item not found')
      }

      let startOffset = 0
      const publicTracks = libraryItem.media.includedAudioFiles.map((audioFile) => {
        const audioTrack = {
          index: audioFile.index,
          startOffset,
          duration: audioFile.duration,
          title: audioFile.metadata.filename || '',
          contentUrl: `${global.RouterBasePath}/public/share/${slug}/track/${audioFile.index}`,
          mimeType: audioFile.mimeType,
          codec: audioFile.codec || null,
          metadata: structuredClone(audioFile.metadata)
        }
        startOffset += audioTrack.duration
        return audioTrack
      })

      if (startTime > startOffset) {
        Logger.warn(`[ShareController] Start time ${startTime} is greater than total duration ${startOffset}`)
        startTime = 0
      }

      const shareSessionId = req.cookies.share_session_id || uuid.v4()

      // Check if this is an embed request (via query param or referer)
      const isEmbedRequest = req.query.embed === 'true' || (req.headers.referer && req.headers.referer.includes('/embed/'))

      const clientDeviceInfo = {
        clientName: isEmbedRequest ? 'Abs Web Embed' : 'Abs Web Share',
        deviceId: shareSessionId
      }
      const deviceInfo = await this.playbackSessionManager.getDeviceInfo(req, clientDeviceInfo)

      const newPlaybackSession = new PlaybackSession()
      newPlaybackSession.setData(libraryItem, null, isEmbedRequest ? 'web-embed' : 'web-share', deviceInfo, startTime)
      newPlaybackSession.audioTracks = publicTracks
      newPlaybackSession.playMethod = isEmbedRequest ? PlayMethod.EMBEDDING : PlayMethod.DIRECTPLAY
      newPlaybackSession.shareSessionId = shareSessionId
      newPlaybackSession.mediaItemShareId = mediaItemShare.id
      newPlaybackSession.coverAspectRatio = libraryItem.library.settings.coverAspectRatio

      mediaItemShare.playbackSession = newPlaybackSession.toJSONForClient()
      ShareManager.addOpenSharePlaybackSession(newPlaybackSession)

      // 30 day cookie
      res.cookie('share_session_id', newPlaybackSession.shareSessionId, { maxAge: 1000 * 60 * 60 * 24 * 30, httpOnly: true })

      res.json(mediaItemShare)
    } catch (error) {
      Logger.error(`[ShareController] Failed`, error)
      res.status(500).send('Internal server error')
    }
  }

  /**
   * Public route - requires share_session_id cookie
   *
   * GET: /api/share/:slug/cover
   * Get media item share cover image
   *
   * @param {Request} req
   * @param {Response} res
   */
  async getMediaItemShareCoverImage(req, res) {
    if (!req.cookies.share_session_id) {
      return res.status(404).send('Share session not set')
    }

    const { slug } = req.params

    const mediaItemShare = ShareManager.findBySlug(slug)
    if (!mediaItemShare) {
      return res.status(404)
    }

    const playbackSession = ShareManager.findPlaybackSessionBySessionId(req.cookies.share_session_id)
    if (!playbackSession || playbackSession.mediaItemShareId !== mediaItemShare.id) {
      return res.status(404).send('Share session not found')
    }

    const coverPath = playbackSession.coverPath
    if (!coverPath) {
      return res.status(404).send('Cover image not found')
    }

    if (global.XAccel) {
      const encodedURI = encodeUriPath(global.XAccel + coverPath)
      Logger.debug(`Use X-Accel to serve static file ${encodedURI}`)
      return res.status(204).header({ 'X-Accel-Redirect': encodedURI }).send()
    }

    res.sendFile(coverPath)
  }

  /**
   * Public route - requires share_session_id cookie
   *
   * GET: /api/share/:slug/track/:index
   * Get media item share audio track
   *
   * @param {Request} req
   * @param {Response} res
   */
  async getMediaItemShareAudioTrack(req, res) {
    if (!req.cookies.share_session_id) {
      return res.status(404).send('Share session not set')
    }

    const { slug, index } = req.params

    const mediaItemShare = ShareManager.findBySlug(slug)
    if (!mediaItemShare) {
      return res.status(404)
    }

    const playbackSession = ShareManager.findPlaybackSessionBySessionId(req.cookies.share_session_id)
    if (!playbackSession || playbackSession.mediaItemShareId !== mediaItemShare.id) {
      return res.status(404).send('Share session not found')
    }

    const audioTrack = playbackSession.audioTracks.find((t) => t.index === parseInt(index))
    if (!audioTrack) {
      return res.status(404).send('Track not found')
    }
    const audioTrackPath = audioTrack.metadata.path

    if (global.XAccel) {
      const encodedURI = encodeUriPath(global.XAccel + audioTrackPath)
      Logger.debug(`Use X-Accel to serve static file ${encodedURI}`)
      return res.status(204).header({ 'X-Accel-Redirect': encodedURI }).send()
    }

    // Express does not set the correct mimetype for m4b files so use our defined mimetypes if available
    const audioMimeType = getAudioMimeTypeFromExtname(Path.extname(audioTrackPath))
    if (audioMimeType) {
      res.setHeader('Content-Type', audioMimeType)
    }
    res.sendFile(audioTrackPath)
  }

  /**
   * Public route - requires share_session_id cookie
   *
   * GET: /api/share/:slug/download
   * Downloads media item share
   *
   * @param {Request} req
   * @param {Response} res
   */
  async downloadMediaItemShare(req, res) {
    if (!req.cookies.share_session_id) {
      return res.status(404).send('Share session not set')
    }

    const { slug } = req.params
    const mediaItemShare = ShareManager.findBySlug(slug)
    if (!mediaItemShare) {
      return res.status(404)
    }
    if (!mediaItemShare.isDownloadable) {
      return res.status(403).send('Download is not allowed for this item')
    }

    const playbackSession = ShareManager.findPlaybackSessionBySessionId(req.cookies.share_session_id)
    if (!playbackSession || playbackSession.mediaItemShareId !== mediaItemShare.id) {
      return res.status(404).send('Share session not found')
    }

    const libraryItem = await Database.libraryItemModel.findByPk(playbackSession.libraryItemId, {
      attributes: ['id', 'path', 'relPath', 'isFile']
    })
    if (!libraryItem) {
      return res.status(404).send('Library item not found')
    }

    const itemPath = libraryItem.path
    const itemTitle = playbackSession.displayTitle

    Logger.info(`[ShareController] Requested download for book "${itemTitle}" at "${itemPath}"`)

    try {
      if (libraryItem.isFile) {
        const audioMimeType = getAudioMimeTypeFromExtname(Path.extname(itemPath))
        if (audioMimeType) {
          res.setHeader('Content-Type', audioMimeType)
        }
        await new Promise((resolve, reject) => res.download(itemPath, libraryItem.relPath, (error) => (error ? reject(error) : resolve())))
      } else {
        const filename = `${itemTitle}.zip`
        await zipHelpers.zipDirectoryPipe(itemPath, filename, res)
      }

      Logger.info(`[ShareController] Downloaded item "${itemTitle}" at "${itemPath}"`)
    } catch (error) {
      Logger.error(`[ShareController] Download failed for item "${itemTitle}" at "${itemPath}"`, error)
      res.status(500).send('Failed to download the item')
    }
  }

  /**
   * Public route - requires share_session_id cookie
   *
   * PATCH: /api/share/:slug/progress
   * Update media item share progress
   *
   * @param {Request} req
   * @param {Response} res
   */
  async updateMediaItemShareProgress(req, res) {
    if (!req.cookies.share_session_id) {
      return res.status(404).send('Share session not set')
    }

    const { slug } = req.params
    const { currentTime } = req.body
    if (currentTime === null || isNaN(currentTime) || currentTime < 0) {
      return res.status(400).send('Invalid current time')
    }

    const mediaItemShare = ShareManager.findBySlug(slug)
    if (!mediaItemShare) {
      return res.status(404)
    }

    const playbackSession = ShareManager.findPlaybackSessionBySessionId(req.cookies.share_session_id)
    if (!playbackSession || playbackSession.mediaItemShareId !== mediaItemShare.id) {
      return res.status(404).send('Share session not found')
    }

    playbackSession.currentTime = Math.min(currentTime, playbackSession.duration)
    playbackSession.updatedAt = Date.now()
    Logger.debug(`[ShareController] Update share playback session ${req.cookies.share_session_id} currentTime: ${playbackSession.currentTime}`)
    res.sendStatus(204)
  }

  /**
   * POST: /api/share/mediaitem
   * Create a new media item share
   *
   * @param {RequestWithUser} req
   * @param {Response} res
   */
  async createMediaItemShare(req, res) {
    if (!req.user.isAdminOrUp) {
      Logger.error(`[ShareController] Non-admin user "${req.user.username}" attempted to create item share`)
      return res.sendStatus(403)
    }

    const { slug, expiresAt, mediaItemType, mediaItemId, isDownloadable } = req.body

    if (!slug?.trim?.() || typeof mediaItemType !== 'string' || typeof mediaItemId !== 'string') {
      return res.status(400).send('Missing or invalid required fields')
    }
    if (expiresAt === null || isNaN(expiresAt) || expiresAt < 0) {
      return res.status(400).send('Invalid expiration date')
    }
    if (!['book', 'podcastEpisode'].includes(mediaItemType)) {
      return res.status(400).send('Invalid media item type')
    }

    try {
      // Check if the media item share already exists by slug or mediaItemId
      const existingMediaItemShare = await Database.mediaItemShareModel.findOne({
        where: {
          [Op.or]: [{ slug }, { mediaItemId }]
        }
      })
      if (existingMediaItemShare) {
        if (existingMediaItemShare.mediaItemId === mediaItemId) {
          return res.status(409).send('Item is already shared')
        } else {
          return res.status(409).send('Slug is already in use')
        }
      }

      // Check that media item exists
      const mediaItemModel = mediaItemType === 'book' ? Database.bookModel : Database.podcastEpisodeModel
      const mediaItem = await mediaItemModel.findByPk(mediaItemId)
      if (!mediaItem) {
        return res.status(404).send('Media item not found')
      }

      const mediaItemShare = await Database.mediaItemShareModel.create({
        slug,
        expiresAt: expiresAt || null,
        mediaItemId,
        mediaItemType,
        userId: req.user.id,
        isDownloadable
      })

      ShareManager.openMediaItemShare(mediaItemShare)

      res.status(201).json(mediaItemShare?.toJSONForClient())
    } catch (error) {
      Logger.error(`[ShareController] Failed`, error)
      res.status(500).send('Internal server error')
    }
  }

  /**
   * DELETE: /api/share/mediaitem/:id
   * Delete media item share
   *
   * @param {RequestWithUser} req
   * @param {Response} res
   */
  async deleteMediaItemShare(req, res) {
    if (!req.user.isAdminOrUp) {
      Logger.error(`[ShareController] Non-admin user "${req.user.username}" attempted to delete item share`)
      return res.sendStatus(403)
    }

    try {
      const mediaItemShare = await Database.mediaItemShareModel.findByPk(req.params.id)
      if (!mediaItemShare) {
        return res.status(404).send('Media item share not found')
      }

      ShareManager.removeMediaItemShare(mediaItemShare.id)

      await mediaItemShare.destroy()
      res.sendStatus(204)
    } catch (error) {
      Logger.error(`[ShareController] Failed`, error)
      res.status(500).send('Internal server error')
    }
  }

  /**
   * Public route
   * GET: /api/shares
   * Get all active media item shares
   *
   * @param {Request} req
   * @param {Response} res
   */
  async getAllPublicMediaItemShares(req, res) {
    try {
      const mediaItemShares = await Database.mediaItemShareModel.findAll({
        where: {
          [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }]
        },
        include: [
          {
            model: Database.bookModel,
            include: [{ model: Database.authorModel }]
          },
          {
            model: Database.podcastEpisodeModel,
            include: [{ model: Database.podcastModel }]
          }
        ]
      })

      const shares = mediaItemShares.map((share) => {
        let title = 'Unknown'
        let subtitle = ''
        if (share.mediaItemType === 'book' && share.mediaItem) {
          title = share.mediaItem.title
          subtitle = share.mediaItem.authorName
        } else if (share.mediaItemType === 'podcastEpisode' && share.mediaItem) {
          title = share.mediaItem.title
          subtitle = share.mediaItem.podcast ? share.mediaItem.podcast.title : ''
        }
        return {
          id: share.id,
          slug: share.slug,
          mediaItemType: share.mediaItemType,
          mediaItemId: share.mediaItemId,
          title,
          subtitle,
          expiresAt: share.expiresAt,
          isDownloadable: share.isDownloadable
        }
      })

      res.json(shares)
    } catch (error) {
      Logger.error(`[ShareController] Failed to get all public shares`, error)
      res.status(500).send('Internal server error')
    }
  }

  /**
   * Public route
   * GET: /api/shares/groups
   * Get grouped share counts (lightweight - no item details)
   *
   * @param {Request} req
   * @param {Response} res
   */
  async getPublicShareGroups(req, res) {
    try {
      const { search, initial } = req.query

      const mediaItemShares = await Database.mediaItemShareModel.findAll({
        where: {
          [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }]
        },
        include: [
          {
            model: Database.bookModel,
            include: [{ model: Database.authorModel }]
          },
          {
            model: Database.podcastEpisodeModel,
            include: [{ model: Database.podcastModel }]
          }
        ]
      })

      // Group by author/podcast and count
      const groups = {}
      mediaItemShares.forEach((share) => {
        let groupName = 'General'
        let itemTitle = ''
        if (share.mediaItemType === 'book' && share.mediaItem) {
          groupName = share.mediaItem.authorName || 'General'
          itemTitle = share.mediaItem.title || ''
        } else if (share.mediaItemType === 'podcastEpisode' && share.mediaItem) {
          groupName = share.mediaItem.podcast ? share.mediaItem.podcast.title : 'General'
          itemTitle = share.mediaItem.title || ''
        }

        // Apply server-side filters if provided (now including item titles)
        const matchesName = groupName.toLowerCase().includes(search ? search.toLowerCase() : '')
        const matchesTitle = itemTitle.toLowerCase().includes(search ? search.toLowerCase() : '')

        if (search && !matchesName && !matchesTitle) {
          return
        }

        if (initial && !groupName.toLowerCase().startsWith(initial.toLowerCase())) {
          return
        }

        if (!groups[groupName]) {
          groups[groupName] = 0
        }
        groups[groupName]++
      })

      // Convert to sorted array
      const result = Object.entries(groups)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))

      res.json(result)
    } catch (error) {
      Logger.error(`[ShareController] Failed to get share groups`, error)
      res.status(500).send('Internal server error')
    }
  }

  /**
   * Public route
   * GET: /api/shares/group/:name
   * Get shares for a specific group (author/podcast)
   *
   * @param {Request} req
   * @param {Response} res
   */
  async getPublicSharesByGroup(req, res) {
    try {
      const { name } = req.params
      const decodedName = decodeURIComponent(name)

      const mediaItemShares = await Database.mediaItemShareModel.findAll({
        where: {
          [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }]
        },
        include: [
          {
            model: Database.bookModel,
            include: [{ model: Database.authorModel }]
          },
          {
            model: Database.podcastEpisodeModel,
            include: [{ model: Database.podcastModel }]
          }
        ]
      })

      // Filter by group name and map to response format
      const shares = mediaItemShares
        .filter((share) => {
          let groupName = 'General'
          if (share.mediaItemType === 'book' && share.mediaItem) {
            groupName = share.mediaItem.authorName || 'General'
          } else if (share.mediaItemType === 'podcastEpisode' && share.mediaItem) {
            groupName = share.mediaItem.podcast ? share.mediaItem.podcast.title : 'General'
          }
          return groupName === decodedName
        })
        .map((share) => {
          let title = 'Unknown'
          let subtitle = ''
          if (share.mediaItemType === 'book' && share.mediaItem) {
            title = share.mediaItem.title
            subtitle = share.mediaItem.authorName
          } else if (share.mediaItemType === 'podcastEpisode' && share.mediaItem) {
            title = share.mediaItem.title
            subtitle = share.mediaItem.podcast ? share.mediaItem.podcast.title : ''
          }
          return {
            id: share.id,
            slug: share.slug,
            mediaItemType: share.mediaItemType,
            mediaItemId: share.mediaItemId,
            title,
            subtitle,
            expiresAt: share.expiresAt,
            isDownloadable: share.isDownloadable
          }
        })

      // Sort shares naturally by title
      const sortedShares = shares.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }))

      res.json(sortedShares)
    } catch (error) {
      Logger.error(`[ShareController] Failed to get shares by group`, error)
      res.status(500).send('Internal server error')
    }
  }
}

module.exports = new ShareController()
