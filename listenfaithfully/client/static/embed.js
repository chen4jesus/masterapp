/**
 * Audiobookshelf Embed Widget
 *
 * Usage:
 * <div data-abs-share="SHARE_SLUG" data-abs-theme="dark" data-abs-height="120"></div>
 * <script src="https://YOUR_SERVER/embed.js"></script>
 */
;(function () {
  'use strict'

  // Get the script's source URL to determine the server
  var scripts = document.getElementsByTagName('script')
  var currentScript = scripts[scripts.length - 1]
  var scriptSrc = currentScript.src || ''

  // Extract base URL from script source
  var baseUrl = ''
  if (scriptSrc) {
    var urlParts = scriptSrc.match(/^(https?:\/\/[^\/]+)/)
    if (urlParts) {
      baseUrl = urlParts[1]
    }
  }

  // Allow override via data attribute
  if (currentScript.dataset.absServer) {
    baseUrl = currentScript.dataset.absServer.replace(/\/$/, '')
  }

  // Default configuration
  var defaults = {
    height: '120',
    theme: 'light',
    accent: '4ade80',
    speed: '1'
  }

  /**
   * Create an iframe for a share element
   */
  function createEmbed(element) {
    var slug = element.dataset.absShare
    if (!slug) {
      console.warn('[ABS Embed] Missing data-abs-share attribute')
      return
    }

    // Get configuration from data attributes
    var height = element.dataset.absHeight || defaults.height
    var theme = element.dataset.absTheme || defaults.theme
    var accent = element.dataset.absAccent || defaults.accent
    var startTime = element.dataset.absTime || ''
    var speed = element.dataset.absSpeed || defaults.speed

    // Build embed URL
    var embedUrl = baseUrl + '/embed/' + encodeURIComponent(slug)
    var params = []
    params.push('theme=' + encodeURIComponent(theme))
    params.push('accent=' + encodeURIComponent(accent.replace('#', '')))
    if (startTime) {
      params.push('t=' + encodeURIComponent(startTime))
    }
    if (speed && speed !== '1') {
      params.push('sp=' + encodeURIComponent(speed))
    }
    embedUrl += '?' + params.join('&')

    // Create iframe
    var iframe = document.createElement('iframe')
    iframe.src = embedUrl
    iframe.style.width = '100%'
    iframe.style.height = height + 'px'
    iframe.style.border = 'none'
    iframe.style.borderRadius = '12px'
    iframe.style.overflow = 'hidden'
    iframe.setAttribute('frameborder', '0')
    iframe.setAttribute('allow', 'autoplay; encrypted-media')
    iframe.setAttribute('allowfullscreen', '')
    iframe.setAttribute('loading', 'lazy')
    iframe.setAttribute('title', 'Audiobookshelf Player')

    // Clear the element and insert iframe
    element.innerHTML = ''
    element.appendChild(iframe)

    // Mark as initialized
    element.dataset.absInitialized = 'true'
  }

  /**
   * Initialize all embed elements on the page
   */
  function initEmbeds() {
    var elements = document.querySelectorAll('[data-abs-share]:not([data-abs-initialized])')
    for (var i = 0; i < elements.length; i++) {
      createEmbed(elements[i])
    }
  }

  /**
   * Watch for new elements added to the DOM
   */
  function watchForNewElements() {
    if (typeof MutationObserver === 'undefined') return

    var observer = new MutationObserver(function (mutations) {
      var shouldInit = false
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes.length > 0) {
          shouldInit = true
          break
        }
      }
      if (shouldInit) {
        initEmbeds()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initEmbeds()
      watchForNewElements()
    })
  } else {
    initEmbeds()
    watchForNewElements()
  }

  // Expose API for manual initialization
  window.ABSEmbed = {
    init: initEmbeds,
    create: createEmbed,
    baseUrl: baseUrl
  }
})()
