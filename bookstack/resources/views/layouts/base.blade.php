<!DOCTYPE html>
<html lang="{{ isset($locale) ? $locale->htmlLang() : config('app.default_locale') }}"
    dir="{{ isset($locale) ? $locale->htmlDirection() : 'auto' }}"
    class="{{ setting()->getForCurrentUser('dark-mode-enabled') ? 'dark-mode ' : '' }}">

<head>
    <title>{{ isset($pageTitle) ? $pageTitle . ' | ' : '' }}{{ setting('app-name') }}</title>

    <!-- Meta -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <meta name="token" content="{{ csrf_token() }}">
    <meta name="base-url" content="{{ url('/') }}">
    <meta name="theme-color" content="{{(setting()->getForCurrentUser('dark-mode-enabled') ? setting('app-color-dark') : setting('app-color'))}}"/>

    <!-- Social Cards Meta -->
    <meta property="og:title" content="{{ isset($pageTitle) ? $pageTitle . ' | ' : '' }}{{ setting('app-name') }}">
    <meta property="og:url" content="{{ url()->current() }}">
    @stack('social-meta')

    <!-- Styles -->
    <link rel="stylesheet" href="{{ versioned_asset('dist/styles.css') }}">
    <link rel="stylesheet" href="{{ asset('plyr.css') }}" nonce="{{ $cspNonce }}">
    <link rel="stylesheet" href="{{ asset('index.css') }}" nonce="{{ $cspNonce }}">
    <style>
        .font-size-controls {
            position: fixed;
            right: 24px;
            bottom: 160px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 1000;
            pointer-events: none; /* Allow clicks to pass through when hidden */
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .font-size-controls.visible {
            pointer-events: auto; /* Restore pointer events when visible */
        }

        .font-size-btn, .darkmode-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background-color: var(--color-primary);
            color: #fff;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            opacity: 0;
            transform: scale(0) translate(16px, 92px); /* Position at hamburger button */
            transform-origin: bottom right;
        }

        .font-size-controls.visible .font-size-btn,
        .font-size-controls.visible .darkmode-btn {
            opacity: 1;
            transform: scale(1) translate(0, 0);
        }

        .font-size-controls.visible .font-size-btn:nth-child(1) {
            transition-delay: 0.05s;
        }

        .font-size-controls.visible .font-size-btn:nth-child(2) {
            transition-delay: 0.1s;
        }
        
        .font-size-controls.visible .darkmode-btn {
            transition-delay: 0.15s;
        }

        .font-size-btn:hover,
        .darkmode-btn:hover {
            transform: scale(1.1) translate(0, 0);
            opacity: 1;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        
        .moon-icon {
            display: inline-block;
            width: 24px;
            height: 24px;
            position: relative;
        }
        
        .moon-icon svg {
            fill: white;
            width: 100%;
            height: 100%;
        }
        
        .sun-icon {
            display: none;
            width: 24px;
            height: 24px;
            position: relative;
        }
        
        .sun-icon svg {
            fill: white;
            width: 100%;
            height: 100%;
        }
        
        /* Show sun icon and hide moon icon in dark mode */
        html.dark-mode .sun-icon {
            display: inline-block;
        }
        
        html.dark-mode .moon-icon {
            display: none;
        }

        .controls-toggle {
            position: fixed;
            right: 24px;
            bottom: 113px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: var(--color-primary);
            border: none;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 1001;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            opacity: 0.1;
        }

        .controls-toggle:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 15px rgba(0,0,0,0.25);
            opacity: 0.9;
        }

        body.dark-mode .controls-toggle {
            background-color: var(--color-primary);
        }

        .controls-toggle.scrolling {
            opacity: 0.9;
        }

        .controls-toggle:active {
            transform: scale(0.95);
        }

        .controls-toggle.active {
            transform: rotate(0deg);
            opacity: 1;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .controls-toggle.animate {
            animation: pulse 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .hamburger-icon {
            width: 24px;
            height: 24px;
            position: relative;
            align-items: center;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .hamburger-icon .bar {
            width: 90%;
            height: 3px;
            align: center;
            background-color: white;
            border-radius: 3px;
            transition: all 0.3s ease;
        }

        .controls-toggle.active .hamburger-icon .bar:nth-child(1) {
            transform: translateY(10.5px) rotate(45deg);
        }

        .controls-toggle.active .hamburger-icon .bar:nth-child(2) {
            opacity: 0;
        }

        .controls-toggle.active .hamburger-icon .bar:nth-child(3) {
            transform: translateY(-10.5px) rotate(-45deg);
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            30% { transform: scale(1.1); }
            60% { transform: scale(0.9); }
            100% { transform: scale(1); }
        }

        /* Ensure font controls and back-to-top don't overlap on small screens */
        @media (max-height: 400px) {
            .font-size-controls {
                bottom: 160px;
            }
        }
    </style>

    <!-- Icons -->
    <link rel="icon" type="image/png" sizes="256x256" href="{{ setting('app-icon') ?: url('/icon.png') }}">
    <link rel="icon" type="image/png" sizes="180x180" href="{{ setting('app-icon-180') ?: url('/icon-180.png') }}">
    <link rel="apple-touch-icon" sizes="180x180" href="{{ setting('app-icon-180') ?: url('/icon-180.png') }}">
    <link rel="icon" type="image/png" sizes="128x128" href="{{ setting('app-icon-128') ?: url('/icon-128.png') }}">
    <link rel="icon" type="image/png" sizes="64x64" href="{{ setting('app-icon-64') ?: url('/icon-64.png') }}">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ setting('app-icon-32') ?: url('/icon-32.png') }}">

    <!-- PWA -->
    <link rel="manifest" href="{{ url('/manifest.json') }}">
    <meta name="mobile-web-app-capable" content="yes">

    <!-- OpenSearch -->
    <link rel="search" type="application/opensearchdescription+xml" title="{{ setting('app-name') }}"
        href="{{ url('/opensearch.xml') }}">

    <!-- Custom Styles & Head Content -->
    @include('layouts.parts.custom-styles')
    @include('layouts.parts.custom-head')

    @stack('head')

    <!-- Translations for JS -->
    @stack('translations')
</head>

<body
    @if (setting()->getForCurrentUser('ui-shortcuts-enabled', false)) component="shortcuts"
        option:shortcuts:key-map="{{ \BookStack\Settings\UserShortcutMap::fromUserPreferences()->toJson() }}" @endif
    class="@stack('body-class')">

    @include('layouts.parts.base-body-start')
    @include('layouts.parts.skip-to-content')
    @include('layouts.parts.notifications')
    @include('layouts.parts.header')

    <div class="font-size-controls">
        <button class="font-size-btn" data-action="increase" title="{{ trans('common.increase_font_size') }}">+</button>
        <button class="font-size-btn" data-action="decrease" title="{{ trans('common.decrease_font_size') }}">-</button>
        <button class="darkmode-btn" id="darkmode-toggle" title="{{ trans('common.toggle_dark_mode') }}">
            <span class="moon-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36c-0.98,1.37-2.58,2.26-4.4,2.26 c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"/>
                </svg>
            </span>
            <span class="sun-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5S14.76,7,12,7L12,7z M2,13h2c0.55,0,1-0.45,1-1s-0.45-1-1-1H2 c-0.55,0-1,0.45-1,1S1.45,13,2,13z M20,13h2c0.55,0,1-0.45,1-1s-0.45-1-1-1h-2c-0.55,0-1,0.45-1,1S19.45,13,20,13z M11,2v2 c0,0.55,0.45,1,1,1s1-0.45,1-1V2c0-0.55-0.45-1-1-1S11,1.45,11,2z M11,20v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2c0-0.55-0.45-1-1-1 S11,19.45,11,20z M5.99,4.58c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0 s0.39-1.03,0-1.41L5.99,4.58z M18.36,16.95c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06 c0.39,0.39,1.03,0.39,1.41,0c0.39-0.39,0.39-1.03,0-1.41L18.36,16.95z M19.42,5.99c0.39-0.39,0.39-1.03,0-1.41 c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L19.42,5.99z M7.05,18.36 c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L7.05,18.36z" />
                </svg>
            </span>
        </button>
    </div>

    <button id="controls-toggle" class="controls-toggle" title="{{ trans('common.toggle_controls') }}">
        <span class="hamburger-icon">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
        </span>
    </button>

    <div id="content" components="@yield('content-components')" class="block">
        @yield('content')
    </div>

    @include('layouts.parts.footer')

    <div component="back-to-top" class="back-to-top print-hidden" style="display: none;">
        <div class="inner">
            @icon('chevron-up') <span>{{ trans('common.back_to_top') }}</span>
        </div>
    </div>

    @include('components.bible-verse-modal')

    @if($cspNonce ?? false)
        <script nonce="{{ $cspNonce }}">
            document.addEventListener('DOMContentLoaded', function() {
                // Controls toggle functionality
                const controlsToggle = document.getElementById('controls-toggle');
                const fontSizeControls = document.querySelector('.font-size-controls');
                const controlsArea = document.querySelector('.font-size-controls');
                const darkmodeToggle = document.getElementById('darkmode-toggle');

                // Scroll detection to increase toggle button visibility
                let scrollTimeout;
                window.addEventListener('scroll', function() {
                    // Add scrolling class to make button more visible during scroll
                    controlsToggle.classList.add('scrolling');
                    
                    // Clear previous timeout
                    clearTimeout(scrollTimeout);
                    
                    // Set a timeout to remove the scrolling class after scrolling stops
                    scrollTimeout = setTimeout(function() {
                        controlsToggle.classList.remove('scrolling');
                    }, 1000); // 1 second after scrolling stops
                });

                // Dark mode toggle functionality
                if (darkmodeToggle) {
                    darkmodeToggle.addEventListener('click', function(e) {
                        e.stopPropagation(); // Prevent bubbling to document click handler
                        
                        // Toggle dark mode class on HTML element
                        const htmlElement = document.documentElement;
                        const isDarkMode = htmlElement.classList.contains('dark-mode');
                        
                        // Toggle the class immediately for visual feedback
                        htmlElement.classList.toggle('dark-mode', !isDarkMode);
                        
                        // Add a visual pulse to confirm the action
                        darkmodeToggle.classList.remove('animate');
                        void darkmodeToggle.offsetWidth; // Force reflow
                        darkmodeToggle.classList.add('animate');
                        
                        // Store the preference in localStorage instead of API
                        localStorage.setItem('dark-mode', !isDarkMode ? 'true' : 'false');
                    });
                    
                    // Check for saved dark mode preference
                    const savedDarkMode = localStorage.getItem('dark-mode');
                    if (savedDarkMode) {
                        // Apply dark mode if saved preference exists
                        const darkModeEnabled = savedDarkMode === 'true';
                        document.documentElement.classList.toggle('dark-mode', darkModeEnabled);
                    }
                }

                // Set initial state - all controls hidden
                let controlsVisible = false;
                
                // Load saved state from localStorage if available
                const savedState = localStorage.getItem('controlsVisible');
                if (savedState === 'true') {
                    showControls();
                }
                
                // Toggle controls visibility when the hamburger button is clicked
                controlsToggle.addEventListener('click', function(e) {
                    // Prevent this click from triggering the document click handler
                    e.stopPropagation();
                    
                    controlsVisible = !controlsVisible;
                    
                    if (controlsVisible) {
                        showControls();
                    } else {
                        hideControls();
                    }
                    
                    // Add a little bounce animation to the toggle button
                    controlsToggle.classList.remove('animate');
                    void controlsToggle.offsetWidth; // Force reflow
                    controlsToggle.classList.add('animate');
                    
                    // Save state to localStorage
                    localStorage.setItem('controlsVisible', controlsVisible);
                });
                
                // Close controls when clicking outside of them
                document.addEventListener('click', function(e) {
                    if (controlsVisible) {
                        // Check if the click was outside the controls and toggle button
                        const clickedOnControls = fontSizeControls.contains(e.target) || 
                                                 controlsToggle.contains(e.target) ||
                                                 e.target === controlsToggle;
                        
                        if (!clickedOnControls) {
                            hideControls();
                            localStorage.setItem('controlsVisible', 'false');
                        }
                    }
                });
                
                // Close controls when focus moves away
                document.addEventListener('focusin', function(e) {
                    if (controlsVisible) {
                        // Check if focus is outside the controls
                        const focusInControls = fontSizeControls.contains(e.target) || 
                                              controlsToggle.contains(e.target) ||
                                              e.target === controlsToggle;
                        
                        if (!focusInControls) {
                            hideControls();
                            localStorage.setItem('controlsVisible', 'false');
                        }
                    }
                });
                
                // Handle escape key to close controls
                document.addEventListener('keydown', function(e) {
                    if (controlsVisible && e.key === 'Escape') {
                        hideControls();
                        localStorage.setItem('controlsVisible', 'false');
                    }
                });
                
                function showControls() {
                    controlsToggle.classList.add('active');
                    fontSizeControls.classList.add('visible');
                    controlsVisible = true;
                }
                
                function hideControls() {
                    controlsToggle.classList.remove('active');
                    
                    // Small delay before hiding font controls for sequence effect
                    setTimeout(() => {
                        fontSizeControls.classList.remove('visible');
                    }, 50);
                    
                    controlsVisible = false;
                }
                
                // Load saved font size from localStorage
                const savedSize = localStorage.getItem('pageFontSize');
                if (savedSize) {
                    document.getElementById('content').style.fontSize = savedSize + 'px';
                }

                // Add event listeners for font size buttons
                document.querySelectorAll('.font-size-btn').forEach(button => {
                    button.addEventListener('click', function(e) {
                        // Prevent the click from bubbling up to the document
                        e.stopPropagation();
                        
                        const delta = this.dataset.action === 'increase' ? 1 : -1;
                        const content = document.getElementById('content');
                        const currentSize = parseFloat(window.getComputedStyle(content).fontSize);
                        const newSize = Math.min(Math.max(currentSize + delta, 12), 30); // Min: 12px, Max: 30px

                        content.style.fontSize = newSize + 'px';
                        localStorage.setItem('pageFontSize', newSize);
                    });
                });
            });
        </script>
        <script src="{{ versioned_asset('dist/app.js') }}" type="module" nonce="{{ $cspNonce }}"></script>
        <script src="{{ asset('jquery-3.6.0.js') }}" nonce="{{ $cspNonce }}"></script>
        <script src="{{ asset('plyr.js') }}" nonce="{{ $cspNonce }}"></script>
        <script src="{{ asset('index.js') }}" nonce="{{ $cspNonce }}"></script>
    @endif
    @stack('body-end')

    @include('layouts.parts.base-body-end')
    @include('layouts.parts.audio')
</body>
</html>
