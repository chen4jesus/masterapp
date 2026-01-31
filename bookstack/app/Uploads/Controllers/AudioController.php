<?php

namespace BookStack\Uploads\Controllers;

use BookStack\Entities\Queries\PageQueries;
use BookStack\Entities\Repos\PageRepo;
use BookStack\Exceptions\FileUploadException;
use BookStack\Exceptions\NotFoundException;
use BookStack\Http\Controller;
use BookStack\Uploads\Audio;
use BookStack\Uploads\AudioService;
use Exception;
use Illuminate\Contracts\Filesystem\FileNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\MessageBag;
use Illuminate\Validation\ValidationException;

class AudioController extends Controller
{
    public function __construct(
        protected AudioService $audioService,
        protected PageQueries $pageQueries,
        protected PageRepo $pageRepo
    ) {
    }

    /**
     * Endpoint at which audios are uploaded to.
     *
     * @throws ValidationException
     * @throws NotFoundException
     */
    public function upload(Request $request)
    {
        $this->validate($request, [
            'uploaded_to' => ['required', 'integer', 'exists:pages,id'],
            'file'        => array_merge(['required'], $this->audioService->getFileValidationRules()),
        ]);

        $pageId = $request->get('uploaded_to');
        $page = $this->pageQueries->findVisibleByIdOrFail($pageId);

        $this->checkPermission('audio-create-all');
        $this->checkOwnablePermission('page-update', $page);

        $uploadedFile = $request->file('file');

        try {
            $audio = $this->audioService->saveNewUpload($uploadedFile, $pageId);
        } catch (FileUploadException $e) {
            return response($e->getMessage(), 500);
        }

        return response()->json($audio);
    }

    /**
     * Update an uploaded audio.
     *
     * @throws ValidationException
     */
    public function uploadUpdate(Request $request, $audioId)
    {
        $this->validate($request, [
            'file' => array_merge(['required'], $this->audioService->getFileValidationRules()),
        ]);

        /** @var Audio $audio */
        $audio = Audio::query()->findOrFail($audioId);
        $this->checkOwnablePermission('view', $audio->page);
        $this->checkOwnablePermission('page-update', $audio->page);
        $this->checkOwnablePermission('audio-create', $audio);

        $uploadedFile = $request->file('file');

        try {
            $audio = $this->audioService->saveUpdatedUpload($uploadedFile, $audio);
        } catch (FileUploadException $e) {
            return response($e->getMessage(), 500);
        }

        return response()->json($audio);
    }

    /**
     * Get the update form for an audio.
     */
    public function getUpdateForm(string $audioId)
    {
        /** @var Audio $audio */
        $audio = Audio::query()->findOrFail($audioId);

        $this->checkOwnablePermission('page-update', $audio->page);
        $this->checkOwnablePermission('audio-create', $audio);

        return view('audios.manager-edit-form', [
            'audio' => $audio,
        ]);
    }

    /**
     * Update the details of an existing file.
     */
    public function update(Request $request, string $audioId)
    {
        /** @var Audio $audio */
        $audio = Audio::query()->findOrFail($audioId);

        try {
            $this->validate($request, [
                'audio_edit_name' => ['required', 'string', 'min:1', 'max:255'],
                'audio_edit_url'  => ['string', 'min:1', 'max:2000', 'safe_url'],
            ]);
        } catch (ValidationException $exception) {
            return response()->view('audios.manager-edit-form', array_merge($request->only(['audio_edit_name', 'audio_edit_url']), [
                'audio' => $audio,
                'errors'     => new MessageBag($exception->errors()),
            ]), 422);
        }

        $this->checkOwnablePermission('page-view', $audio->page);
        $this->checkOwnablePermission('page-update', $audio->page);
        $this->checkOwnablePermission('audio-update', $audio);

        $audio = $this->audioService->updateFile($audio, [
            'name' => $request->get('audio_edit_name'),
            'link' => $request->get('audio_edit_url'),
        ]);

        return view('audios.manager-edit-form', [
            'audio' => $audio,
        ]);
    }

    /**
     * Attach a link to a page.
     *
     * @throws NotFoundException
     */
    public function attachLink(Request $request)
    {
        $pageId = $request->get('audio_link_uploaded_to');

        try {
            $this->validate($request, [
                'audio_link_uploaded_to' => ['required', 'integer', 'exists:pages,id'],
                'audio_link_name'        => ['required', 'string', 'min:1', 'max:255'],
                'audio_link_url'         => ['required', 'string', 'min:1', 'max:2000', 'safe_url'],
            ]);
        } catch (ValidationException $exception) {
            return response()->view('audios.manager-link-form', array_merge($request->only(['audio_link_name', 'audio_link_url']), [
                'pageId' => $pageId,
                'errors' => new MessageBag($exception->errors()),
            ]), 422);
        }

        $page = $this->pageQueries->findVisibleByIdOrFail($pageId);

        $this->checkPermission('audio-create-all');
        $this->checkOwnablePermission('page-update', $page);

        $audioName = $request->get('audio_link_name');
        $link = $request->get('audio_link_url');
        $this->audioService->saveNewFromLink($audioName, $link, intval($pageId));

        return view('audios.manager-link-form', [
            'pageId' => $pageId,
        ]);
    }

    /**
     * Get the audios for a specific page.
     *
     * @throws NotFoundException
     */
    public function listForPage(int $pageId)
    {
        $page = $this->pageQueries->findVisibleByIdOrFail($pageId);
        $this->checkOwnablePermission('page-view', $page);

        return view('audios.manager-list', [
            'audios' => $page->audios->all(),
        ]);
    }

    /**
     * Update the audio sorting.
     *
     * @throws ValidationException
     * @throws NotFoundException
     */
    public function sortForPage(Request $request, int $pageId)
    {
        $this->validate($request, [
            'order' => ['required', 'array'],
        ]);
        $page = $this->pageQueries->findVisibleByIdOrFail($pageId);
        $this->checkOwnablePermission('page-update', $page);

        $audioOrder = $request->get('order');
        $this->audioService->updateFileOrderWithinPage($audioOrder, $pageId);

        return response()->json(['message' => trans('entities.audios_order_updated')]);
    }

    /**
     * Get an audio from storage.
     *
     * @throws FileNotFoundException
     * @throws NotFoundException
     */
    public function get(Request $request, string $audioId)
    {
        /** @var Audio $audio */
        $audio = Audio::query()->findOrFail($audioId);

        try {
            $page = $this->pageQueries->findVisibleByIdOrFail($audio->uploaded_to);
        } catch (NotFoundException $exception) {
            throw new NotFoundException(trans('errors.audio_not_found'));
        }

        $this->checkOwnablePermission('page-view', $page);

        if ($audio->external) {
            return redirect($audio->path);
        }

        $fileName = $audio->getFileName();
        $audioStream = $this->audioService->streamAudioFromStorage($audio);
        $audioSize = $this->audioService->getAudioFileSize($audio);

        if ($request->get('open') === 'true') {
            return $this->download()->streamedInline($audioStream, $fileName, $audioSize);
        }

        return $this->download()->streamedDirectly($audioStream, $fileName, $audioSize);
    }

    /**
     * Delete a specific audio in the system.
     *
     * @throws Exception
     */
    public function delete(string $audioId)
    {
        /** @var Audio $audio */
        $audio = Audio::query()->findOrFail($audioId);
        $this->checkOwnablePermission('audio-delete', $audio);
        $this->audioService->deleteFile($audio);

        return response()->json(['message' => trans('entities.audios_deleted')]);
    }
}
