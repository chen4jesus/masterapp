<div component="sortable-list"
     option:sortable-list:handle-selector=".handle, a">
    @foreach($audios as $audio)
        <div component="ajax-delete-row"
             option:ajax-delete-row:url="{{ url('/audios/' . $audio->id) }}"
             data-id="{{ $audio->id }}"
             data-drag-content="{{ json_encode($audio->editorContent()) }}"
             class="card drag-card pr-0">
            <div class="handle">@icon('grip')</div>
            <div class="content">
                <div class="card drag-card pl-0">
                    <div class="py-s text-center">
                        <a href="{{ $audio->getUrl() }}" target="_blank" rel="noopener">{{ $audio->name }}</a>
                    </div>
                    <div class="flex-fill justify-flex-end">
                        <button component="event-emit-select"
                                option:event-emit-select:name="insert"
                                type="button"
                                title="{{ trans('entities.audios_insert_link') }}"
                                class="drag-card-action text-center text-link">@icon('link')</button>
                        @if(userCan('audio-update', $audio))
                            <button component="event-emit-select"
                                    option:event-emit-select:name="edit"
                                    option:event-emit-select:id="{{ $audio->id }}"
                                    type="button"
                                    title="{{ trans('common.edit') }}"
                                    class="drag-card-action text-center text-link">@icon('edit')</button>
                        @endif
                        @if(userCan('audio-delete', $audio))
                            <div component="dropdown" class="flex-fill relative">
                                <button refs="dropdown@toggle"
                                        type="button"
                                        title="{{ trans('common.delete') }}"
                                        class="drag-card-action text-center text-neg">@icon('close')</button>
                                <div refs="dropdown@menu" class="dropdown-menu">
                                    <p class="text-neg small px-m mb-xs">{{ trans('entities.audios_delete') }}</p>
                                    <button refs="ajax-delete-row@delete" type="button" class="text-link small delete text-item">{{ trans('common.confirm') }}</button>
                                </div>
                            </div>
                        @endif
                    </div>
                </div>
                <div class="">
                    @if ( $audio->extension == 'mp4')
                        <video src="{{$audio->getUrl()}}" controls width="100%" height="150"></video>
                    @elseif ($audio->extension == 'mp3')
                        <audio src="{{$audio->getUrl()}}" controls width="100%" height="50"></video>
                    @endif
                </div>
            </div>
        </div>
    @endforeach
    @if (count($audios) === 0)
        <p class="small text-muted">
            {{ trans('entities.audios_no_files') }}
        </p>
    @endif
</div>