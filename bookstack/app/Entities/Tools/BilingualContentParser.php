<?php

namespace BookStack\Entities\Tools;

/**
 * Parses bilingual content blocks in the format:
 * {{< bilingual >}}
 * ::zh::
 * Chinese content paragraphs...
 * ::en::
 * English content paragraphs...
 * {{< /bilingual >}}
 * 
 * And converts them to side-by-side HTML format for bilingual reading.
 */
class BilingualContentParser
{
    /**
     * Parse content and convert bilingual blocks to HTML.
     */
    public function parse(string $content): string
    {
        $content = $this->normalizeMarkers($content);
        $content = $this->normalizeContent($content);

        // Match the full bilingual block pattern
        $pattern = '/\{\{<\s*bilingual\s*>\}\}(.*?)\{\{<\s*\/bilingual\s*>\}\}/s';

        return preg_replace_callback($pattern, function ($matches) {
            return $this->processBilingualBlock($matches[1]);
        }, $content);
    }

    protected function normalizeMarkers(string $content): string
    {
        $content = preg_replace('/\{\{&lt;\s*bilingual\s*&gt;\}\}/i', '{{< bilingual >}}', $content);
        $content = preg_replace('/\{\{&lt;\s*\/bilingual\s*&gt;\}\}/i', '{{< /bilingual >}}', $content);
        return $content;
    }

    protected function normalizeContent(string $content): string
    {
        // Remove P wrapper around markers
        $content = preg_replace('/<p[^>]*>\s*(\{\{<\s*bilingual\s*>\}\})\s*<\/p>/i', '$1', $content);
        $content = preg_replace('/<p[^>]*>\s*(\{\{<\s*\/bilingual\s*>\}\})\s*<\/p>/i', '$1', $content);
        $content = preg_replace('/<p[^>]*>\s*(::zh::)\s*<\/p>/i', '$1', $content);
        $content = preg_replace('/<p[^>]*>\s*(::en::)\s*<\/p>/i', '$1', $content);

        return $content;
    }

    protected function processBilingualBlock(string $blockContent): string
    {
        $zhContent = '';
        $enContent = '';

        // Default to new format with ::zh:: and ::en::
        // Order: ::zh:: -> ::en:: -> end
        // Content between ::zh:: and ::en:: is Chinese
        // Content between ::en:: and end is English

        $zhStart = strpos($blockContent, '::zh::');
        $enStart = strpos($blockContent, '::en::');

        if ($zhStart !== false && $enStart !== false) {
            // Assume standard order ::zh:: comes first usually, but support either if needed.
            // Based on tool request: ::zh:: then ::en::
            if ($zhStart < $enStart) {
                $zhLen = $enStart - ($zhStart + 6); // 6 is len of ::zh::
                $zhContent = substr($blockContent, $zhStart + 6, $zhLen);
                $enContent = substr($blockContent, $enStart + 6);
            } else {
                // English first?
                $enLen = $zhStart - ($enStart + 6);
                $enContent = substr($blockContent, $enStart + 6, $enLen);
                $zhContent = substr($blockContent, $zhStart + 6);
            }
        } else {
            // Fallback for legacy format [zh]...[/zh]
            if (preg_match('/\[zh\](.*?)\[\/zh\]/s', $blockContent, $m))
                $zhContent = $m[1];
            if (preg_match('/\[en\](.*?)\[\/en\]/s', $blockContent, $m))
                $enContent = $m[1];
        }

        $zhParagraphs = $this->splitIntoParagraphs($zhContent);
        $enParagraphs = $this->splitIntoParagraphs($enContent);
        $blockId = 'bilingual-' . uniqid();

        return $this->generateHtml($blockId, $zhParagraphs, $enParagraphs);
    }

    protected function splitIntoParagraphs(string $content): array
    {
        // Handle HTML formatting. This is similar to previous logic.
        // Strip P tags but keep boundaries.
        // Replace <p>...</p> with content + newline

        // Improve: handle various HTML structures more cleanly
        // First convert <br> to newline
        $content = preg_replace('/<br\s*\/?>/i', "\n", $content);
        // Convert block end tags to newlines
        $content = preg_replace('/<\/p>/i', "\n\n", $content);
        $content = preg_replace('/<\/div>/i', "\n\n", $content);

        // Strip other tags
        $content = strip_tags($content);

        // Decode entities
        $content = html_entity_decode($content, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Split by newlines
        $lines = preg_split('/\n\s*\n/', $content, -1, PREG_SPLIT_NO_EMPTY);

        return array_values(array_filter(array_map(function ($l) {
            return trim($l);
        }, $lines)));
    }

    protected function generateHtml(string $blockId, array $zhParagraphs, array $enParagraphs): string
    {
        $zhParagraphs = array_values($zhParagraphs);
        $enParagraphs = array_values($enParagraphs);
        $max = max(count($zhParagraphs), count($enParagraphs));
        if ($max === 0)
            return '';

        $html = '<div component="bilingual-content" class="bilingual-container" data-bilingual-block="' . htmlspecialchars($blockId) . '">';
        $html .= '<div class="bilingual-header">';
        $html .= '<div class="bilingual-header-zh">中文</div>';
        $html .= '<div class="bilingual-header-en">ENGLISH</div>';
        $html .= '</div>';
        $html .= '<div class="bilingual-content">';

        for ($i = 0; $i < $max; $i++) {
            $zhPara = $zhParagraphs[$i] ?? '';
            $enPara = $enParagraphs[$i] ?? '';
            $html .= '<div class="bilingual-row" data-paragraph-index="' . $i . '">';
            $html .= '<div class="bilingual-cell bilingual-zh" data-para-id="' . htmlspecialchars($blockId) . '-' . $i . '-zh"><div class="bilingual-paragraph">' . nl2br(htmlspecialchars($zhPara)) . '</div></div>';
            $html .= '<div class="bilingual-cell bilingual-en" data-para-id="' . htmlspecialchars($blockId) . '-' . $i . '-en"><div class="bilingual-paragraph">' . nl2br(htmlspecialchars($enPara)) . '</div></div>';
            $html .= '</div>';
        }

        $html .= '</div></div>';
        return $html;
    }
}
