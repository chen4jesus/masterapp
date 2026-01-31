<?php

namespace BookStack\Uploads;

use BookStack\Exceptions\FileUploadException;
use Exception;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class AudioService
{
    public function __construct(
        protected FileStorage $storage,
    ) {
    }

    /**
     * Stream an audio from storage.
     *
     * @return resource|null
     */
    public function streamAudioFromStorage(Audio $audio)
    {
        return $this->storage->getReadStream($audio->path);
    }

    /**
     * Read the file size of an audio from storage, in bytes.
     */
    public function getAudioFileSize(Audio $audio): int
    {
        return $this->storage->getSize($audio->path);
    }

    /**
     * Store a new audio upon user upload.
     *
     * @throws FileUploadException
     */
    public function saveNewUpload(UploadedFile $uploadedFile, int $pageId): Audio
    {
        $audioName = $uploadedFile->getClientOriginalName();
        $audioPath = $this->putFileInStorage($uploadedFile);
        $largestExistingOrder = Audio::query()->where('uploaded_to', '=', $pageId)->max('order');

        /** @var Audio $audio */
        $audio = Audio::query()->forceCreate([
            'name'        => $audioName,
            'path'        => $audioPath,
            'extension'   => $uploadedFile->getClientOriginalExtension(),
            'uploaded_to' => $pageId,
            'created_by'  => user()->id,
            'updated_by'  => user()->id,
            'order'       => $largestExistingOrder + 1,
        ]);

        return $audio;
    }

    /**
     * Store an upload, saving to a file and deleting any existing uploads
     * attached to that file.
     *
     * @throws FileUploadException
     */
    public function saveUpdatedUpload(UploadedFile $uploadedFile, Audio $audio): Audio
    {
        if (!$audio->external) {
            $this->deleteFileInStorage($audio);
        }

        $audioName = $uploadedFile->getClientOriginalName();
        $audioPath = $this->putFileInStorage($uploadedFile);

        $audio->name = $audioName;
        $audio->path = $audioPath;
        $audio->external = false;
        $audio->extension = $uploadedFile->getClientOriginalExtension();
        $audio->save();

        return $audio;
    }

    /**
     * Save a new File audio from a given link and name.
     */
    public function saveNewFromLink(string $name, string $link, int $page_id): Audio
    {
        $largestExistingOrder = Audio::where('uploaded_to', '=', $page_id)->max('order');

        return Audio::forceCreate([
            'name'        => $name,
            'path'        => $link,
            'external'    => true,
            'extension'   => '',
            'uploaded_to' => $page_id,
            'created_by'  => user()->id,
            'updated_by'  => user()->id,
            'order'       => $largestExistingOrder + 1,
        ]);
    }

    /**
     * Updates the ordering for a listing of attached files.
     */
    public function updateFileOrderWithinPage(array $audioOrder, string $pageId)
    {
        foreach ($audioOrder as $index => $audioId) {
            Audio::query()->where('uploaded_to', '=', $pageId)
                ->where('id', '=', $audioId)
                ->update(['order' => $index]);
        }
    }

    /**
     * Update the details of a file.
     */
    public function updateFile(Audio $audio, array $requestData): Audio
    {
        if (isset($requestData['name'])) {
            $audio->name = $requestData['name'];
        }

        $link = trim($requestData['link'] ?? '');
        if (!empty($link)) {
            if (!$audio->external) {
                $this->deleteFileInStorage($audio);
                $audio->external = true;
                $audio->extension = '';
            }
            $audio->path = $link;
        }

        $audio->save();

        return $audio->refresh();
    }

    /**
     * Delete a File from the database and storage.
     *
     * @throws Exception
     */
    public function deleteFile(Audio $audio)
    {
        if (!$audio->external) {
            $this->deleteFileInStorage($audio);
        }

        $audio->delete();
    }

    /**
     * Delete a file from the filesystem it sits on.
     * Cleans any empty leftover folders.
     */
    public function deleteFileInStorage(Audio $audio): void
    {
        $this->storage->delete($audio->path);
    }

    /**
     * Store a file in storage with the given filename.
     *
     * @throws FileUploadException
     */
    protected function putFileInStorage(UploadedFile $uploadedFile): string
    {
        $basePath = 'uploads/files/' . date('Y-m-M') . '/';

        return $this->storage->uploadFile(
            $uploadedFile,
            $basePath,
            $uploadedFile->getClientOriginalExtension(),
            ''
        );
    }

    /**
     * Get the file validation rules for audios.
     */
    public static function getFileValidationRules(): array
    {
        return ['file', 'max:' . (config('app.upload_limit') * 10000) , 'mimes:mp3,wav,ogg,flac,alac,aiff,opus,mp4,avi,mov,wmv,mkv,webm,flv,3gp,mpg,mpeg,ogv,tr,rm'];
    }
}
