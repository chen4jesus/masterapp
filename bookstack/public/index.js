$(document).ready(function () {
    const checkPlyr = setInterval(function () {
        if (typeof Plyr !== "undefined" && !window.isPlyrInitialized) {
            clearInterval(checkPlyr);
            initializeMedia();
            window.isPlyrInitialized = true; // Prevent reinitialization
        }
    }, 100);

    function initializeMedia() {
        const videoElement = document.getElementById("media-player");
        const audioElement = document.getElementById("audio-player");
        
        // Add dark mode detection and handling
        const isDarkMode = document.documentElement.classList.contains('dark-mode');
        const darkModeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isDark = document.documentElement.classList.contains('dark-mode');
                    updatePlayerTheme(isDark);
                }
            });
        });
        
        darkModeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
        
        function updatePlayerTheme(isDark) {
            const playerElements = document.querySelectorAll('.plyr');
            playerElements.forEach(player => {
                if (isDark) {
                    player.style.setProperty('--plyr-color-main', '#3498db', 'important');
                    player.style.setProperty('--plyr-video-background', '#222222', 'important');
                    player.style.setProperty('--plyr-menu-background', '#222222', 'important');
                    player.style.setProperty('--plyr-menu-color', '#ffffff', 'important');
                    player.style.setProperty('--plyr-tooltip-background', '#222222', 'important');
                    player.style.setProperty('--plyr-tooltip-color', '#ffffff', 'important');
                    player.style.setProperty('--plyr-range-fill-background', '#3498db', 'important');
                    player.style.backgroundColor = '#222222';
                } else {
                    player.style.setProperty('--plyr-color-main', '#00b3ff', 'important');
                    player.style.setProperty('--plyr-video-background', '#ffffff', 'important');
                    player.style.setProperty('--plyr-menu-background', '#ffffff', 'important');
                    player.style.setProperty('--plyr-menu-color', '#4a5464', 'important');
                    player.style.setProperty('--plyr-tooltip-background', '#ffffff', 'important');
                    player.style.setProperty('--plyr-tooltip-color', '#4a5464', 'important');
                    player.style.setProperty('--plyr-range-fill-background', '#00b3ff', 'important');
                    player.style.backgroundColor = '#ffffff';
                }
            });
            
            // Update playlist styles with !important
            const playlist = document.getElementById('playlist');
            if (playlist) {
                if (isDark) {
                    playlist.style.setProperty('background-color', '#222222', 'important');
                    playlist.style.setProperty('color', '#ffffff', 'important');
                } else {
                    playlist.style.setProperty('background-color', '#ffffff', 'important');
                    playlist.style.setProperty('color', '#000000', 'important');
                }
            }
            
            // Update media container styles with !important
            const mediaContainer = document.getElementById('media-container');
            if (mediaContainer) {
                if (isDark) {
                    mediaContainer.style.setProperty('background-color', '#222222', 'important');
                    mediaContainer.style.setProperty('border-color', '#333333', 'important');
                } else {
                    mediaContainer.style.setProperty('background-color', '#ffffff', 'important');
                    mediaContainer.style.setProperty('border-color', '#e5e5e5', 'important');
                }
            }

            // Update tools-bar styles with !important
            const toolsBar = document.querySelector('.tools-bar');
            if (toolsBar) {
                if (isDark) {
                    toolsBar.style.setProperty('background-color', '#222222', 'important');
                    toolsBar.style.setProperty('border-color', '#333333', 'important');
                    
                    // Update all buttons in the tools-bar
                    const buttons = toolsBar.querySelectorAll('button');
                    buttons.forEach(button => {
                        button.style.setProperty('background-color', '#2a2a2a', 'important');
                        button.style.setProperty('border-color', '#333333', 'important');
                        button.style.setProperty('color', '#ffffff', 'important');
                    });
                } else {
                    toolsBar.style.setProperty('background-color', '#ffffff', 'important');
                    toolsBar.style.setProperty('border-color', '#e5e5e5', 'important');
                    
                    // Update all buttons in the tools-bar
                    const buttons = toolsBar.querySelectorAll('button');
                    buttons.forEach(button => {
                        button.style.setProperty('background-color', '#ffffff', 'important');
                        button.style.setProperty('border-color', '#e5e5e5', 'important');
                        button.style.setProperty('color', '#4a5464', 'important');
                    });
                }
            }
        }
        
        const videoPlayer = new Plyr(videoElement, {
            autoplay: true, 
            muted: false,
            controls: [
               'rewind',       // Rewind button
               'play',         // Play/pause button
               'fast-forward',  // Fast-forward button
               'progress', // The progress bar and scrubber for playback and buffering
               'current-time', // The current time of playback
               'duration', // The full duration of the media
               'mute', // Toggle mute
               'volume', // Volume control
               'settings' // Settings menu
            ],
            seekTime: 15       // Time in seconds to seek forward/backward
        });
        
        const audioPlayer = new Plyr(audioElement,  {
            controls: [
               'rewind',       // Rewind button
               'play',         // Play/pause button
               'fast-forward',  // Fast-forward button
               'progress', // The progress bar and scrubber for playback and buffering
               'current-time', // The current time of playback
               'duration', // The full duration of the media
               'mute', // Toggle mute
               'volume', // Volume control
               'settings' // Settings menu
            ],
            seekTime: 15       // Time in seconds to seek forward/backward
        });

        // Apply initial theme
        updatePlayerTheme(isDarkMode);
        
        // Add styles for playlist items in dark mode
        const style = document.createElement('style');
        style.textContent = `
            /* Dynamic theme styles that need to be injected */
            .dark-mode .plyr {
                --plyr-color-main: #3498db;
                --plyr-audio-controls-background: #222222;
                --plyr-menu-background: #222222;
                --plyr-menu-color: #ffffff;
                --plyr-menu-item-text: #ffffff;
                --plyr-tooltip-background: #222222;
                --plyr-tooltip-color: #ffffff;
                --plyr-range-fill-background: #3498db;
                --plyr-range-thumb-background: #3498db;
                --plyr-control-icon-color: #ffffff;
                --plyr-audio-progress-buffered-background: #333333;
                --plyr-audio-time-color: #ffffff;
                --plyr-badge-background: #333333;
                --plyr-badge-text-color: #ffffff;
                --plyr-control-toggle-checked: #3498db;
                --plyr-control-toggle-off: #666666;
                --plyr-video-controls-background: linear-gradient(rgba(34, 34, 34, 0), rgba(34, 34, 34, 0.9));
            }

            .plyr {
                --plyr-color-main: #00b3ff;
                --plyr-audio-controls-background: #ffffff;
                --plyr-menu-background: #ffffff;
                --plyr-menu-color: #4a5464;
                --plyr-menu-item-text: #4a5464;
                --plyr-tooltip-background: #ffffff;
                --plyr-tooltip-color: #4a5464;
                --plyr-range-fill-background: #00b3ff;
                --plyr-range-thumb-background: #00b3ff;
                --plyr-control-icon-color: #4a5464;
                --plyr-audio-progress-buffered-background: #e5e5e5;
                --plyr-audio-time-color: #4a5464;
                --plyr-badge-background: #e5e5e5;
                --plyr-badge-text-color: #4a5464;
                --plyr-control-toggle-checked: #00b3ff;
                --plyr-control-toggle-off: #cccccc;
                --plyr-video-controls-background: linear-gradient(rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.9));
            }
        `;
        document.head.appendChild(style);

        // Expose player instances globally
        window.videoPlayer = videoPlayer;
        window.audioPlayer = audioPlayer;
        
        // Get page ID from meta tag or data attribute for reload functionality
        let pageId = $('meta[name="page-id"]').attr('content');
        if (!pageId) {
            // Try to extract from pathname as fallback
            const pathParts = window.location.pathname.split('/');
            const potentialId = pathParts[pathParts.length - 1];
            if (!isNaN(potentialId) && potentialId.trim() !== '') {
                pageId = potentialId;
            }
        }
        
        // Only check for page changes if we don't already have a stored page ID
        const lastAudioPageId = localStorage.getItem('last_audio_page_id');
        if (lastAudioPageId && pageId && lastAudioPageId !== pageId) {
            console.log("Detected page change, reloading media list");
            const newMedia = localStorage.getItem('newMedia');
            if (newMedia && newMedia !== 'null') {
                try {
                    const parsedMedia = JSON.parse(newMedia);
                    if (Array.isArray(parsedMedia) && parsedMedia.length > 0) {
                        // Update global mediaList safely
                        mediaList = parsedMedia;
                        localStorage.setItem('currentMedia', JSON.stringify(mediaList));
                        // We'll update the UI in loadPlaylist which gets called later
                    }
                } catch (e) {
                    console.error("Error parsing new media:", e);
                }
            }
            // Update the stored page ID
            localStorage.setItem('last_audio_page_id', pageId);
        }
        
        // Function to update the global mediaList variable when navigating between pages
        // Only define if not already defined
        if (!window.updateMediaList) {
            window.updateMediaList = function(newList) {
                if (Array.isArray(newList) && newList.length > 0) {
                    // Update the global mediaList with the new list
                    mediaList = newList;
                    
                    // Update localStorage for consistency
                    localStorage.setItem('currentMedia', JSON.stringify(mediaList));
                    
                    // Reload the playlist with the new media
                    loadPlaylist();
                    
                    console.log("Media list updated with", mediaList.length, "items");
                    return true;
                }
                return false;
            };
        }
        
        // Function to reload the media player with new content from a specific page
        // Only define if not already defined
        if (!window.reloadMediaPlayer) {
            window.reloadMediaPlayer = function(pageId, callback) {
                // Show loading indicator
                const carousel = $('#active-file-carousel');
                carousel.text('Loading media list...');
                carousel.addClass('visible');
                
                // Attempt to fetch media for the current page
                $.ajax({
                    url: `/api/media/list/${pageId}`,
                    method: 'GET',
                    success: function(response) {
                        try {
                            if (response && response.media) {
                                // Update the media list
                                mediaList = response.media;
                                localStorage.setItem('currentMedia', JSON.stringify(mediaList));
                                localStorage.setItem('newMedia', JSON.stringify(mediaList));
                                
                                // Reload the playlist UI
                                loadPlaylist();
                                
                                carousel.text(`Loaded ${mediaList.length} media files`);
                                
                                // Execute callback if provided
                                if (typeof callback === 'function') {
                                    setTimeout(callback, 100);
                                }
                            } else {
                                carousel.text('No media files found');
                                setTimeout(() => carousel.removeClass('visible'), 2000);
                                if (typeof callback === 'function') {
                                    callback();
                                }
                            }
                        } catch (error) {
                            console.error("Error processing media list:", error);
                            carousel.text('Error loading media');
                            setTimeout(() => carousel.removeClass('visible'), 2000);
                            if (typeof callback === 'function') {
                                callback();
                            }
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('Error fetching media list:', error);
                        carousel.text('Error loading media list');
                        
                        // Try alternative endpoint as fallback
                        $.ajax({
                            url: `/media/list/${pageId}`,
                            method: 'GET',
                            success: function(alternativeResponse) {
                                if (alternativeResponse && typeof alternativeResponse === 'object') {
                                    mediaList = alternativeResponse.media || [];
                                    localStorage.setItem('currentMedia', JSON.stringify(mediaList));
                                    localStorage.setItem('newMedia', JSON.stringify(mediaList));
                                    loadPlaylist();
                                    
                                    if (typeof callback === 'function') {
                                        setTimeout(callback, 100);
                                    }
                                }
                            },
                            error: function() {
                                setTimeout(() => carousel.removeClass('visible'), 2000);
                                if (typeof callback === 'function') {
                                    callback();
                                }
                            }
                        });
                    }
                });
            };
        }
        
        // Add global function to play media from other components
        // Only define if not already defined
        if (!window.playMediaAt) {
            window.playMediaAt = function(index, startTime, forceCleanSwitch = false) {
                if (mediaList && mediaList.length > index) {
                    // Force clean switching between media files
                    if (forceCleanSwitch) {
                        // Stop all players completely before starting a new one
                        if (videoPlayer && videoPlayer.media) {
                            videoPlayer.pause();
                            videoPlayer.currentTime = 0;
                            // Clean up event listeners before clearing source
                            cleanupMediaListeners(videoPlayer.media);
                            // Reset source to clear any buffered content
                            videoElement.src = '';
                            videoElement.load();
                        }
                        
                        if (audioPlayer && audioPlayer.media) {
                            audioPlayer.pause();
                            audioPlayer.currentTime = 0;
                            // Clean up event listeners before clearing source
                            cleanupMediaListeners(audioPlayer.media);
                            // Reset source to clear any buffered content
                            audioElement.src = '';
                            audioElement.load();
                        }
                        
                        // Short delay before playing new media
                        setTimeout(() => {
                            currentIndex = index;
                            
                            // Play the media - this will handle savePlaybackTime internally
                            playMedia(index, true);
                            
                            // If a specific start time was provided (versus the file's saved time)
                            // override the restored time after a delay to ensure media has loaded
                            if (startTime !== undefined && startTime !== null && !isNaN(startTime)) {
                                setTimeout(() => {
                                const media = mediaList[index];
                                const isVideoMedia = isVideo(media.extension || '');
                                const player = isVideoMedia ? videoPlayer : audioPlayer;
                                const element = isVideoMedia ? videoElement : audioElement;
                                
                                    // Only apply time if media is ready
                                        if (player && player.media && player.media.readyState >= 2) {
                                        console.log(`Explicitly setting time to ${startTime} for ${media.name}`);
                                            player.currentTime = startTime;
                                            
                                            // Make sure the time update event handles this new position
                                            if (player.media._timeUpdateHandler) {
                                                player.media._timeUpdateHandler();
                                            }
                                    }
                                }, 1000); // Longer delay to ensure player is fully initialized
                            }
                        }, 50);
                    } else {
                        // Original behavior - also needs cleanup
                        // Clean up existing players
                        if (videoPlayer && videoPlayer.media) {
                            //cleanupMediaListeners(videoPlayer.media);
                        }
                        if (audioPlayer && audioPlayer.media) {
                            //cleanupMediaListeners(audioPlayer.media);
                        }
                        
                        // Short delay before playing new media
                        setTimeout(() => {
                        currentIndex = index;

                            // Play the media - this will handle savePlaybackTime internally
                            playMediaNoDouble(index, true);

                            // If a specific start time was provided (versus the file's saved time)
                            // override the restored time after a delay to ensure media has loaded
                        if (startTime !== undefined && startTime !== null && !isNaN(startTime)) {
                                setTimeout(() => {
                            const media = mediaList[index];
                            const isVideoMedia = isVideo(media.extension || '');
                            const player = isVideoMedia ? videoPlayer : audioPlayer;
                            const element = isVideoMedia ? videoElement : audioElement;
                            
                                    // Only apply time if media is ready
                                    if (player && player.media && player.media.readyState >= 2) {
                                        console.log(`Explicitly setting time to ${startTime} for ${media.name}`);
                                    player.currentTime = startTime;
                                    
                                        // Make sure the time update event handles this new position
                                    if (player.media._timeUpdateHandler) {
                                        player.media._timeUpdateHandler();
                                    }
                                    }
                                }, 1000); // Longer delay to ensure player is fully initialized
                            }
                        }, 50);
                    }
                }
            };
        }
        
        // Fix for Plyr menu display issues
        $(document).on('click', '.plyr__control--forward', function(e) {
            // Find the menu container
            const menuContainer = $('.plyr__menu__container');
            
            // Make sure it's visible and on top
            menuContainer.css({
                'z-index': '99999',
                'visibility': 'visible',
                'opacity': '1',
                'transform': 'scale(1)'
            });
            
            // Prevent hiding when clicking inside the menu
            e.stopPropagation();
        });
        
        // When clicking the settings button
        $(document).on('click', '.plyr__menu button', function() {
            setTimeout(function() {
                $('.plyr__menu__container').css('z-index', '99999');
            }, 10);
        });
        
        // Add event listeners for play/pause buttons to show carousel
        videoPlayer.on('play', function() {
            showCarouselOnPlayback();
        });
        
        audioPlayer.on('play', function() {
            showCarouselOnPlayback();
        });
        
        // Set up enhanced event listeners after Plyr is initialized
        function setupEnhancedEventListeners() {
            // First remove any existing ended event listeners
            if (videoElement) {
                const existingListeners = videoElement._endedHandlers || [];
                existingListeners.forEach(handler => {
                    videoElement.removeEventListener('ended', handler);
                });
                videoElement._endedHandlers = [];
            }
            
            if (audioElement) {
                const existingListeners = audioElement._endedHandlers || [];
                existingListeners.forEach(handler => {
                    audioElement.removeEventListener('ended', handler);
                });
                audioElement._endedHandlers = [];
            }
            
            // Create our tracked handler for video element
            const videoEndedHandler = function(event) {
                // Use a small delay to avoid conflicts with the Plyr event handler
                setTimeout(() => handleMediaEnded('video-element-enhanced'), 10);
            };
            
            // Create our tracked handler for audio element
            const audioEndedHandler = function(event) {
                // Use a small delay to avoid conflicts with the Plyr event handler
                setTimeout(() => handleMediaEnded('audio-element-enhanced'), 10); 
            };
            
            // Store references to these specific handlers for future cleanup
            videoElement._endedHandlers = videoElement._endedHandlers || [];
            videoElement._endedHandlers.push(videoEndedHandler);
            
            audioElement._endedHandlers = audioElement._endedHandlers || [];
            audioElement._endedHandlers.push(audioEndedHandler);
            
            // Add our tracked handlers
            videoElement.addEventListener('ended', videoEndedHandler);
            audioElement.addEventListener('ended', audioEndedHandler);
            
            // Also add seeking event prevention to avoid false ended events
            videoElement.addEventListener('timeupdate', function() {
                // If we're within 1 second of the end, enforce a clean ending
                if (videoElement.duration && 
                    (videoElement.currentTime > videoElement.duration - 1) && 
                    (videoElement.currentTime < videoElement.duration)) {
                    // Mark the media as about to end to avoid seeking issues
                    videoElement._aboutToEnd = true;
                }
            });
            
            audioElement.addEventListener('timeupdate', function() {
                // If we're within 1 second of the end, enforce a clean ending
                if (audioElement.duration && 
                    (audioElement.currentTime > audioElement.duration - 1) &&
                    (audioElement.currentTime < audioElement.duration)) {
                    // Mark the media as about to end to avoid seeking issues
                    audioElement._aboutToEnd = true;
                }
            });
            
            // Prevent seeking while a media is about to end
            videoElement.addEventListener('seeking', function(e) {
                if (videoElement._aboutToEnd && 
                    videoElement.currentTime < videoElement.duration - 1) {
                    // User is trying to seek away from the end
                    videoElement._aboutToEnd = false;
                }
            });
            
            audioElement.addEventListener('seeking', function(e) {
                if (audioElement._aboutToEnd && 
                    audioElement.currentTime < audioElement.duration - 1) {
                    // User is trying to seek away from the end
                    audioElement._aboutToEnd = false;
                }
            });
            
            console.log('Enhanced event listeners for auto-continue have been set up');
        }
        
        // Call this setup function once Plyr is initialized
        setupEnhancedEventListeners();
        
        // Add event listeners for when media playback ends (Plyr wrapper)
        let isProcessingEndEvent = false; // Flag to prevent multiple calls
        let lastEndedTime = 0; // Timestamp of the last ended event

        videoPlayer.on('ended', function() {
            handleMediaEnded('video-plyr');
        });
        
        audioPlayer.on('ended', function() {
            handleMediaEnded('audio-plyr');
        });
        
        // Add direct event listeners to native HTML elements as well
        videoElement.addEventListener('ended', function() {
            // Use a small delay to avoid conflicts with the Plyr event handler
            setTimeout(() => handleMediaEnded('video-element'), 10);
        });
        
        audioElement.addEventListener('ended', function() {
            // Use a small delay to avoid conflicts with the Plyr event handler
            setTimeout(() => handleMediaEnded('audio-element'), 10);
        });
        
        // Function to handle what happens when media playback ends
        function handleMediaEnded(source) {
            // Prevent multiple rapid calls that could cause track skipping
            const now = Date.now();
            if (isProcessingEndEvent || (now - lastEndedTime < 1000)) {
                console.log(`Ignoring duplicate ended event from ${source}, already processing or too soon`);
                return;
            }
            
            // Set flag to prevent multiple processing
            isProcessingEndEvent = true;
            lastEndedTime = now;
            
            console.log(`Media ended event from source: ${source}, currentIndex: ${currentIndex}`);
            
            // Double-check that the current media is actually at or near its end
            const currentMedia = mediaList[currentIndex];
            const isVideoFile = currentMedia && isVideo(currentMedia.extension || '');
            const player = isVideoFile ? videoPlayer : audioPlayer;
            const element = isVideoFile ? videoElement : audioElement;
            
            // Only proceed if we're really at the end of the track
            // (within 3 seconds of the end or reached the end)
            if (player && player.media && player.media.duration) {
                const timeRemaining = player.media.duration - player.media.currentTime;
                console.log(`Time remaining: ${timeRemaining} seconds of ${player.media.duration}`);
                
                if (timeRemaining > 3 && !player.media.ended) {
                    console.log("Media not actually at end, ignoring ended event");
                    isProcessingEndEvent = false;
                    return;
                }
            }
            
            // Check if there's a next track in the playlist
            if (mediaList.length > 0 && currentIndex < mediaList.length - 1) {
                // Calculate the next index
                const nextIndex = currentIndex + 1;
                console.log(`Playing next track, advancing from ${currentIndex} to ${nextIndex}`);
                
                // Show a notification in the carousel
                const carousel = $('#active-file-carousel');
                const nextMedia = mediaList[nextIndex];
                if (nextMedia) {
                    carousel.text(`Playing next: ${nextMedia.name}`);
                    carousel.addClass('visible');
                    
                    // Check if text overflows and apply sliding animation if needed
                    setTimeout(function() {
                        checkTextOverflow(carousel);
                    }, 20);
                }
                
                // Use setTimeout to allow for cleanup before playing the next track
                setTimeout(() => {
                    // Double check we haven't already moved on (prevents double advancing)
                    if (currentIndex === nextIndex - 1) {
                        // Play the next track
                        playMedia(nextIndex, false);
                    } else {
                        console.log(`Index changed during timeout: ${currentIndex} vs expected ${nextIndex - 1}`);
                    }
                    // Reset flag after a delay
                    setTimeout(() => { isProcessingEndEvent = false; }, 500);
                }, 100);
            } else if (mediaList.length > 0 && currentIndex === mediaList.length - 1) {
                // If this was the last track, show a message
                const carousel = $('#active-file-carousel');
                carousel.text('所有文件播放完毕！');
                carousel.addClass('visible');
                
                // Hide the carousel after a few seconds
                setTimeout(function() {
                    carousel.removeClass('visible');
                    isProcessingEndEvent = false; // Reset flag
                }, 3000);
            } else {
                // Just hide the carousel as there's no next track
                $('#active-file-carousel').removeClass('visible');
                isProcessingEndEvent = false; // Reset flag
            }
        }
        
        // Also listen for pause events to keep carousel visible
        videoPlayer.on('pause', function() {
            // Keep carousel visible on pause
            const carousel = $('#active-file-carousel');
            if (mediaList.length > 0 && currentIndex >= 0) {
                if (!carousel.hasClass('visible')) {
                    const currentMedia = mediaList[currentIndex];
                    if (currentMedia) {
                        carousel.text('正在收听: '+currentMedia.name);
                        carousel.addClass('visible');
                        // Check if text overflows and apply sliding animation if needed
                        setTimeout(function() {
                            checkTextOverflow(carousel);
                        }, 20);
                    }
                }
                resetInactivityTimer();
            }
        });
        
        audioPlayer.on('pause', function() {
            // Keep carousel visible on pause
            const carousel = $('#active-file-carousel');
            if (mediaList.length > 0 && currentIndex >= 0) {
                if (!carousel.hasClass('visible')) {
                    const currentMedia = mediaList[currentIndex];
                    if (currentMedia) {
                        carousel.text('正在收听: '+currentMedia.name);
                        carousel.addClass('visible');
                        // Check if text overflows and apply sliding animation if needed
                        setTimeout(function() {
                            checkTextOverflow(carousel);
                        }, 20);
                    }
                }
                resetInactivityTimer();
            }
        });
        
        // Add explicit click handlers for the Plyr play/pause controls
        $(document).on('click', '.plyr__controls button[data-plyr="play"]', function() {
            showCarouselOnPlayback();
        });
        
        $(document).on('click', '.plyr__controls button[data-plyr="pause"]', function() {
            // Keep carousel visible when pause button is clicked
            const carousel = $('#active-file-carousel');
            if (mediaList.length > 0 && currentIndex >= 0) {
                if (!carousel.hasClass('visible')) {
                    const currentMedia = mediaList[currentIndex];
                    if (currentMedia) {
                        carousel.text('正在收听: '+currentMedia.name);
                        carousel.addClass('visible');
                        // Check if text overflows and apply sliding animation if needed
                        setTimeout(function() {
                            checkTextOverflow(carousel);
                        }, 20);
                    }
                }
                resetInactivityTimer();
            }
        });
        
        // Function to show carousel when play button is clicked
        function showCarouselOnPlayback() {
            if (mediaList.length === 0) return;
            
            const carousel = $('#active-file-carousel');
            const currentMedia = mediaList[currentIndex];
            
            if (currentMedia) {
                carousel.text('正在收听: '+currentMedia.name);
                carousel.addClass('visible');
                
                // Check if text overflows and apply sliding animation if needed
                setTimeout(function() {
                    checkTextOverflow(carousel);
                }, 20);
                
                // Reset inactivity timer
                resetInactivityTimer();
            }
        }
        
        let storedMedia = localStorage.getItem('currentMedia');
        
        if(storedMedia != '[]' && storedMedia != null && storedMedia != 'null') {
            setTimeout(function () {
                $("#media-container").removeAttr('hidden');
                $("#media-container").css('display', 'flex');
                $("#media-container").addClass("minimized");
            },100)
        }
        let mediaList = storedMedia && storedMedia !== 'null' ? JSON.parse(storedMedia) : [];

        let playlistContainer = $("#playlist");
        let currentIndex = 0;

        function isVideo(extension) {
            return ["mp4", "mov", "avi", "mkv", "webm"].includes(extension.toLowerCase());
        }

        function isAudio(extension) {
            return ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(extension.toLowerCase());
        }
        
        // Function to update active state in playlist
        function updateActiveItem(index) {
            if (index >= 0 && index < mediaList.length) {
                $("#playlist li").removeClass("active");
                const activeItem = $(`#playlist li[data-index="${index}"]`);
                activeItem.addClass("active");
                
                // Scroll the active item into view if player is expanded
                if (activeItem.length > 0 && $("#media-container").hasClass("expanded")) {
                    const container = $("#playlist");
                    const itemTop = activeItem.position().top;
                    const itemHeight = activeItem.outerHeight();
                    const containerHeight = container.height();
                    const scrollTop = container.scrollTop();
                    
                    // If item is not fully visible, scroll to make it visible
                    if (itemTop < 0 || itemTop + itemHeight > containerHeight) {
                        container.animate({
                            scrollTop: scrollTop + itemTop - (containerHeight / 2) + (itemHeight / 2)
                        }, 300);
                    }
                }
            }
        }
        
        // Load the playlist dynamically
        function loadPlaylist() {
            if(Array.isArray(mediaList) && mediaList.length > 0){
                playlistContainer.empty();
                mediaList.forEach((media, index) => {
                    // Ensure media has required properties
                    if (!media.extension) {
                        // Try to determine extension from URL or name
                        const url = media.url || '';
                        const name = media.name || '';
                        const urlExtMatch = url.match(/\.([a-zA-Z0-9]+)(\?|#|$)/);
                        const nameExtMatch = name.match(/\.([a-zA-Z0-9]+)$/);
                        
                        media.extension = (urlExtMatch && urlExtMatch[1]) || 
                                          (nameExtMatch && nameExtMatch[1]) || 
                                          'mp3'; // Default to mp3
                    }
                    
                    let mediaType = isVideo(media.extension) ? "📹 " : "🔊 ";
                    let listItem = $(`<li data-src="${media.url}" data-extension="${media.extension}" data-index="${index}">
                        <span class="playing-indicator">▶</span> ${mediaType} - ${media.name}
                    </li>`);
                    playlistContainer.append(listItem);
                });
                
                // Update the display
                $("#media-container").removeAttr('hidden');
                $("#media-container").css('display', 'flex');
                
                // Make sure player is visible
                if (!$("#media-container").hasClass("minimized") && !$("#media-container").hasClass("expanded")) {
                    $("#media-container").addClass("minimized");
                }
            } else {
                // No media available
                playlistContainer.empty();
                playlistContainer.append('<li class="no-media">No media files available</li>');
            }
        }

        function stopPlayers() {
            if (videoPlayer && videoPlayer.media) {
                videoPlayer.stop();
                videoElement.src = "";
                videoElement.load();
            }
        
            if (audioPlayer && audioPlayer.media) {
                audioPlayer.stop();
                audioElement.src = "";
                audioElement.load();
            }
        }
        $("#close-media").click(function() {
            localStorage.setItem('currentMedia', null);
            localStorage.setItem("lastPlayedMedia", null)
            $("#media-container").css('display', "none");
            stopPlayers();
        })

        // Function to clean up event listeners to prevent memory leaks
        function cleanupMediaListeners(element) {
            if (!element) return;
            
            // Remove timeupdate event listeners
            if (element._timeUpdateHandler) {
                try {
                    element.removeEventListener("timeupdate", element._timeUpdateHandler);
                    element._timeUpdateHandler = null;
                } catch (e) {
                    console.error("Error removing timeupdate listener:", e);
                }
            }
            
            // If the element has any custom ended event listeners, remove them
            if (element._endedHandlers && Array.isArray(element._endedHandlers)) {
                try {
                    element._endedHandlers.forEach(handler => {
                        if (typeof handler === 'function') {
                            element.removeEventListener('ended', handler);
                        }
                    });
                    element._endedHandlers = null;
                } catch (e) {
                    console.error("Error removing ended handlers:", e);
                }
            }
            
            // Remove loadedmetadata and loadeddata listeners
            try {
                // Use cloning to remove all listeners - most complete approach
                const clonedElement = element.cloneNode(true);
                
                // Preserve important properties before replacing
                const currentSrc = element.src;
                const currentTime = element.currentTime;
                const muted = element.muted;
                const volume = element.volume;
                
                if (element.parentNode) {
                    element.parentNode.replaceChild(clonedElement, element);
                    
                    // Restore important properties on the new element
                    clonedElement.src = currentSrc;
                    if (currentTime > 0) {
                        // Wait for metadata to load before setting time
                        clonedElement.addEventListener('loadedmetadata', function onceReady() {
                            clonedElement.currentTime = currentTime;
                            clonedElement.removeEventListener('loadedmetadata', onceReady);
                        }, { once: true });
                    }
                    clonedElement.muted = muted;
                    clonedElement.volume = volume;
                    
                    return clonedElement;
                }
            } catch (e) {
                console.error("Failed to replace element for complete cleanup:", e);
                
                // Fallback approach - remove known listeners
                try {
                    // Common event listeners to explicitly remove
                    const commonEvents = ["loadedmetadata", "loadeddata", "play", "pause", "ended", "timeupdate"];
                    commonEvents.forEach(eventName => {
                        // Can't remove anonymous listeners without reference, but this helps clean some
                        element[`on${eventName}`] = null;
                    });
                } catch (fallbackError) {
                    console.error("Failed listener cleanup fallback:", fallbackError);
                }
            }
            
            return element;
        }

        // Play selected media
        function playMedia(index, isUserAction = false) {
            if (mediaList.length === 0) return;
            const videoElement1 = document.querySelector(".plyr.plyr--video");
            const audioElement1 = document.querySelector(".plyr.plyr--audio");

            if (!videoElement1 || !audioElement1) {
                return;
            }
            
            // Ensure all players are in a clean state before starting
            if (videoPlayer && videoPlayer.media) {
                videoPlayer.pause();
                // Clean up event listeners
                if (videoPlayer.media._timeUpdateHandler) {
                    videoPlayer.media.removeEventListener("timeupdate", videoPlayer.media._timeUpdateHandler);
                    videoPlayer.media._timeUpdateHandler = null;
                }
            }
            
            if (audioPlayer && audioPlayer.media) {
                audioPlayer.pause();
                // Clean up event listeners
                if (audioPlayer.media._timeUpdateHandler) {
                    audioPlayer.media.removeEventListener("timeupdate", audioPlayer.media._timeUpdateHandler);
                    audioPlayer.media._timeUpdateHandler = null;
                }
            }
            
            currentIndex = index;
            let media = mediaList[currentIndex];
            let mediaPath = `${media.url}`;
            
            // Reset the end event processing flag since we're starting a new file
            isProcessingEndEvent = false;
            
            // Stop all players and ensure they're in a clean state
            stopPlayers();

            // Update playlist styling for active item
            updateActiveItem(index);

            // Update and show the carousel with animation for file name display
            const carousel = $('#active-file-carousel');
            const fileName = media.name;
            
            // If carousel is already visible, animate the change
            if (carousel.hasClass('visible')) {
                carousel.css('animation', 'carouselUpdate 1s ease');
                setTimeout(function() {
                    carousel.text('正在收听: '+fileName);
                    // Check if text overflows and apply sliding animation if needed
                    setTimeout(function() {
                        checkTextOverflow(carousel);
                    }, 20);
                }, 500); // Update text at midpoint of animation
            } else {
                // First time display
                carousel.text('正在收听: '+fileName);
                carousel.addClass('visible');
                // Check if text overflows and apply sliding animation if needed
                setTimeout(function() {
                    checkTextOverflow(carousel);
                }, 20);
            }

            // Create a unique storage key for this specific media file
            const storageKey = "mediaTime_" + mediaPath;
            
            if (isVideo(media.extension)) {
                $("#audio-player").hide();
                // Reset audio source to prevent lingering audio
                if (audioElement) {
                    audioElement.src = '';
                    audioElement.load();
                }
                
                // Set new video source
                $("#media-player").show().attr("src", mediaPath);
                
                // Style adjustments
                audioElement1.style.display = "none";
                videoElement1.style.display = "block";
                videoPlayer.muted = false;
                
                // Add a delay before playing to allow the browser to process the change
                setTimeout(() => {
                    // Reset about to end flags
                    if (videoElement) videoElement._aboutToEnd = false;
                    if (audioElement) audioElement._aboutToEnd = false;
                    
                    // Re-setup enhanced event listeners after source change
                    setupEnhancedEventListeners();
                    
                    // Only try to restore time for the specific media file that is currently being played
                    // This avoids applying one file's position to a different file
                    restorePlaybackTime(videoPlayer, mediaPath);
                    attemptPlay(videoPlayer, videoElement, isUserAction);
                    
                    // Save playback position for the current media file
                    savePlaybackTime(videoPlayer, mediaPath);
                }, 50);
            } else {
                $("#media-player").hide();
                // Reset video source to prevent lingering video
                if (videoElement) {
                    videoElement.src = '';
                    videoElement.load();
                }
                
                // Set new audio source
                $("#audio-player").show().attr("src", mediaPath);
                
                // Style adjustments
                videoElement1.style.display = "none";
                audioElement1.style.display = "block";
                
                // Add a delay before playing to allow the browser to process the change
                setTimeout(() => {
                    // Reset about to end flags
                    if (videoElement) videoElement._aboutToEnd = false;
                    if (audioElement) audioElement._aboutToEnd = false;
                    
                    // Re-setup enhanced event listeners after source change
                    setupEnhancedEventListeners();
                    
                    // Only try to restore time for the specific media file that is currently being played
                    // This avoids applying one file's position to a different file
                    restorePlaybackTime(audioPlayer, mediaPath);
                    attemptPlay(audioPlayer, audioElement, isUserAction);
                    
                    // Save playback position for the current media file
                    savePlaybackTime(audioPlayer, mediaPath);
                }, 1000);
            }

            // Save the last played media
            localStorage.setItem("lastPlayedMedia", mediaPath);
        }

        function playMediaNoDouble(index, isUserAction = false) {
            // Add a flag to prevent multiple playback attempts
            if (window.isPlaying) {
                console.log("Playback already in progress, skipping duplicate");
                return;
            }
            window.isPlaying = true;

            if (mediaList.length === 0) return;
            const videoElement1 = document.querySelector(".plyr.plyr--video");
            const audioElement1 = document.querySelector(".plyr.plyr--audio");

            if (!videoElement1 || !audioElement1) {
                window.isPlaying = false;
                return;
            }

            // Ensure all players are in a clean state before starting
            if (videoPlayer && videoPlayer.media) {
                videoPlayer.pause();
                // Clean up event listeners
                if (videoPlayer.media._timeUpdateHandler) {
                    videoPlayer.media.removeEventListener("timeupdate", videoPlayer.media._timeUpdateHandler);
                    videoPlayer.media._timeUpdateHandler = null;
                }
            }

            if (audioPlayer && audioPlayer.media) {
                audioPlayer.pause();
                // Clean up event listeners
                if (audioPlayer.media._timeUpdateHandler) {
                    audioPlayer.media.removeEventListener("timeupdate", audioPlayer.media._timeUpdateHandler);
                    audioPlayer.media._timeUpdateHandler = null;
                }
            }

            currentIndex = index;
            let media = mediaList[currentIndex];
            let mediaPath = `${media.url}`;

            // Reset the end event processing flag since we're starting a new file
            isProcessingEndEvent = false;

            // Stop all players and ensure they're in a clean state
            stopPlayers();

            // Update playlist styling for active item
            updateActiveItem(index);

            // Update and show the carousel with animation for file name display
            const carousel = $('#active-file-carousel');
            const fileName = media.name;

            // If carousel is already visible, animate the change
            if (carousel.hasClass('visible')) {
                carousel.css('animation', 'carouselUpdate 1s ease');
                setTimeout(function() {
                    carousel.text('正在收听: '+fileName);
                    // Check if text overflows and apply sliding animation if needed
                    setTimeout(function() {
                        checkTextOverflow(carousel);
                    }, 20);
                }, 500); // Update text at midpoint of animation
            } else {
                // First time display
                carousel.text('正在收听: '+fileName);
                carousel.addClass('visible');
                // Check if text overflows and apply sliding animation if needed
                setTimeout(function() {
                    checkTextOverflow(carousel);
                }, 20);
            }

            // Create a unique storage key for this specific media file
            const storageKey = "mediaTime_" + mediaPath;

            if (isVideo(media.extension)) {
                $("#audio-player").hide();
                // Reset audio source to prevent lingering audio
                if (audioElement) {
                    audioElement.src = '';
                    audioElement.load();
                }

                // Set new video source
                $("#media-player").show().attr("src", mediaPath);

                // Style adjustments
                audioElement1.style.display = "none";
                videoElement1.style.display = "block";
                videoPlayer.muted = false;

                // Add a delay before playing to allow the browser to process the change
                setTimeout(() => {
                    // Reset about to end flags
                    if (videoElement) videoElement._aboutToEnd = false;
                    if (audioElement) audioElement._aboutToEnd = false;

                    // Re-setup enhanced event listeners after source change
                    setupEnhancedEventListeners();

                    // Only try to restore time for the specific media file that is currently being played
                    // This avoids applying one file's position to a different file
                    restorePlaybackTime(videoPlayer, mediaPath);
                    attemptPlay(videoPlayer, videoElement, isUserAction);

                    // Save playback position for the current media file
                    savePlaybackTime(videoPlayer, mediaPath);
                }, 1000);
            } else {
                $("#media-player").hide();
                // Reset video source to prevent lingering video
                if (videoElement) {
                    videoElement.src = '';
                    videoElement.load();
                }

                // Set new audio source
                $("#audio-player").show().attr("src", mediaPath);

                // Style adjustments
                videoElement1.style.display = "none";
                audioElement1.style.display = "block";

                // Add a delay before playing to allow the browser to process the change
                setTimeout(() => {
                    // Reset about to end flags
                    if (videoElement) videoElement._aboutToEnd = false;
                    if (audioElement) audioElement._aboutToEnd = false;

                    // Re-setup enhanced event listeners after source change
                    setupEnhancedEventListeners();

                    // Only try to restore time for the specific media file that is currently being played
                    // This avoids applying one file's position to a different file
                    restorePlaybackTime(audioPlayer, mediaPath);
                    attemptPlay(audioPlayer, audioElement, isUserAction);

                    // Save playback position for the current media file
                    savePlaybackTime(audioPlayer, mediaPath);
                }, 1000);
            }
            
            // Save the last played media
            localStorage.setItem("lastPlayedMedia", mediaPath);

            // Reset the playing flag after a delay
            setTimeout(() => {
                window.isPlaying = false;
            }, 2000); // 2 second delay before allowing new playback
        }

        function attemptPlay(player, element, isUserAction = false) {
            // Make sure the player is in a fresh state
            if (player.media) {
                // Ensure we're using the right player (sometimes Plyr can lose its connection)
                if (player.media !== element) {
                    player.media = element;
                }
                
                // Attempt to play with better error handling
                if (isUserAction) {
                    let playPromise = player.play();
                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                            console.log("Playback started successfully");
                        })
                        .catch((error) => {
                            console.error("Playback error:", error);
                            
                            // Try a different approach if the media failed to play
                            // Sometimes direct element method works when Plyr doesn't
                            setTimeout(() => {
                                try {
                                    // Try direct element play as a fallback
                                    element.play()
                                        .catch(e => {
                                            console.error("Direct play attempt also failed:", e);
                                            
                                            // Create a hidden play button as last resort
                                            let playButton = $("<button id='manual-play' style='position:absolute; opacity:0;'></button>");
                                            $("body").append(playButton);
                                            
                                            // Try to click it
                                            setTimeout(() => {
                                                playButton[0].click();
                                                playButton.remove();
                                            }, 100);
                                        });
                                } catch (fallbackError) {
                                    console.error("All playback attempts failed:", fallbackError);
                                }
                            }, 100);
                        });
                    } else {
                        // For older browsers that don't return a promise
                        setTimeout(() => {
                            if (element.paused) {
                                console.warn("Play didn't return promise and media is still paused");
                                try {
                                    element.play();
                                } catch (e) {
                                    console.error("Legacy play attempt failed:", e);
                                }
                            }
                        }, 100);
                    }
                }
            } else {
                console.error("Invalid player object");
            }
        }

        function restartPlayback(index) {
            playMedia(index, false);
        }
        
        // Click event to play selected track
        $("#playlist").on("click", "li", function () {
            let index = $(this).data("index");
            playMedia(index, true);
        });
        $("#toggle-player").click(function () {
            $("#media-container").toggleClass("minimized expanded");
            let btn = $(this);
            btn.text(btn.text() === "▼" ? "▲" : "▼");
        });
        
        // Add reload functionality
        $("#reload-media").click(function() {
            // Show a quick visual feedback for the button click
            const btn = $(this);
            btn.css('transform', 'rotate(360deg)');
            setTimeout(() => btn.css('transform', ''), 500);
            
            // Get the current page ID from the URL or data attribute
            let currentPageId = window.location.pathname.split('/').pop();
            if (isNaN(currentPageId)) {
                // If not a number, try to get from a data attribute or the existing pageId
                currentPageId = $('meta[name="page-id"]').attr('content') || pageId;
            }
            
            if (!currentPageId) {
                console.error('Could not determine page ID for reloading media files');
                return;
            }
            
            // Show loading indicator in the carousel
            const carousel = $('#active-file-carousel');
            carousel.text('Refreshing media list...');
            carousel.addClass('visible');
            
            // Fetch the updated media list
            $.ajax({
                url: `/api/media/list/${currentPageId}`,
                method: 'GET',
                success: function(response) {
                    try {
                        // Update the media list
                        if (response && response.media) {
                            mediaList = response.media;
                            localStorage.setItem('currentMedia', JSON.stringify(mediaList));
                            loadPlaylist();
                            
                            // Update carousel with success message
                            carousel.text(`Loaded ${mediaList.length} media files`);
                            setTimeout(() => {
                                if (mediaList.length > 0) {
                                    // Play the first item
                                    currentIndex = 0;
                                    playMedia(0);
                                    // Ensure active styling is applied
                                    updateActiveItem(0);
                                } else {
                                    carousel.removeClass('visible');
                                }
                            }, 1500);
                        } else {
                            // Handle empty response
                            carousel.text('No media files found');
                            setTimeout(() => carousel.removeClass('visible'), 2000);
                        }
                    } catch (error) {
                        console.error('Error processing media list:', error);
                        carousel.text('Error loading media files');
                        setTimeout(() => carousel.removeClass('visible'), 2000);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error fetching media list:', error);
                    carousel.text('Error refreshing media list');
                    setTimeout(() => carousel.removeClass('visible'), 2000);
                    
                    // Fallback: Try alternative endpoint if API fails
                    $.ajax({
                        url: `/media/list/${currentPageId}`,
                        method: 'GET',
                        success: function(alternativeResponse) {
                            if (alternativeResponse && typeof alternativeResponse === 'object') {
                                mediaList = alternativeResponse.media || [];
                                localStorage.setItem('currentMedia', JSON.stringify(mediaList));
                                loadPlaylist();
                                
                                carousel.text(`Loaded ${mediaList.length} media files (fallback)`);
                                setTimeout(() => {
                                    if (mediaList.length > 0) {
                                        currentIndex = 0;
                                        playMedia(0);
                                        // Ensure active styling is applied 
                                        updateActiveItem(0);
                                    } else {
                                        carousel.removeClass('visible');
                                    }
                                }, 1500);
                            }
                        }
                    });
                }
            });
        });
    
        // Close Player
        $("#close-media").click(function() {
            localStorage.setItem('currentMedia', null);
            localStorage.setItem("lastPlayedMedia", null);
            $("#media-container").hide();
        });
    
        // Ensure Player is Always Visible
        $("#media-container").show();

        // Save playback position in localStorage
        function savePlaybackTime(player, mediaPath) {
            if (!player || !player.media || !mediaPath) {
                console.warn("Invalid parameters for savePlaybackTime");
                return;
            }
            
            // Remove any existing timeupdate handlers for this media element
            if (player.media._timeUpdateHandler) {
                try {
                    player.media.removeEventListener("timeupdate", player.media._timeUpdateHandler);
                    player.media._timeUpdateHandler = null;
                } catch (e) {
                    console.error("Error removing existing timeupdate handler:", e);
                }
            }
            
            // Create a unique storage key for this specific media file
            const storageKey = "mediaTime_" + mediaPath;
            
            // Create a unique event handler function that we can reference for removal
            const timeUpdateHandler = function() {
                try {
                    // Verify we're still playing the same media
                    if (!player.media.src.includes(mediaPath.split("?")[0])) {
                        // If media source has changed, remove this handler
                        console.warn("Media source changed, removing outdated timeupdate handler");
                        player.media.removeEventListener("timeupdate", timeUpdateHandler);
                        return;
                    }
                    
                    const currentTime = player.media.currentTime;
                    // Only save time if we're not at the very beginning or end
                    if (currentTime > 0.5) { // Avoid saving positions very close to the start
                        if (player.media.duration) {
                            // If we're near the end of the media, don't save this position
                            if (currentTime >= player.media.duration - 2) {
                                //console.warn(`Near end of media (${currentTime}/${player.media.duration}), not saving position`);
                                return;
                            }
                        }
                        
                        // Save position for this specific media file
                        localStorage.setItem(storageKey, currentTime.toString());
                        
                        // Log less frequently to avoid console spam
                        if (Math.floor(currentTime) % 5 === 0) { // Log every 5 seconds
                            //console.info(`Saving position for ${mediaPath}: ${currentTime}`);
                        }
                    }
                } catch (e) {
                    console.error("Error in timeupdate handler:", e);
                }
            };
            
            // Add the event listener for this specific media
            player.media.addEventListener("timeupdate", timeUpdateHandler);
            
            // Store the handler on the media element for later cleanup
            player.media._timeUpdateHandler = timeUpdateHandler;
            
            // Debug log
            console.log(`Set up savePlaybackTime for ${mediaPath}`);
        }
        
        function restorePlaybackTime(player, mediaPath) {
            // Only restore time if we have valid parameters
            if (!player || !player.media || !mediaPath) {
                console.warn("Invalid parameters for restorePlaybackTime");
                return;
            }
            
            console.log(`Attempting to restore playback time for ${mediaPath}`);
            
            // Create a unique key for this specific media file
            const storageKey = "mediaTime_" + mediaPath;
            let savedTime = localStorage.getItem(storageKey);
            
            // Only restore if this specific media file has a saved position
            if (savedTime) {
                try {
                    // Convert to a number and validate
                    savedTime = parseFloat(savedTime);
                    
                    if (isNaN(savedTime) || savedTime < 0) {
                        console.warn(`Invalid saved time for ${mediaPath}: ${savedTime}`);
                        return;
                    }
                    
                    console.log(`Found saved position for ${mediaPath}: ${savedTime}`);
                    
                    // Function to set the playback time once media is ready
                    const setPlaybackTimeWhenReady = function() {
                        try {
                            // Verify we're still dealing with the same media by checking the source URL
                            // This prevents applying one file's position to another file
                            if (!player.media.src.includes(mediaPath.split("?")[0])) {
                                console.warn("Media source changed since restore was requested - aborting restore");
                                player.media.removeEventListener("loadedmetadata", setPlaybackTimeWhenReady);
                                return;
                            }
                            
                            // Double check readyState to ensure metadata is loaded
                            if (player.media.readyState > 0) {
                                // Don't restore if at the very end (prevent auto-finishing)
                                if (player.media.duration && savedTime >= player.media.duration - 2) {
                                    console.log(`Saved position was at end of media (${savedTime}/${player.media.duration}), starting from beginning`);
                                    player.media.currentTime = 0;
                                } else {
                                    console.log(`Restoring position for ${mediaPath} to ${savedTime}`);
                                    player.media.currentTime = savedTime;
                                }
                                
                                // Clean up the event listener
                                player.media.removeEventListener("loadedmetadata", setPlaybackTimeWhenReady);
                            }
                        } catch (e) {
                            console.error("Error in setPlaybackTimeWhenReady:", e);
                            player.media.removeEventListener("loadedmetadata", setPlaybackTimeWhenReady);
                        }
                    };
                    
                    // Add an event listener for when metadata is loaded
                    player.media.addEventListener("loadedmetadata", setPlaybackTimeWhenReady);
                    
                    // If already loaded, try to set time immediately
                    if (player.media.readyState > 0) {
                        setPlaybackTimeWhenReady();
                    }
                } catch (error) {
                    console.error(`Error restoring playback time for ${mediaPath}:`, error);
                }
            } else {
                // No saved time for this media, ensure we start from the beginning
                console.log(`No saved position found for ${mediaPath}, starting from beginning`);
                setTimeout(() => {
                    if (player.media.readyState > 0) {
                        player.media.currentTime = 0;
                    }
                }, 100);
            }
        }
        
        // First, load the playlist dynamically
        loadPlaylist();
        
        // Then, load and play the initial media file
        let lastPlayed = localStorage.getItem("lastPlayedMedia");
        if (lastPlayed != 'null' && lastPlayed != null) {
            let foundIndex = mediaList.findIndex(media => media.url === lastPlayed);
            if (foundIndex !== -1) {
                currentIndex = foundIndex; // Set current index
                playMedia(foundIndex, false);
                updateActiveItem(foundIndex); // Update active styling
            }
        } else if (mediaList && mediaList.length > 0) {
            currentIndex = 0; // Start with the first media
            playMedia(0, false);
            updateActiveItem(0); // Update active styling
        }
        
        // Function to check if text overflows and apply sliding animation
        function checkTextOverflow(element) {
            // Remove any existing animation classes
            element.removeClass('text-overflow');
            element.css('animation', '');
            
            // Get the width of the text content vs container
            const scrollWidth = element[0].scrollWidth;
            const clientWidth = element[0].clientWidth;
            
            // If content is wider than container, apply sliding animation
            if (scrollWidth > clientWidth) {
                element.addClass('text-overflow');
            } else {
                // Apply normal appearance animation if no overflow
                element.css('animation', 'carouselAppear 0.7s ease-out, subtlePulse 3s ease-in-out infinite');
            }
            
            // Reset the inactivity timer whenever we show the carousel
            resetInactivityTimer();
        }
        
        // Inactivity timer functionality
        let inactivityTimer;
        const inactivityTimeout = 5000; // 3 seconds
        
        function hideCarouselOnInactivity() {
            $('#active-file-carousel').removeClass('visible text-overflow');
        }
        
        function resetInactivityTimer() {
            // Only reset if the carousel is already visible
            if ($('#active-file-carousel').hasClass('visible')) {
                // Clear any existing timer
                clearTimeout(inactivityTimer);
                
                // Set a new timer to hide after inactivity
                inactivityTimer = setTimeout(hideCarouselOnInactivity, inactivityTimeout);
            }
        }
        
        // Track user activity
        $(document).on('mousemove click keypress scroll touchstart', function() {
            // Only reset the inactivity timer if carousel is already visible
            // This prevents carousel from appearing on mouse movement
            if (mediaList.length > 0 && currentIndex >= 0 && 
                !$("#media-container").is(":hidden")) {
                
                const carousel = $('#active-file-carousel');
                if (carousel.hasClass('visible')) {
                    // Only reset the timer if carousel is already visible
                    // Don't show the carousel just because of mouse movement
                    resetInactivityTimer();
                }
            }
        });

        // Hide carousel when closing the player
        $('#close-media').on('click', function() {
            $('#active-file-carousel').removeClass('visible text-overflow');
            clearTimeout(inactivityTimer); // Clear the timer when closing
        });

        // Get media player elements
        const closeButton = document.getElementById('close-media');
        const toggleButton = document.getElementById('toggle-player');
        const reloadButton = document.getElementById('reload-media');
        
        // Close button functionality
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                // ... existing close button code ...
            });
        }
        
        // Reload button functionality
        if (reloadButton) {
            reloadButton.addEventListener('click', function() {
                // First simulate a click on the close button
                if (closeButton) {
                    closeButton.click();
                }
                
                // Then reload the page
                setTimeout(() => {
                    window.location.reload();
                }, 100); // Small delay to ensure close action completes
            });
        }
    }
});

function setTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    
    // Dynamic Plyr theme styles
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --plyr-color-main: ${isDark ? '#3498db' : '#00b3ff'};
            --plyr-audio-controls-background: ${isDark ? '#222222' : '#ffffff'};
            --plyr-audio-control-color: ${isDark ? '#ffffff' : '#4a5464'};
            --plyr-audio-control-color-hover: ${isDark ? '#3498db' : '#00b3ff'};
            --plyr-range-fill-background: ${isDark ? '#3498db' : '#00b3ff'};
            --plyr-range-thumb-background: ${isDark ? '#ffffff' : '#ffffff'};
            --plyr-range-thumb-shadow: ${isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.2)'};
            --plyr-tooltip-background: ${isDark ? '#222222' : '#ffffff'};
            --plyr-tooltip-color: ${isDark ? '#ffffff' : '#4a5464'};
            --plyr-menu-background: ${isDark ? '#222222' : '#ffffff'};
            --plyr-menu-color: ${isDark ? '#ffffff' : '#4a5464'};
        }
    `;
    document.head.appendChild(style);
}
