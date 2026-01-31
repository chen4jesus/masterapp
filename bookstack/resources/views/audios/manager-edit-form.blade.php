<div component="ajax-form"
     option:ajax-form:url="/audios/{{ $audio->id }}"
     option:ajax-form:method="put"
     option:ajax-form:response-container="#edit-form-container"
     option:ajax-form:success-message="{{ trans('entities.audios_updated_success') }}">
    <h5>{{ trans('entities.audios_edit_file') }}</h5>

    <div class="form-group">
        <label for="audio_edit_name">{{ trans('entities.audios_edit_file_name') }}</label>
        <input type="text" id="audio_edit_name"
               name="audio_edit_name"
               value="{{ $audio_edit_name ?? $audio->name ?? '' }}"
               placeholder="{{ trans('entities.audios_edit_file_name') }}">
        @if($errors->has('audio_edit_name'))
            <div class="text-neg text-small">{{ $errors->first('audio_edit_name') }}</div>
        @endif
    </div>

    <div component="tabs" class="tab-container">
        <div class="nav-tabs" role="tablist">
            <button id="audio-edit-file-tab"
                    type="button"
                    aria-controls="audio-edit-file-panel"
                    aria-selected="{{ $audio->external ? 'false' : 'true' }}"
                    role="tab">{{ trans('entities.audios_upload') }}</button>
            <button id="audio-edit-link-tab"
                    type="button"
                    aria-controls="audio-edit-link-panel"
                    aria-selected="{{ $audio->external ? 'true' : 'false' }}"
                    role="tab">{{ trans('entities.audios_set_link') }}</button>
        </div>
        <div id="audio-edit-file-panel"
             @if($audio->external) hidden @endif
             tabindex="0"
             role="tabpanel"
             aria-labelledby="audio-edit-file-tab"
             class="mb-m">
            @include('form.simple-dropzone', [
                'placeholder' => trans('entities.audios_edit_drop_upload'),
                'url' =>  url('/audios/upload/' . $audio->id),
                'successMessage' => trans('entities.audio_file_updated'),
            ])
        </div>
        <div id="audio-edit-link-panel"
             @if(!$audio->external) hidden @endif
             tabindex="0"
             role="tabpanel"
             aria-labelledby="audio-edit-link-tab">
            <div class="form-group">
                <label for="audio_edit_url">{{ trans('entities.audios_link_url') }}</label>
                <input type="text" id="audio_edit_url"
                       name="audio_edit_url"
                       value="{{ $audio_edit_url ?? ($audio->external ? $audio->path : '')  }}"
                       placeholder="{{ trans('entities.audio_link') }}">
                @if($errors->has('audio_edit_url'))
                    <div class="text-neg text-small">{{ $errors->first('audio_edit_url') }}</div>
                @endif
            </div>
        </div>
    </div>

    <button component="event-emit-select"
            option:event-emit-select:name="edit-back"
            type="button"
            class="button outline">{{ trans('common.back') }}</button>
    <button refs="ajax-form@submit" type="button" class="button">{{ trans('common.save') }}</button>
</div>