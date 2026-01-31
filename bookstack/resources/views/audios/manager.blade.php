<div style="display: block;"
     refs="editor-toolbox@tab-content"
     data-tab-content="audiofiles"
     component="audios"
     option:audios:page-id="{{ $page->id ?? 0 }}"
     class="toolbox-tab-content">

    <h4>{{ trans('entities.audios') }}</h4>
    <div component="dropzone"
         option:dropzone:url="{{ url('/audios/upload?uploaded_to=' . $page->id) }}"
         option:dropzone:success-message="{{ trans('entities.audios_file_uploaded') }}"
         option:dropzone:error-message="{{ trans('errors.audio_upload_error') }}"
         option:dropzone:upload-limit="{{ config('app.upload_limit') }}"
         option:dropzone:upload-limit-message="{{ trans('errors.server_upload_limit') }}"
         option:dropzone:zone-text="{{ trans('entities.audios_dropzone') }}"
         option:dropzone:file-accept="*"
         option:dropzone:allow-multiple="true"
         class="px-l files">

        <div refs="audios@list-container dropzone@drop-target" class="relative">
            <p class="text-muted small">{{ trans('entities.audios_explain') }} <span
                        class="text-warn">{{ trans('entities.audios_explain_instant_save') }}</span></p>

            <hr class="mb-s">

            <div class="flex-container-row">
                <button refs="dropzone@select-button" type="button" class="button outline small">{{ trans('entities.audios_upload') }}</button>
                <button refs="audios@attach-link-button" type="button" class="button outline small">{{ trans('entities.audios_link') }}</button>
            </div>
            <div>
                <p class="text-muted text-small">{{ trans('entities.audios_upload_drop') }}</p>
            </div>
            <div refs="dropzone@status-area" class="fixed top-right px-m py-m"></div>

            <hr>

            <div refs="audios@list-panel">
                {{-- {{dd($page)}} --}}
                @include('audios.manager-list', ['audios' => $page->audios->all()])
            </div>

        </div>
    </div>

    <div id="link-form-container" refs="audios@links-container" hidden class="px-l">
        @include('audios.manager-link-form', ['pageId' => $page->id])
    </div>

    <div id="edit-form-container" refs="audios@edit-container" hidden class="px-l"></div>

</div>