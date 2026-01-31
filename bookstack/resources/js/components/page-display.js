import * as DOM from '../services/dom.ts';
import {scrollAndHighlightElement} from '../services/util.ts';
import {Component} from './component';

function toggleAnchorHighlighting(elementId, shouldHighlight) {
    DOM.forEach(`#page-navigation a[href="#${elementId}"]`, anchor => {
        anchor.closest('li').classList.toggle('current-heading', shouldHighlight);
    });
}

function headingVisibilityChange(entries) {
    for (const entry of entries) {
        const isVisible = (entry.intersectionRatio === 1);
        toggleAnchorHighlighting(entry.target.id, isVisible);
    }
}

function addNavObserver(headings) {
    // Setup the intersection observer.
    const intersectOpts = {
        rootMargin: '0px 0px 0px 0px',
        threshold: 1.0,
    };
    const pageNavObserver = new IntersectionObserver(headingVisibilityChange, intersectOpts);

    // observe each heading
    for (const heading of headings) {
        pageNavObserver.observe(heading);
    }
}

export class PageDisplay extends Component {

    setup() {
        this.container = this.$el;
        this.pageId = this.$opts.pageId;
        this.audios = this.$opts.audios;
        if (this.audios) {
            try {
                if(this.audios != null){
                    localStorage.setItem('newMedia', this.audios);
                    var newMedia = localStorage.getItem('newMedia');
                    var currentMedia = localStorage.getItem('currentMedia');
                    if (currentMedia == 'null' || currentMedia == '[]' || currentMedia == null) {
                        localStorage.setItem('currentMedia', newMedia); // Store correctly
                    }
                }
            } catch (error) {
                console.error("Error parsing JSON:", error);
            }
        }
        $(document).ready(function () {
            $(".audiotime").click(function (e) {
                e.preventDefault(); // Prevent default behavior

                var data_url = $(this).attr('data-url');
                const timeFull = $(this).text();
                
                // Get the most recent media data
                var newMedia_tmp = localStorage.getItem('newMedia');
                
                // Get current page ID to handle navigation between pages
                const currentPageId = $('meta[name="page-id"]').attr('content') || 
                                     window.location.pathname.split('/').pop();
                                     
                // Store the current page ID for later comparison
                localStorage.setItem('last_audio_page_id', currentPageId);
                
                // Always update current media with the newest media list
                localStorage.setItem('currentMedia', newMedia_tmp);
                localStorage.setItem("lastPlayedMedia", data_url);
                
                // Parse the time
                var hour = timeFull.split(":")[0];
                var minute = timeFull.split(":")[1];
                var second = timeFull.split(":")[2];
                var timecount = Number(hour) * 3600 + Number(minute) * 60 + Number(second);
                localStorage.setItem("mediaTime_" + data_url, timecount);
                
                // Check if Plyr and our global player instances are available
                if (typeof Plyr === 'undefined' || !window.videoPlayer || !window.audioPlayer) {
                    console.warn("Plyr not initialized yet, falling back to page reload");
                    // Fallback to old method
                    localStorage.setItem('startplayer', true);
                    window.location.reload();
                    return;
                }

                // Create loading spinner
                const originalText = $(this).html();
                const loadingSpinner = $('<span class="loading-spinner"></span>');
                $(this).html(loadingSpinner);
                // Replace content with loading spinner + "Loading..." text
                $(this).css('opacity', '0.8');


                // Get the media list
                try {
                    // Parse the most recent media list
                    const mediaList = JSON.parse(newMedia_tmp || '[]');
                    
                    // Find the index of the media file in the list
                    const mediaIndex = mediaList.findIndex(media => media.url === data_url);
                    
                    if (mediaIndex !== -1) {
                        // Show the media player if it's hidden
                        if ($("#media-container").is(":hidden")) {
                            $("#media-container").removeAttr('hidden');
                            $("#media-container").css('display', 'flex');
                            $("#media-container").addClass("minimized");
                        }
                        
                        // Update the global mediaList with the current page's media
                        if (window.updateMediaList && typeof window.updateMediaList === 'function') {
                            window.updateMediaList(mediaList);
                        }
                        
                        // Direct play without page reload
                        directPlayMedia(mediaIndex, timecount);
                        // Restore original link appearance
                        setTimeout(function() {
                            $(e.target).closest('.audiotime').html(originalText);
                            $(e.target).closest('.audiotime').css('opacity', '1');
                        }, 500);
                    } else {
                        console.error("Media file not found in the list: " + data_url);
                        
                        // Try to reload the player with the new list as a fallback
                        if (window.reloadMediaPlayer && typeof window.reloadMediaPlayer === 'function') {
                            window.reloadMediaPlayer(currentPageId, function() {
                                // Try again after reloading
                                try {
                                    const updatedMediaList = JSON.parse(localStorage.getItem('currentMedia') || '[]');
                                    const newIndex = updatedMediaList.findIndex(media => media.url === data_url);
                                    if (newIndex !== -1) {
                                        directPlayMedia(newIndex, timecount);
                                    } else {
                                        console.error("Media file still not found after reload: " + data_url);
                                        // Last resort fallback - reload the page (original behavior)
                                        localStorage.setItem('startplayer', true);
                                        window.location.reload();
                                    }
                                } catch (reloadError) {
                                    console.error("Error processing reloaded media list:", reloadError);
                                    // Fallback to original method
                                    localStorage.setItem('startplayer', true);
                                    window.location.reload();
                                }
                            });
                        } else {
                            // Fallback to original method if reloadMediaPlayer isn't available
                            localStorage.setItem('startplayer', true);
                            window.location.reload();
                        }
                        // Restore original link appearance
                        setTimeout(function() {
                            $(e.target).closest('.audiotime').html(originalText);
                            $(e.target).closest('.audiotime').css('opacity', '1');
                        }, 500);
                    }
                } catch (error) {
                    console.error("Error parsing media list:", error);
                    // Fallback to original method
                    localStorage.setItem('startplayer', true);
                    window.location.reload();
                    setTimeout(function() {
                        $(e.target).closest('.audiotime').html(originalText);
                        $(e.target).closest('.audiotime').css('opacity', '1');
                    }, 500);
                }
            });
            
            // Function to directly play media file at the specified index and time
            function directPlayMedia(index, startTime) {
                // Check if the global function exists
                if (typeof window.playMediaAt === 'function') {
                    // Use the global function to play media and enforce clean switching
                    try {
                        // Log that we're about to play a specific media at a specific time
                        console.log(`Direct play media at index ${index} with start time ${startTime}`);
                        
                        // Always use forceCleanSwitch=true to ensure proper cleanup
                        window.playMediaAt(index, startTime, false);
                    } catch (e) {
                        console.error("Error calling playMediaAt:", e);
                        // Fallback to page reload if the global function fails
                        localStorage.setItem('startplayer', true);
                        window.location.reload();
                    }
                    return;
                }
                
                // Fallback implementation if global function is not available
                // Check if window.Plyr is initialized
                if (typeof Plyr === 'undefined') {
                    console.error("Plyr is not initialized yet");
                    localStorage.setItem('startplayer', true);
                    window.location.reload();
                    return;
                }
                
                // Find the Plyr instances
                const videoPlayer = window.videoPlayer || Plyr.instances.filter(p => p.media.id === 'media-player')[0];
                const audioPlayer = window.audioPlayer || Plyr.instances.filter(p => p.media.id === 'audio-player')[0];
                
                if (!videoPlayer || !audioPlayer) {
                    console.error("Plyr instances not found");
                    localStorage.setItem('startplayer', true);
                    window.location.reload();
                    return;
                }
                
                // Get media list from localStorage
                try {
                    const mediaListJSON = localStorage.getItem('currentMedia');
                    if (!mediaListJSON || mediaListJSON === 'null' || mediaListJSON === '[]') {
                        console.error("Media list is empty or invalid");
                        localStorage.setItem('startplayer', true);
                        window.location.reload();
                        return;
                    }
                    
                    const mediaList = JSON.parse(mediaListJSON);
                    if (!Array.isArray(mediaList) || !mediaList.length || index >= mediaList.length || index < 0) {
                        console.error("Invalid media index or media list format");
                        localStorage.setItem('startplayer', true);
                        window.location.reload();
                        return;
                    }
                    
                    const media = mediaList[index];
                    if (!media || !media.url) {
                        console.error("Media item is invalid or missing URL");
                        localStorage.setItem('startplayer', true);
                        window.location.reload();
                        return;
                    }
                    
                    // Always force stop all players first before starting a new one
                    stopAllPlayers();
                    
                    // Update playlist UI
                    $("#playlist li").removeClass("active");
                    $(`#playlist li[data-index="${index}"]`).addClass("active");
                    
                    // Get the media path
                    const mediaPath = media.url;
                    
                    // Determine if it's video or audio
                    const isVideo = ["mp4", "mov", "avi", "mkv", "webm"].includes(
                        (media.extension || '').toLowerCase()
                    );
                    
                    // Clear any saved time for this specific invocation
                    // When directPlayMedia is called with a specific time, we want to use that time
                    // not a previously saved position
                    if (startTime !== undefined && startTime !== null && !isNaN(startTime)) {
                        const storageKey = "mediaTime_" + mediaPath;
                        localStorage.setItem(storageKey, startTime.toString());
                    }
                    
                    // Set the source and play
                    if (isVideo) {
                        // Handle video
                        $("#audio-player").hide();
                        const videoElement = document.getElementById("media-player");
                        
                        // Remove any previous event listeners to prevent duplicates
                        const oldVideoElement = videoElement.cloneNode(true);
                        videoElement.parentNode.replaceChild(oldVideoElement, videoElement);
                        
                        const newVideoElement = document.getElementById("media-player");
                        newVideoElement.src = media.url;
                        newVideoElement.load();
                        
                        // Use a one-time event listener to avoid accumulation
                        newVideoElement.addEventListener('loadeddata', function onLoaded() {
                            if (startTime !== undefined && startTime !== null && !isNaN(startTime)) {
                                console.log(`Setting video time to ${startTime}`);
                                videoPlayer.currentTime = startTime;
                            }
                            setTimeout(() => videoPlayer.play(), 50); // Short delay for stability
                            newVideoElement.removeEventListener('loadeddata', onLoaded);
                        }, { once: true });
                        
                        $("#media-player").show();
                    } else {
                        // Handle audio
                        $("#media-player").hide();
                        const audioElement = document.getElementById("audio-player");
                        
                        // Remove any previous event listeners to prevent duplicates
                        const oldAudioElement = audioElement.cloneNode(true);
                        audioElement.parentNode.replaceChild(oldAudioElement, audioElement);
                        
                        const newAudioElement = document.getElementById("audio-player");
                        newAudioElement.src = media.url;
                        newAudioElement.load();
                        
                        // Use a one-time event listener to avoid accumulation
                        newAudioElement.addEventListener('loadeddata', function onLoaded() {
                            if (startTime !== undefined && startTime !== null && !isNaN(startTime)) {
                                console.log(`Setting audio time to ${startTime}`);
                                audioPlayer.currentTime = startTime;
                            }
                            setTimeout(() => audioPlayer.play(), 50); // Short delay for stability
                            newAudioElement.removeEventListener('loadeddata', onLoaded);
                        }, { once: true });
                        
                        $("#audio-player").show();
                    }
                    
                    // Show the current file name in carousel
                    const carousel = $('#active-file-carousel');
                    carousel.text('正在收听: '+media.name);
                    carousel.addClass('visible');
                    
                    // Check if text overflows and apply sliding animation if needed
                    setTimeout(function() {
                        checkTextOverflow(carousel);
                    }, 20);
                } catch (error) {
                    console.error("Error playing media:", error);
                }
            }
            
            // Helper function to ensure all players are stopped
            function stopAllPlayers() {
                try {
                    // Stop video player if exists
                    if (window.videoPlayer && window.videoPlayer.media) {
                        window.videoPlayer.pause();
                        window.videoPlayer.currentTime = 0;
                    }
                    
                    // Stop audio player if exists
                    if (window.audioPlayer && window.audioPlayer.media) {
                        window.audioPlayer.pause();
                        window.audioPlayer.currentTime = 0;
                    }
                    
                    // Also try direct element control for completeness
                    const videoElement = document.getElementById("media-player");
                    if (videoElement) {
                        videoElement.pause();
                        videoElement.currentTime = 0;
                    }
                    
                    const audioElement = document.getElementById("audio-player");
                    if (audioElement) {
                        audioElement.pause();
                        audioElement.currentTime = 0;
                    }
                } catch (e) {
                    console.error("Error stopping players:", e);
                }
            }
            
            // Helper function for carousel text overflow
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
            }
        });

