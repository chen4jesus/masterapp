{{--
@pageId
--}}
<div component="ajax-form"
     option:ajax-form:url="/audios/link"
     option:ajax-form:method="post"
     option:ajax-form:response-container="#link-form-container"
     option:ajax-form:success-message="{{ trans('entities.audios_link_attached') }}">
    <input type="hidden" name="audio_link_uploaded_to" value="{{ $pageId }}">
    <p class="text-muted small">{{ trans('entities.audios_explain_link') }}</p>
    <div class="form-group">
        <label for="audio_link_name">{{ trans('entities.audios_link_name') }}</label>
        <input name="audio_link_name" id="audio_link_name" type="text" placeholder="{{ trans('entities.audios_link_name') }}" value="{{ $audio_link_name ?? '' }}">
        @if($errors->has('audio_link_name'))
            <div class="text-neg text-small">{{ $errors->first('audio_link_name') }}</div>
        @endif
    </div>
    <div class="form-group">
        <label for="audio_link_url">{{ trans('entities.audios_link_url') }}</label>
        <input name="audio_link_url" id="audio_link_url" type="text" placeholder="{{ trans('entities.audios_link_url_hint') }}" value="{{ $audio_link_url ?? '' }}">
        @if($errors->has('audio_link_url'))
            <div class="text-neg text-small">{{ $errors->first('audio_link_url') }}</div>
        @endif
    </div>
    <button component="event-emit-select"
            option:event-emit-select:name="edit-back"
            type="button" class="button outline">{{ trans('common.cancel') }}</button>
    <button refs="ajax-form@submit"
            type="button"
            class="button">{{ trans('common.save') }}</button>
</div>