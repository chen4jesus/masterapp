<?php

namespace BookStack\References\ModelResolvers;

use BookStack\App\Model;
use BookStack\Uploads\Audio;
use Illuminate\Support\Str;

class AudioModelResolver implements CrossLinkModelResolver
{
    /**
     * Resolve the given link to a Model.
     */
    public function resolve(string $link): ?Model
    {
        $id = $this->extractAudioId($link);
        if (is_null($id)) {
            return null;
        }

        /** @var ?Audio $audio */
        $audio = Audio::query()->find($id);
        
        // Return the audio regardless of whether it's external or not
        // This ensures proper handling in exports for both internal and external audio files
        return $audio;
    }

    /**
     * Parse the audio ID from a link.
     */
    protected function extractAudioId(string $link): ?int
    {
        // Match standard pattern like /audios/123
        $pattern = '/\/audios\/([0-9]+)/';
        $matches = [];
        $match = preg_match($pattern, $link, $matches);
        if ($match) {
            return intval($matches[1]);
        }
        
        // Also try to match for patterns like domain.com/audios/123 or IP/audios/123
        $ipPattern = '/\/\/[0-9.]+\/audios\/([0-9]+)/';
        $match = preg_match($ipPattern, $link, $matches);
        if ($match) {
            return intval($matches[1]);
        }
        
        // Try to extract from URLs with query parameters
        if (strpos($link, '/audios/') !== false) {
            $parts = explode('/audios/', $link);
            if (count($parts) > 1) {
                $idPart = explode('?', $parts[1])[0];
                $idPart = explode('#', $idPart)[0];
                if (is_numeric($idPart)) {
                    return intval($idPart);
                }
            }
        }

        return null;
    }
}
