<div class="media-player-container" id="media-container" hidden>
    <!-- Toolbar (will move to bottom on mobile) -->
    <div class="tools-bar">
        <button id="toggle-player" title="{{ trans('common.toggle-player-fullsize') }}">▲</button>
        <button id="reload-media" title="{{ trans('common.toggle-player-reload') }}">↻</button>
        <button id="close-media" class="close-button" title="{{ trans('common.toggle-player-close') }}">✖</button>
    </div>
    <div id="media-wrapper">
        <video id="media-player" class="js-player" width="300px" height="150px">
            <source id="media-source" src="" type="">
        </video>
        <audio id="audio-player" class="js-player">
            <source id="audio-source" src="" type="">
        </audio>
    </div>
    <ul id="playlist"></ul>
</div>

<!-- Floating carousel for active file name -->
<div id="active-file-carousel" class="active-file-carousel"></div>
