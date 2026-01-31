<?php

namespace BookStack\Uploads\Controllers;

use BookStack\Entities\Queries\PageQueries;
use BookStack\Exceptions\FileUploadException;
use BookStack\Http\ApiController;
use BookStack\Uploads\Audio;
use BookStack\Uploads\AudioService;
use Exception;
use Illuminate\Contracts\Filesystem\FileNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AudioApiController extends ApiController
{
    public function __construct(
        protected AudioService $audioService,
        protected PageQueries $pageQueries,
    ) {
    }

    /**
     * Get a listing of audios visible to the user.
     * The external property indicates whether the audio is simple a link.
     * A false value for the external property would indicate a file upload.
     */
    public function list()
    {
        return $this->apiListingResponse(Audio::visible(), [
            'id', 'name', 'extension', 'uploaded_to', 'external', 'order', 'created_at', 'updated_at', 'created_by', 'updated_by',
        ]);
    }

    /**
     * Create a new audio in the system.
     * An uploaded_to value must be provided containing an ID of the page
     * that this upload will be related to.
     *
     * If you're uploading a file the POST data should be provided via
     * a multipart/form-data type request instead of JSON.
     *
     * @throws ValidationException
     * @throws FileUploadException
     */
    public function create(Request $request)
    {
        $this->checkPermission('audio-create-all');
        $requestData = $this->validate($request, $this->rules()['create']);

        $pageId = $request->get('uploaded_to');
        $page = $this->pageQueries->findVisibleByIdOrFail($pageId);
        $this->checkOwnablePermission('page-update', $page);

        if ($request->hasFile('file')) {
            $uploadedFile = $request->file('file');
            $audio = $this->audioService->saveNewUpload($uploadedFile, $page->id);
        } else {
            $audio = $this->audioService->saveNewFromLink(
                $requestData['name'],
                $requestData['link'],
                $page->id
            );
        }

        $this->audioService->updateFile($audio, $requestData);

        return response()->json($audio);
    }

    /**
     * Get the details & content of a single audio of the given ID.
     * The audio link or file content is provided via a 'content' property.
     * For files the content will be base64 encoded.
     *
     * @throws FileNotFoundException
     */
    public function read(string $id)
    {
        /** @var Audio $audio */
        $audio = Audio::visible()
            ->with(['createdBy', 'updatedBy'])
            ->findOrFail($id);

        $audio->setAttribute('links', [
            'html'     => $audio->htmlLink(),
            'markdown' => $audio->markdownLink(),
        ]);

        // Simply return a JSON response of the audio for link-based audios
        if ($audio->external) {
            $audio->setAttribute('content', $audio->path);

            return response()->json($audio);
        }

        // Build and split our core JSON, at point of content.
        $splitter = 'CONTENT_SPLIT_LOCATION_' . time() . '_' . rand(1, 40000);
        $audio->setAttribute('content', $splitter);
        $json = $audio->toJson();
        $jsonParts = explode($splitter, $json);
        // Get a stream for the file data from storage
        $stream = $this->audioService->streamAudioFromStorage($audio);

        return response()->stream(function () use ($jsonParts, $stream) {
            // Output the pre-content JSON data
            echo $jsonParts[0];

            // Stream out our audio data as base64 content
            stream_filter_append($stream, 'convert.base64-encode', STREAM_FILTER_READ);
            fpassthru($stream);
            fclose($stream);

            // Output our post-content JSON data
            echo $jsonParts[1];
        }, 200, ['Content-Type' => 'application/json']);
    }

    /**
     * Update the details of a single audio.
     * As per the create endpoint, if a file is being provided as the audio content
     * the request should be formatted as a multipart/form-data request instead of JSON.
     *
     * @throws ValidationException
     * @throws FileUploadException
     */
    public function update(Request $request, string $id)
    {
        $requestData = $this->validate($request, $this->rules()['update']);
        /** @var Audio $audio */
        $audio = Audio::visible()->findOrFail($id);

        $page = $audio->page;
        if ($requestData['uploaded_to'] ?? false) {
            $pageId = $request->get('uploaded_to');
            $page = $this->pageQueries->findVisibleByIdOrFail($pageId);
            $audio->uploaded_to = $requestData['uploaded_to'];
        }

        $this->checkOwnablePermission('page-view', $page);
        $this->checkOwnablePermission('page-update', $page);
        $this->checkOwnablePermission('audio-update', $audio);

        if ($request->hasFile('file')) {
            $uploadedFile = $request->file('file');
            $audio = $this->audioService->saveUpdatedUpload($uploadedFile, $audio);
        }

        $this->audioService->updateFile($audio, $requestData);

        return response()->json($audio);
    }

    /**
     * Delete an audio of the given ID.
     *
     * @throws Exception
     */
    public function delete(string $id)
    {
        /** @var Audio $audio */
        $audio = Audio::visible()->findOrFail($id);
        $this->checkOwnablePermission('audio-delete', $audio);

        $this->audioService->deleteFile($audio);

        return response('', 204);
    }

    protected function rules(): array
    {
        return [
            'create' => [
                'name'        => ['required', 'string', 'min:1', 'max:255'],
                'uploaded_to' => ['required', 'integer', 'exists:pages,id'],
                'file'        => array_merge(['required_without:link'], $this->audioService->getFileValidationRules()),
                'link'        => ['required_without:file', 'string', 'min:1', 'max:2000', 'safe_url'],
            ],
            'update' => [
                'name'        => ['string', 'min:1', 'max:255'],
                'uploaded_to' => ['integer', 'exists:pages,id'],
                'file'        => $this->audioService->getFileValidationRules(),
                'link'        => ['string', 'min:1', 'max:2000', 'safe_url'],
            ],
        ];
    }
}
