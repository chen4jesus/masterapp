<div component="audios-list">
    @foreach($audios as $audio)
        <div class="audio icon-list">
            <div class="split-icon-list-item audio-{{ $audio->external ? 'link' : 'file' }}">
                <a href="{{ $audio->getUrl() }}"
                   refs="audios-list@link-type-{{ $audio->external ? 'link' : 'file' }}"
                   @if($audio->external) target="_blank" @endif>
                    <div class="icon">@icon($audio->external ? 'export' : 'file')</div>
                    <div class="label">{{ $audio->name }}</div>
                </a>
                @if(!$audio->external)
                    <div component="dropdown" class="icon-list-item-dropdown">
                        <button refs="dropdown@toggle" type="button" class="icon-list-item-dropdown-toggle">@icon('caret-down')</button>
                        <ul refs="dropdown@menu" class="dropdown-menu" role="menu">
                            <a href="{{ $audio->getUrl(false) }}" class="icon-item">
                                @icon('download')
                                <div>{{ trans('common.download') }}</div>
                            </a>
                            <a href="{{ $audio->getUrl(true) }}" target="_blank" class="icon-item">
                                @icon('export')
                                <div>{{ trans('common.open_in_tab') }}</div>
                            </a>
                        </ul>
                    </div>
                @endif
            </div>
        </div>
    @endforeach
</div>