        window.importVersioned('code').then(Code => Code.highlight());
        this.setupNavHighlighting();

        // Check the hash on load
        if (window.location.hash) {
            const text = window.location.hash.replace(/%20/g, ' ').substring(1);
            this.goToText(text);
        }

        // Sidebar page nav click event
        const sidebarPageNav = document.querySelector('.sidebar-page-nav');
        if (sidebarPageNav) {
            DOM.onChildEvent(sidebarPageNav, 'a', 'click', (event, child) => {
                event.preventDefault();
                window.$components.first('tri-layout').showContent();
                const contentId = child.getAttribute('href').substr(1);
                this.goToText(contentId);
                window.history.pushState(null, null, `#${contentId}`);
            });
        }
    }

    goToText(text) {
        const idElem = document.getElementById(text);

        DOM.forEach('.page-content [data-highlighted]', elem => {
            elem.removeAttribute('data-highlighted');
            elem.style.backgroundColor = null;
        });

        if (idElem !== null) {
            scrollAndHighlightElement(idElem);
        } else {
            const textElem = DOM.findText('.page-content > div > *', text);
            if (textElem) {
                scrollAndHighlightElement(textElem);
            }
        }
    }

    setupNavHighlighting() {
        const pageNav = document.querySelector('.sidebar-page-nav');

        // fetch all the headings.
        const headings = document.querySelector('.page-content').querySelectorAll('h1, h2, h3, h4, h5, h6');
        // if headings are present, add observers.
        if (headings.length > 0 && pageNav !== null) {
            addNavObserver(headings);
        }
    }

}
