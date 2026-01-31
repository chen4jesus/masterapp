<?php

namespace BookStack\Entities\Controllers;

use BookStack\Http\ApiController;
use BookStack\Entities\Models\BibleVerse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class BibleVerseController extends ApiController
{
    /**
     * Get Bible verses by reference
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getVerses(Request $request)
    {
        // Log the raw input for debugging
        Log::debug('Bible verse request received', [
            'raw_input' => $request->all(),
            'verse_ranges_type' => gettype($request->input('verse_ranges')),
            'verse_ranges_raw' => $request->input('verse_ranges')
        ]);

        $validator = Validator::make($request->all(), [
            'book' => 'required|integer|min:1|max:66',
            'chapter' => 'required|integer|min:1',
            'verse' => 'nullable|integer|min:1',
            'end_verse' => 'nullable|integer|min:1',
            'verse_ranges' => 'nullable|array',
            'verse_ranges.*.start' => 'required_with:verse_ranges|integer|min:1',
            'verse_ranges.*.end' => 'required_with:verse_ranges|integer|min:1',
        ]);

        if ($validator->fails()) {
            Log::info('Bible verse validation failed', [
                'errors' => $validator->errors()->toArray(),
                'input' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Invalid parameters',
                'errors' => $validator->errors(),
            ], 400);
        }

        $book = $request->input('book');
        $chapter = $request->input('chapter');
        $verse = $request->input('verse');
        $endVerse = $request->input('end_verse');
        $verseRanges = $request->input('verse_ranges');

        // Cache key for this request
        $cacheKey = "bible_verses_{$book}_{$chapter}";
        if ($verse) {
            $cacheKey .= "_{$verse}";
            if ($endVerse) {
                $cacheKey .= "_{$endVerse}";
            }
        }

        // If verse_ranges is provided, add it to the cache key
        if ($verseRanges) {
            $rangesKey = '';
            foreach ($verseRanges as $range) {
                $rangesKey .= "_{$range['start']}-{$range['end']}";
            }
            $cacheKey .= "_ranges" . $rangesKey;
        }

        // Log the request
        Log::info('Bible verse request', [
            'book' => $book,
            'chapter' => $chapter,
            'verse' => $verse,
            'end_verse' => $endVerse,
            'verse_ranges' => $verseRanges,
            'cache_key' => $cacheKey
        ]);

        // Check if data exists in cache
        if (Cache::has($cacheKey)) {
            Log::info('Bible verses found in cache', ['cache_key' => $cacheKey]);
            $result = Cache::get($cacheKey);
        } else {
            Log::info('Bible verses not found in cache, fetching from database', ['cache_key' => $cacheKey]);
            
            try {
                // Log the database query
                Log::debug('Executing Bible verse database query', [
                    'book' => $book,
                    'chapter' => $chapter,
                    'verse' => $verse,
                    'end_verse' => $endVerse,
                    'verse_ranges' => $verseRanges
                ]);
                
                $verses = BibleVerse::getVersesByReference($book, $chapter, $verse, $endVerse, $verseRanges);
                
                if ($verses->isEmpty()) {
                    Log::info('No Bible verses found for reference', [
                        'book' => $book,
                        'chapter' => $chapter,
                        'verse' => $verse,
                        'end_verse' => $endVerse,
                        'verse_ranges' => $verseRanges
                    ]);
                    
                    $result = [
                        'success' => false,
                        'message' => 'No verses found for the given reference',
                        'data' => [],
                    ];
                } else {
                $bookNames = BibleVerse::getBookNames();
                $bookName = $bookNames[$book] ?? "Book {$book}";
                
                $formattedVerses = $verses->map(function ($verse) {
                    return [
                        'book' => $verse->book,
                        'chapter' => $verse->chapter,
                        'verse' => $verse->verse,
                        'text' => $verse->text,
                    ];
                });
                
                    Log::info('Bible verses retrieved successfully', [
                        'book' => $book,
                        'chapter' => $chapter,
                        'count' => $verses->count()
                    ]);
                    
                    $result = [
                    'success' => true,
                    'message' => 'Verses retrieved successfully',
                    'data' => [
                        'book_name' => $bookName,
                        'book' => $book,
                        'chapter' => $chapter,
                        'verses' => $formattedVerses,
                    ],
                ];
                }
                
                // Store in cache for 24 hours
                Cache::put($cacheKey, $result, 60 * 24);
                Log::info('Bible verses stored in cache', ['cache_key' => $cacheKey]);
                
            } catch (\Exception $e) {
                Log::error('Error retrieving Bible verses: ' . $e->getMessage(), [
                    'book' => $book,
                    'chapter' => $chapter,
                    'verse' => $verse,
                    'end_verse' => $endVerse,
                    'verse_ranges' => $verseRanges,
                    'exception' => $e
                ]);
                
                $result = [
                    'success' => false,
                    'message' => 'Error retrieving verses',
                    'data' => [],
                ];
            }
        }

        return response()->json($result);
    }

    /**
     * Parse a Bible reference string
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function parseReference(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'reference' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            Log::info('Bible reference validation failed', [
                'errors' => $validator->errors()->toArray(),
                'input' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Invalid parameters',
                'errors' => $validator->errors(),
            ], 400);
        }

        $reference = $request->input('reference');
        
        Log::info('Parsing Bible reference', ['reference' => $reference]);
        
        try {
            $parsed = $this->parseReferenceString($reference);
            
            if (!$parsed) {
                Log::info('Failed to parse Bible reference', [
                    'reference' => $reference,
                    'original_reference' => $request->input('reference')
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Could not parse the reference',
                    'data' => null,
                ]);
            }
        
            Log::info('Bible reference parsed successfully', [
                'reference' => $reference,
                'parsed' => $parsed
            ]);
                
            return response()->json([
                'success' => true,
                'message' => 'Reference parsed successfully',
                'data' => $parsed,
            ]);
        } catch (\Exception $e) {
            Log::error('Error parsing Bible reference: ' . $e->getMessage(), [
                'reference' => $reference,
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error parsing the reference',
                'data' => null,
            ]);
        }
    }

    /**
     * Parse a Bible reference string into its components
     *
     * @param string $reference
     * @return array|null
     */
    private function parseReferenceString($reference)
    {
        // Log the original reference
        Log::info('Parsing Bible reference', [
            'reference' => $reference,
            'reference_hex' => bin2hex($reference)
        ]);
        
        // Clean up encoding issues first - this also handles Chinese punctuation
        $reference = $this->cleanupEncoding($reference);
        
        // Trim whitespace
        $reference = trim($reference);
        
        // Common patterns:
        // 1. Book Chapter:Verse (e.g., "约翰福音 3:16" or "约 3:16")
        // 2. Book Chapter:Verse-Verse (e.g., "约翰福音 3:16-18" or "约 3:16-18")
        // 3. Book Chapter (e.g., "约翰福音 3" or "约 3")
        // 4. Book Chapter:Verse, Verse (e.g., "约 3:16, 18")
        // 5. Book Chapter:Verse, Verse-Verse (e.g., "约 3:16, 18-20")
        // 6. Book Chapter:Verse-Verse, Verse, Verse-Verse (e.g., "约 3:16-18, 20, 22-24")
        // 7. Book Chapter:Verse; Chapter:Verse (e.g., "约 3:16; 5:1-5; 6:13")
        // 8. Book Chapter:Verse-Chaper:Verse (e.g., "创2:17；2:15-3:24")
        // 9. Numbered books (e.g., "约一5:13" for 1 John 5:13)
        // 10. Numbered books with no space (e.g., "约三1:15" for 3 John 1:15)
        
        $bookAbbreviations = BibleVerse::getBookAbbreviations();
        
        // Sort abbreviations by length (longest first) to ensure we match the most specific abbreviation
        // This prevents "约" from matching before "约一", "约二", "约三"
        $abbrevKeys = array_keys($bookAbbreviations);
        usort($abbrevKeys, function ($a, $b) {
            return mb_strlen($b, 'UTF-8') - mb_strlen($a, 'UTF-8');
        });
        
        Log::debug('Sorted abbreviation keys', [
            'first_10_keys' => array_slice($abbrevKeys, 0, 10),
            'reference' => $reference,
            'reference_encoding' => mb_detect_encoding($reference, ['UTF-8', 'ASCII', 'GBK', 'GB18030', 'BIG5'], true)
        ]);
        
        // Try to match the book name or abbreviation
        $bookMatch = null;
        $remainingText = $reference;
        
        foreach ($abbrevKeys as $abbr) {
            $bookId = $bookAbbreviations[$abbr];
            
            // Allow for potential spaces within the abbreviation (e.g., "约 一" for "约一")
            $abbrPattern = preg_quote($abbr, '/');
            $abbrPattern = str_replace(' ', '\s*', $abbrPattern); // Make spaces optional
            
            // Try to match the abbreviation at the beginning of the reference with optional spaces
            if (preg_match('/^' . $abbrPattern . '\s*/u', $reference, $matches)) {
                $bookMatch = [
                    'id' => $bookId,
                    'name' => BibleVerse::getBookNames()[$bookId] ?? "Book {$bookId}",
                    'abbr' => $abbr,
                ];
                $matchLength = mb_strlen($matches[0], 'UTF-8');
                $remainingText = mb_substr($reference, $matchLength, null, 'UTF-8');
                
                Log::debug('Matched book abbreviation', [
                    'reference' => $reference,
                    'matched_text' => $matches[0],
                    'abbr' => $abbr,
                    'pattern' => '/^' . $abbrPattern . '\s*/u',
                    'book_id' => $bookId,
                    'book_name' => $bookMatch['name'],
                    'remaining_text' => $remainingText,
                    'match_length' => $matchLength
                ]);
                
                break;
            }
        }
        
        if (!$bookMatch) {
            Log::warning("Failed to match book in reference: {$reference}", [
                'available_keys' => array_slice($abbrevKeys, 0, 20)
            ]);
            return null;
        }
        
        // Clean up the remaining text to ensure it's properly encoded
        // But don't repeat entire cleanup as it was already done
        $remainingText = trim($remainingText);
        
        // Handle special case for numbered books with no space (e.g., "约三1:15")
        // Extract the chapter/verse part if it directly follows the book abbreviation
        if (preg_match('/^(\d+)/', $remainingText, $matches)) {
            Log::debug('Found digit immediately after book abbreviation', [
                'remaining_text' => $remainingText,
                'first_digit' => $matches[1]
            ]);
            
            // We already have the book match so we can proceed with parsing
        }
        
        // Split by semicolons to handle multiple chapters
        $chapterParts = preg_split('/[;；]/', $remainingText);
        $chapterReferences = [];
        
        Log::debug('Processing chapter parts', [
            'remaining_text' => $remainingText,
            'chapter_parts' => $chapterParts
        ]);
        
        foreach ($chapterParts as $chapterPart) {
            $chapterPart = trim($chapterPart);
            if (empty($chapterPart)) continue;
            
            // Parse chapter and verses for this part
            $chapterReference = $this->parseChapterPart($chapterPart, $bookMatch);
            if ($chapterReference) {
                $chapterReferences[] = $chapterReference;
                Log::debug('Successfully parsed chapter part', [
                    'part' => $chapterPart,
                    'parsed' => $chapterReference
                ]);
            } else {
                Log::warning('Failed to parse chapter part', [
                    'part' => $chapterPart,
                    'book' => $bookMatch['abbr']
                ]);
            }
        }
        
        if (empty($chapterReferences)) {
            Log::warning("Failed to parse any chapter references: {$reference}", [
                'remaining_text' => $remainingText,
                'chapter_parts' => $chapterParts
            ]);
            return null;
        }
        
        // For backward compatibility, return the first chapter reference with multi-chapter flag
        $result = $chapterReferences[0];
        $result['is_multi_chapter'] = count($chapterReferences) > 1;
        $result['chapter_references'] = $chapterReferences;
        
        return $result;
    }
    
    /**
     * Parse a single chapter part from a reference
     *
     * @param string $chapterPart
     * @param array $bookMatch
     * @return array|null
     */
    private function parseChapterPart($chapterPart, $bookMatch)
    {
        Log::debug('Parsing chapter part', [
            'original_part' => $chapterPart,
            'original_part_hex' => bin2hex($chapterPart),
            'book_match' => $bookMatch['abbr']
        ]);
        
        // Clean up encoding issues
        $chapterPart = $this->cleanupEncoding($chapterPart);
        
        // Convert Chinese numerals to Arabic if present
        $originalChapterPart = $chapterPart;
        $chapterPart = $this->convertChineseNumerals($chapterPart);
        
        if ($originalChapterPart !== $chapterPart) {
            Log::debug('Converted Chinese numerals', [
                'original' => $originalChapterPart,
                'converted' => $chapterPart
            ]);
        }
        
        // Normalize all separators to make parsing more consistent
        // Replace Chinese punctuation again to ensure all variants are handled
        $chapterPart = str_replace(
            ['：', '，', '；', '（', '）', '、'],
            [':', ',', ';', '(', ')', ','],
            $chapterPart
        );
        
        // Extract all digits from the string to find the chapter number
        if (preg_match_all('/\d+/', $chapterPart, $matches)) {
            $allDigits = $matches[0];
            Log::debug('Found all digits in chapter part', [
                'all_digits' => $allDigits
            ]);
            
            if (count($allDigits) == 0) {
                Log::warning('No digits found in chapter part', [
                    'part' => $chapterPart
                ]);
                return null;
            }
            
            // First number is the chapter
            $chapter = (int) $allDigits[0];
            
            // Parse verse numbers if available
            $verseRanges = [];
            
            // Check if we have a chapter:verse format
            if (strpos($chapterPart, ':') !== false) {
                // Chapter:verse format
                $parts = explode(':', $chapterPart, 2);
                
                if (isset($parts[1])) {
                    $versesSection = trim($parts[1]);
                    Log::debug('Found verses section after colon', [
                        'verses_section' => $versesSection
                    ]);
                    
                    // Process the verses section to handle various formats
                    $this->processVersesSection($versesSection, $verseRanges);
                }
            } else if (count($allDigits) > 1) {
                // If we have more than one digit but no colon, assume the second digit is a verse
                // Special handling for formats like "chapter_num verse_num" without a colon
                $chapter = (int) $allDigits[0];
                
                // Check if there's a range pattern like "2 6-7"
                if (strpos($chapterPart, '-') !== false && count($allDigits) >= 3) {
                    // This could be a format like "chapter verse-verse" or "chapter verse-verse, verse"
                    $this->processVersesWithoutColon($chapterPart, $allDigits, $verseRanges);
                } else {
                    // Simple format with just chapter and verse
                    $verseRanges[] = [
                        'start' => (int) $allDigits[1],
                        'end' => (int) $allDigits[1],
                    ];
                    
                    Log::debug('Assumed second digit as verse without colon', [
                        'chapter' => $chapter,
                        'verse' => (int) $allDigits[1]
                    ]);
                }
            } else {
                // Only chapter, no verse
                Log::debug('Only chapter number found', [
                    'chapter' => $chapter
                ]);
            }
            
            // For backward compatibility, set verse and end_verse based on the first range
            $verse = !empty($verseRanges) ? $verseRanges[0]['start'] : null;
            $endVerse = (!empty($verseRanges) && $verseRanges[0]['end'] !== $verseRanges[0]['start']) 
                ? $verseRanges[0]['end'] 
                : null;
            
            $result = [
                'book' => $bookMatch['id'],
                'book_name' => $bookMatch['name'],
                'chapter' => $chapter,
                'verse' => $verse,
                'end_verse' => $endVerse,
                'verse_ranges' => $verseRanges,
            ];
            
            Log::debug('Successfully parsed chapter part', [
                'result' => $result
            ]);
            
            return $result;
        }
        
        // If we couldn't extract any digits, log and return null
        Log::warning('No digits found in chapter part', [
            'part' => $chapterPart,
            'part_hex' => bin2hex($chapterPart)
        ]);
        
        return null;
    }
    
    /**
     * Process verses section from "chapter:verse" format
     *
     * @param string $versesSection
     * @param array &$verseRanges
     * @return void
     */
    private function processVersesSection($versesSection, &$verseRanges)
    {
        Log::debug('Processing verses section', [
            'verses_section' => $versesSection
        ]);
        
        // Extract all digits from the verses section
        preg_match_all('/\d+/', $versesSection, $verseMatches);
        $verseDigits = $verseMatches[0];
        
        if (count($verseDigits) === 0) {
            Log::debug('No verse digits found in verses section', [
                'verses_section' => $versesSection
            ]);
            return;
        }
        
        // Handle verse ranges with dashes (e.g., "16-18")
        if (strpos($versesSection, '-') !== false) {
            $this->processVerseRanges($versesSection, $verseRanges);
        } 
        // Handle comma-separated verses (e.g., "16, 18")
        else if (strpos($versesSection, ',') !== false || strpos($versesSection, '，') !== false) {
            $this->processCommaVerses($versesSection, $verseRanges);
        } 
        // Handle simple single verse (e.g., "16")
        else {
            $verseRanges[] = [
                'start' => (int) $verseDigits[0],
                'end' => (int) $verseDigits[0],
            ];
            
            Log::debug('Added single verse from simple format', [
                'verse' => (int) $verseDigits[0]
            ]);
        }
        
        // Log the resulting verse ranges for debugging
        Log::debug('Processed verse ranges', [
            'verses_section' => $versesSection,
            'verse_ranges' => $verseRanges
        ]);
    }
    
    /**
     * Process verse ranges with dashes (e.g., "16-18")
     *
     * @param string $versesSection
     * @param array &$verseRanges
     * @return void
     */
    private function processVerseRanges($versesSection, &$verseRanges)
    {
        // Normalize commas in Chinese and Western styles
        $normalizedSection = str_replace('，', ',', $versesSection);
        
        // Split by commas first to handle formats like "16-18, 20, 22-24"
        $commaParts = preg_split('/,/', $normalizedSection);
        
        Log::debug('Processing verse ranges', [
            'verses_section' => $versesSection,
            'comma_parts' => $commaParts
        ]);
        
        foreach ($commaParts as $commaPart) {
            $commaPart = trim($commaPart);
            if (empty($commaPart)) continue;
            
            // Check if this part contains a range
            if (strpos($commaPart, '-') !== false) {
                $rangeParts = explode('-', $commaPart);
                
                // Extract first and last number from the range
                $rangeStart = null;
                $rangeEnd = null;
                
                if (preg_match('/\d+/', $rangeParts[0], $match)) {
                    $rangeStart = (int) $match[0];
                }
                
                if (isset($rangeParts[1]) && preg_match('/\d+/', $rangeParts[1], $match)) {
                    $rangeEnd = (int) $match[0];
                }
                
                if ($rangeStart !== null && $rangeEnd !== null) {
                    $verseRanges[] = [
                        'start' => $rangeStart,
                        'end' => $rangeEnd,
                    ];
                    
                    Log::debug('Added verse range', [
                        'start' => $rangeStart,
                        'end' => $rangeEnd
                    ]);
                } else if ($rangeStart !== null) {
                    $verseRanges[] = [
                        'start' => $rangeStart,
                        'end' => $rangeStart,
                    ];
                    
                    Log::debug('Added single verse from incomplete range', [
                        'verse' => $rangeStart
                    ]);
                }
            } else {
                // Just a single verse
                if (preg_match('/\d+/', $commaPart, $match)) {
                    $verse = (int) $match[0];
                    $verseRanges[] = [
                        'start' => $verse,
                        'end' => $verse,
                    ];
                    
                    Log::debug('Added single verse from comma part', [
                        'verse' => $verse
                    ]);
                }
            }
        }
    }
    
    /**
     * Process comma-separated verses (e.g., "16, 18")
     *
     * @param string $versesSection
     * @param array &$verseRanges
     * @return void
     */
    private function processCommaVerses($versesSection, &$verseRanges)
    {
        // Normalize commas in Chinese and Western styles
        $normalizedSection = str_replace('，', ',', $versesSection);
        
        $verseParts = preg_split('/,/', $normalizedSection);
        
        Log::debug('Processing comma-separated verses', [
            'verses_section' => $versesSection,
            'verse_parts' => $verseParts
        ]);
        
        foreach ($verseParts as $versePart) {
            $versePart = trim($versePart);
            if (empty($versePart)) continue;
            
            // Check if this part contains a range
            if (strpos($versePart, '-') !== false) {
                // This is a range within comma-separated values (e.g., "16-18, 20")
                $rangeParts = explode('-', $versePart);
                
                // Extract first and last number from the range
                $rangeStart = null;
                $rangeEnd = null;
                
                if (preg_match('/\d+/', $rangeParts[0], $match)) {
                    $rangeStart = (int) $match[0];
                }
                
                if (isset($rangeParts[1]) && preg_match('/\d+/', $rangeParts[1], $match)) {
                    $rangeEnd = (int) $match[0];
                }
                
                if ($rangeStart !== null && $rangeEnd !== null) {
                    $verseRanges[] = [
                        'start' => $rangeStart,
                        'end' => $rangeEnd,
                    ];
                    
                    Log::debug('Added verse range from comma-separated part', [
                        'start' => $rangeStart,
                        'end' => $rangeEnd
                    ]);
                }
            } else if (preg_match('/\d+/', $versePart, $match)) {
                // Single verse within comma-separated values
                $verse = (int) $match[0];
                $verseRanges[] = [
                    'start' => $verse,
                    'end' => $verse,
                ];
                
                Log::debug('Added single verse from comma-separated list', [
                    'verse' => $verse
                ]);
            }
        }
    }
    
    /**
     * Process verses without colon (e.g., "2 6-7")
     *
     * @param string $chapterPart
     * @param array $allDigits
     * @param array &$verseRanges
     * @return void
     */
    private function processVersesWithoutColon($chapterPart, $allDigits, &$verseRanges)
    {
        // For formats like "2 6-7"
        if (strpos($chapterPart, '-') !== false) {
            // Extract the range
            if (preg_match('/(\d+)\s*-\s*(\d+)/', $chapterPart, $matches)) {
                $rangeStart = (int) $matches[1];
                $rangeEnd = (int) $matches[2];
                
                $verseRanges[] = [
                    'start' => $rangeStart,
                    'end' => $rangeEnd,
                ];
                
                Log::debug('Added verse range from no-colon format', [
                    'start' => $rangeStart,
                    'end' => $rangeEnd
                ]);
            }
        }
        
        // For formats like "2 6,7" or "2 6，7"
        if (strpos($chapterPart, ',') !== false || strpos($chapterPart, '，') !== false) {
            // Extract the digits after the first one (chapter)
            $verseDigits = array_slice($allDigits, 1);
            
            foreach ($verseDigits as $verse) {
                $verseRanges[] = [
                    'start' => (int) $verse,
                    'end' => (int) $verse,
                ];
                
                Log::debug('Added verse from comma format without colon', [
                    'verse' => (int) $verse
                ]);
            }
        }
        
        // If no ranges were added and we have multiple digits, add them as individual verses
        if (empty($verseRanges) && count($allDigits) > 1) {
            for ($i = 1; $i < count($allDigits); $i++) {
                $verseRanges[] = [
                    'start' => (int) $allDigits[$i],
                    'end' => (int) $allDigits[$i],
                ];
                
                Log::debug('Added verse from digit array', [
                    'verse' => (int) $allDigits[$i]
                ]);
            }
        }
    }
    
    /**
     * Clean up text to fix encoding issues
     *
     * @param string $text
     * @return string
     */
    private function cleanupEncoding($text)
    {
        // Log the original text in hexadecimal for debugging
        Log::debug('Cleaning up encoding', [
            'original_text' => $text,
            'original_text_hex' => bin2hex($text)
        ]);
        
        // Handle Chinese punctuation consistently before anything else
        // This ensures that even with encoding issues, we attempt to convert punctuation
        $text = str_replace(
            ['：', '，', '；', '（', '）', '、'],
            [':', ',', ';', '(', ')', ','],
            $text
        );
        
        // Check if the string contains Chinese characters
        $containsChinese = preg_match('/[\x{4e00}-\x{9fa5}]/u', $text) || 
                           preg_match('/[\x{3000}-\x{303F}]/u', $text);
        
        if ($containsChinese) {
            // If it contains Chinese characters, we assume it's UTF-8
            Log::debug('Chinese characters detected, assuming UTF-8 encoding');
            // No conversion needed, just clean up
        } else {
            // Try multiple encoding detections and conversions for non-Chinese text
            $encodings = ['UTF-8', 'ASCII', 'ISO-8859-1', 'Windows-1252', 'GB18030', 'GBK', 'BIG5'];
            
            // First, try to detect encoding
            $detectedEncoding = mb_detect_encoding($text, $encodings, true);
            
            if ($detectedEncoding) {
                Log::debug('Detected encoding: ' . $detectedEncoding);
                
                // Convert to UTF-8 if not already
                if ($detectedEncoding !== 'UTF-8') {
                    $text = mb_convert_encoding($text, 'UTF-8', $detectedEncoding);
                }
            } else {
                // If encoding can't be detected, try forced conversion
                Log::debug('Could not detect encoding, trying forced conversion');
                $text = mb_convert_encoding($text, 'UTF-8', 'auto');
            }
        }
        
        // Remove invalid UTF-8 sequences
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/u', '', $text);
        
        // Make sure to preserve all Chinese characters and punctuation
        // Remove only truly non-printable characters
        $text = preg_replace('/[^\p{L}\p{N}\p{Z}\p{P}\p{S}\p{M}]/u', '', $text);
        
        // Remove any BOM
        $text = str_replace("\xEF\xBB\xBF", '', $text);
        
        // Check for Chinese numerals and add spaces between book abbreviations and chapter numbers if needed
        $text = $this->improveReferenceFormatting($text);
        
        // Normalize spaces
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);
        
        // Ensure the result is valid UTF-8
        if (!mb_check_encoding($text, 'UTF-8')) {
            Log::warning('Final string is not valid UTF-8, forcing conversion');
            $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8');
        }
        
        // Log the cleaned text
        Log::debug('Cleaned up encoding', [
            'cleaned_text' => $text,
            'cleaned_text_hex' => bin2hex($text)
        ]);
        
        return $text;
    }

    /**
     * Improve Bible reference formatting to help parsing
     *
     * @param string $text
     * @return string
     */
    private function improveReferenceFormatting($text)
    {
        // Get the book abbreviations to check against
        $bookAbbreviations = array_keys(BibleVerse::getBookAbbreviations());
        
        // Sort by length (longest first) to prevent partial matches
        usort($bookAbbreviations, function ($a, $b) {
            return mb_strlen($b, 'UTF-8') - mb_strlen($a, 'UTF-8');
        });
        
        // For Chinese books like "约一", "约二", "约三", "约壹", "约贰", "约叁" ensure there's a space before any digits
        foreach ($bookAbbreviations as $abbr) {
            // Only process Chinese book abbreviations
            if (preg_match('/[\x{4e00}-\x{9fa5}]/u', $abbr) || 
                preg_match('/[\x{58f9}\x{8cb3}\x{53c3}]/u', $abbr)) { // Match specific traditional Chinese characters
                // Check if the text starts with this abbreviation followed immediately by a digit
                if (preg_match('/^' . preg_quote($abbr, '/') . '(\d)/u', $text, $matches)) {
                    // Add a space between the book abbreviation and the digit
                    $text = preg_replace('/^' . preg_quote($abbr, '/') . '(\d)/u', $abbr . ' $1', $text);
                    Log::debug('Added space between book abbreviation and chapter number', [
                        'book_abbr' => $abbr,
                        'modified_text' => $text
                    ]);
                    break; // We found a match, no need to continue checking
                }
            }
        }
        
        return $text;
    }

    /**
     * Get all Bible verses (for initial loading or fallback)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllVerses()
    {
        Log::info('Retrieving all Bible verses');
        
        $cacheKey = 'all_bible_verses';
        
        // Check if data exists in cache
        if (Cache::has($cacheKey)) {
            Log::info('All Bible verses found in cache');
            $result = Cache::get($cacheKey);
        } else {
            Log::info('All Bible verses not found in cache, fetching from database');
            
            try {
                Log::debug('Executing database query to retrieve all Bible verses');
                
                $verses = BibleVerse::orderBy('book')
                    ->orderBy('chapter')
                    ->orderBy('verse')
                    ->get(['book', 'chapter', 'verse', 'text']);
                
                if ($verses->isEmpty()) {
                    Log::info('No Bible verses found in the database');
                    
                    $result = [
                        'success' => false,
                        'message' => 'No verses found',
                        'data' => [],
                    ];
                } else {
                    Log::info('All Bible verses retrieved successfully', [
                        'count' => $verses->count()
                    ]);
                
                    $result = [
                    'success' => true,
                    'message' => 'All verses retrieved successfully',
                    'data' => $verses,
                ];
                }
                
                // Store in cache for 7 days
                Cache::put($cacheKey, $result, 60 * 24 * 7);
                Log::info('All Bible verses stored in cache');
                
            } catch (\Exception $e) {
                Log::error('Error retrieving all Bible verses: ' . $e->getMessage(), [
                    'exception' => $e
                ]);
                
                $result = [
                    'success' => false,
                    'message' => 'Error retrieving verses',
                    'data' => [],
                ];
            }
        }
        
        return response()->json($result);
    }

    /**
     * Search Bible verses by text
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function searchVerses(Request $request)
    {
        $searchTerm = $request->input('q');

        if (empty($searchTerm)) {
            Log::warning('Search attempted with empty search term');
            return response()->json([
                'success' => false,
                'message' => 'Search term is required',
                'data' => [],
            ]);
        }
        
        Log::info('Searching Bible verses', [
            'searchTerm' => $searchTerm
        ]);
        
        // Create a cache key based on the search term
        $cacheKey = 'bible_search_' . md5($searchTerm);
        
        // Check if data exists in cache
        if (Cache::has($cacheKey)) {
            Log::info('Search results found in cache', [
                'searchTerm' => $searchTerm
            ]);
            $result = Cache::get($cacheKey);
        } else {
            Log::info('Search results not found in cache, performing database search', [
                'searchTerm' => $searchTerm
            ]);
            
            try {
                Log::debug('Executing database query for search', [
                    'searchTerm' => $searchTerm
                ]);
                
                $verses = BibleVerse::where('text', 'like', '%' . $searchTerm . '%')
                    ->orderBy('book')
                    ->orderBy('chapter')
                    ->orderBy('verse')
                    ->limit(50)
                    ->get(['book', 'chapter', 'verse', 'text']);
                
                if ($verses->isEmpty()) {
                    Log::info('No verses found matching search term', [
                        'searchTerm' => $searchTerm
                    ]);
                    
                    $result = [
                        'success' => false,
                        'message' => 'No verses found matching search term',
                        'data' => [],
                    ];
                } else {
                    Log::info('Search completed successfully', [
                        'searchTerm' => $searchTerm,
                        'count' => $verses->count()
                    ]);
                    
                    $result = [
                        'success' => true,
                        'message' => 'Search completed successfully',
                        'data' => $verses,
                    ];
                }
                
                // Store in cache for 24 hours
                Cache::put($cacheKey, $result, 60 * 24);
                Log::info('Search results stored in cache', [
                    'searchTerm' => $searchTerm
                ]);
                
            } catch (\Exception $e) {
                Log::error('Error searching Bible verses: ' . $e->getMessage(), [
                    'searchTerm' => $searchTerm,
                    'exception' => $e
                ]);
                
                $result = [
                    'success' => false,
                    'message' => 'Error searching verses',
                    'data' => [],
                ];
            }
        }
        
        return response()->json($result);
    }

    /**
     * Debug method to check cache status
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function debugCache()
    {
        $cacheKeys = [
            'all_bible_verses',
            'bible_verses_1_1',
            'bible_verses_43_3_16',
            'bible_search_' . md5('爱')
        ];
        
        $results = [];
        
        foreach ($cacheKeys as $key) {
            $results[$key] = [
                'exists' => Cache::has($key),
                'driver' => config('cache.default'),
                'prefix' => config('cache.prefix'),
                'full_key' => config('cache.prefix') . $key
            ];
            
            if (Cache::has($key)) {
                $value = Cache::get($key);
                $results[$key]['type'] = gettype($value);
                $results[$key]['is_array'] = is_array($value);
                $results[$key]['count'] = is_array($value) && isset($value['data']) && is_array($value['data']) 
                    ? count($value['data']) 
                    : 'N/A';
            }
        }
        
        // Add cache driver details
        $results['cache_config'] = [
            'driver' => config('cache.default'),
            'prefix' => config('cache.prefix'),
            'path' => config('cache.stores.file.path'),
            'available_drivers' => array_keys(config('cache.stores')),
        ];
        
        return response()->json([
            'success' => true,
            'message' => 'Cache debug information',
            'data' => $results,
        ]);
    }

    /**
     * Clear and populate the cache
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function refreshCache()
    {
        $results = [
            'cleared' => [],
            'populated' => []
        ];
        
        // Clear specific cache keys
        $cacheKeys = [
            'all_bible_verses',
            'bible_verses_1_1',
            'bible_verses_43_3_16',
            'bible_search_' . md5('爱')
        ];
        
        foreach ($cacheKeys as $key) {
            $exists = Cache::has($key);
            $cleared = Cache::forget($key);
            $results['cleared'][$key] = [
                'existed' => $exists,
                'cleared' => $cleared
            ];
        }
        
        // Populate common caches
        
        // 1. All verses
        try {
            $verses = BibleVerse::orderBy('book')
                ->orderBy('chapter')
                ->orderBy('verse')
                ->get(['book', 'chapter', 'verse', 'text']);
            
            $allVersesResult = [
                'success' => true,
                'message' => 'All verses retrieved successfully',
                'data' => $verses,
            ];
            
            Cache::put('all_bible_verses', $allVersesResult, 60 * 24 * 7);
            $results['populated']['all_bible_verses'] = [
                'success' => true,
                'count' => $verses->count()
            ];
        } catch (\Exception $e) {
            $results['populated']['all_bible_verses'] = [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
        
        // 2. Genesis 1:1
        try {
            $verses = BibleVerse::getVersesByReference(1, 1, 1);
            
            $bookNames = BibleVerse::getBookNames();
            $bookName = $bookNames[1] ?? "Book 1";
            
            $formattedVerses = $verses->map(function ($verse) {
                return [
                    'book' => $verse->book,
                    'chapter' => $verse->chapter,
                    'verse' => $verse->verse,
                    'text' => $verse->text,
                ];
            });
            
            $genesisResult = [
                'success' => true,
                'message' => 'Verses retrieved successfully',
                'data' => [
                    'book_name' => $bookName,
                    'book' => 1,
                    'chapter' => 1,
                    'verses' => $formattedVerses,
                ],
            ];
            
            Cache::put('bible_verses_1_1_1', $genesisResult, 60 * 24);
            $results['populated']['bible_verses_1_1_1'] = [
                'success' => true,
                'count' => $verses->count()
            ];
        } catch (\Exception $e) {
            $results['populated']['bible_verses_1_1_1'] = [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
        
        // 3. John 3:16
        try {
            $verses = BibleVerse::getVersesByReference(43, 3, 16);
            
            $bookNames = BibleVerse::getBookNames();
            $bookName = $bookNames[43] ?? "Book 43";
            
            $formattedVerses = $verses->map(function ($verse) {
                return [
                    'book' => $verse->book,
                    'chapter' => $verse->chapter,
                    'verse' => $verse->verse,
                    'text' => $verse->text,
                ];
            });
            
            $johnResult = [
                'success' => true,
                'message' => 'Verses retrieved successfully',
                'data' => [
                    'book_name' => $bookName,
                    'book' => 43,
                    'chapter' => 3,
                    'verses' => $formattedVerses,
                ],
            ];
            
            Cache::put('bible_verses_43_3_16', $johnResult, 60 * 24);
            $results['populated']['bible_verses_43_3_16'] = [
                'success' => true,
                'count' => $verses->count()
            ];
        } catch (\Exception $e) {
            $results['populated']['bible_verses_43_3_16'] = [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
        
        // 4. Search for "爱" (love)
        try {
            $searchTerm = '爱';
            $verses = BibleVerse::where('text', 'like', '%' . $searchTerm . '%')
                ->orderBy('book')
                ->orderBy('chapter')
                ->orderBy('verse')
                ->limit(50)
                ->get(['book', 'chapter', 'verse', 'text']);
            
            $searchResult = [
                'success' => true,
                'message' => 'Search completed successfully',
                'data' => $verses,
            ];
            
            $searchCacheKey = 'bible_search_' . md5($searchTerm);
            Cache::put($searchCacheKey, $searchResult, 60 * 24);
            $results['populated'][$searchCacheKey] = [
                'success' => true,
                'count' => $verses->count()
            ];
        } catch (\Exception $e) {
            $results['populated']['bible_search_' . md5('爱')] = [
                    'success' => false,
                'error' => $e->getMessage()
            ];
            }
            
            return response()->json([
                'success' => true,
            'message' => 'Cache refreshed',
            'data' => $results,
        ]);
    }

    /**
     * Test if the cache is working properly
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function testCache()
    {
        $testKey = 'bible_cache_test_' . time();
        $testValue = [
            'test' => true,
            'timestamp' => time(),
            'random' => rand(1000, 9999)
        ];
        
        $results = [
            'test_key' => $testKey,
            'test_value' => $testValue,
            'steps' => []
        ];
        
        // Step 1: Try to store the value in the cache
        try {
            Cache::put($testKey, $testValue, 60); // Store for 60 minutes
            $results['steps']['put'] = [
                'success' => true,
                'message' => 'Value stored in cache'
            ];
        } catch (\Exception $e) {
            $results['steps']['put'] = [
                'success' => false,
                'message' => 'Failed to store value in cache',
                'error' => $e->getMessage()
            ];
        }
        
        // Step 2: Check if the value exists in the cache
        try {
            $exists = Cache::has($testKey);
            $results['steps']['has'] = [
                'success' => true,
                'exists' => $exists,
                'message' => $exists ? 'Value exists in cache' : 'Value does not exist in cache'
            ];
        } catch (\Exception $e) {
            $results['steps']['has'] = [
                'success' => false,
                'message' => 'Failed to check if value exists in cache',
                'error' => $e->getMessage()
            ];
        }
        
        // Step 3: Try to retrieve the value from the cache
        try {
            $retrievedValue = Cache::get($testKey);
            $matches = $retrievedValue === $testValue;
            
            $results['steps']['get'] = [
                'success' => true,
                'retrieved_value' => $retrievedValue,
                'matches' => $matches,
                'message' => $matches ? 'Retrieved value matches stored value' : 'Retrieved value does not match stored value'
            ];
        } catch (\Exception $e) {
            $results['steps']['get'] = [
                'success' => false,
                'message' => 'Failed to retrieve value from cache',
                'error' => $e->getMessage()
            ];
        }
        
        // Step 4: Try to remove the value from the cache
        try {
            $forgotten = Cache::forget($testKey);
            $results['steps']['forget'] = [
                'success' => true,
                'forgotten' => $forgotten,
                'message' => $forgotten ? 'Value removed from cache' : 'Failed to remove value from cache'
            ];
        } catch (\Exception $e) {
            $results['steps']['forget'] = [
                'success' => false,
                'message' => 'Failed to remove value from cache',
                'error' => $e->getMessage()
            ];
        }
        
        // Step 5: Check if the cache driver is working properly
        $allStepsSuccessful = true;
        foreach ($results['steps'] as $step) {
            if (!$step['success']) {
                $allStepsSuccessful = false;
                break;
            }
        }
        
        $results['cache_working'] = $allStepsSuccessful && 
                                   $results['steps']['has']['exists'] && 
                                   $results['steps']['get']['matches'] && 
                                   $results['steps']['forget']['forgotten'];
        
        return response()->json([
            'success' => true,
            'message' => $results['cache_working'] ? 'Cache is working properly' : 'Cache is not working properly',
            'data' => $results,
        ]);
    }

    /**
     * Get Bible verses for a multi-chapter reference
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMultiChapterVerses(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'reference' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            Log::info('Multi-chapter Bible verse validation failed', [
                'errors' => $validator->errors()->toArray(),
                'input' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Invalid parameters',
                'errors' => $validator->errors(),
            ], 400);
        }

        $reference = $request->input('reference');
        
        // Cache key for this request
        $cacheKey = "bible_multi_chapter_" . md5($reference);
        
        // Log the request
        Log::info('Multi-chapter Bible verse request', [
            'reference' => $reference,
            'cache_key' => $cacheKey
        ]);

        // Check if data exists in cache
        if (Cache::has($cacheKey)) {
            Log::info('Multi-chapter Bible verses found in cache', ['cache_key' => $cacheKey]);
            $result = Cache::get($cacheKey);
        } else {
            Log::info('Multi-chapter Bible verses not found in cache, parsing and fetching', ['cache_key' => $cacheKey]);
            
            try {
                // Parse the reference
                $parsedRef = $this->parseReferenceString($reference);
                
                if (!$parsedRef || !isset($parsedRef['is_multi_chapter']) || !$parsedRef['is_multi_chapter']) {
                    Log::warning('Reference is not a multi-chapter reference', ['reference' => $reference]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Not a multi-chapter reference',
                        'data' => [],
                    ]);
                }
                
                $chapterReferences = $parsedRef['chapter_references'] ?? [];
                
                if (empty($chapterReferences)) {
                    Log::warning('No chapter references found in multi-chapter reference', ['reference' => $reference]);
                    return response()->json([
                        'success' => false,
                        'message' => 'No chapter references found',
                        'data' => [],
                    ]);
                }
                
                // Fetch verses for each chapter reference
                $allChapters = [];
                
                foreach ($chapterReferences as $chapterRef) {
                    $book = $chapterRef['book'];
                    $chapter = $chapterRef['chapter'];
                    $verseRanges = $chapterRef['verse_ranges'] ?? [];
                    
                    // Fetch verses for this chapter
                    $verses = BibleVerse::getVersesByReference(
                        $book, 
                        $chapter, 
                        $chapterRef['verse'] ?? null, 
                        $chapterRef['end_verse'] ?? null, 
                        $verseRanges
                    );
                    
                    if (!$verses->isEmpty()) {
                        $bookNames = BibleVerse::getBookNames();
                        $bookName = $bookNames[$book] ?? "Book {$book}";
                        
                        $formattedVerses = $verses->map(function ($verse) {
                            return [
                                'book' => $verse->book,
                                'chapter' => $verse->chapter,
                                'verse' => $verse->verse,
                                'text' => $verse->text,
                            ];
                        });
                        
                        $allChapters[] = [
                            'book_name' => $bookName,
                            'book' => $book,
                            'chapter' => $chapter,
                            'verses' => $formattedVerses,
                        ];
                    }
                }
                
                if (empty($allChapters)) {
                    Log::info('No verses found for multi-chapter reference', ['reference' => $reference]);
                    
                    $result = [
                        'success' => false,
                        'message' => 'No verses found for the given reference',
                        'data' => [],
                    ];
                } else {
                    Log::info('Multi-chapter Bible verses retrieved successfully', [
                        'reference' => $reference,
                        'chapter_count' => count($allChapters)
                    ]);
                    
                    $result = [
                        'success' => true,
                        'message' => 'Verses retrieved successfully',
                        'data' => [
                            'reference' => $reference,
                            'is_multi_chapter' => true,
                            'chapters' => $allChapters,
                        ],
                    ];
                }
                
                // Store in cache for 24 hours
                Cache::put($cacheKey, $result, 60 * 24);
                Log::info('Multi-chapter Bible verses stored in cache', ['cache_key' => $cacheKey]);
                
            } catch (\Exception $e) {
                Log::error('Error retrieving multi-chapter Bible verses: ' . $e->getMessage(), [
                    'reference' => $reference,
                    'exception' => $e
                ]);
                
                $result = [
                    'success' => false,
                    'message' => 'Error retrieving verses',
                    'data' => [],
                ];
            }
        }

        return response()->json($result);
    }

    /**
     * Convert Chinese numerals to Arabic if present
     *
     * @param string $text
     * @return string
     */
    private function convertChineseNumerals($text)
    {
        // Define Chinese numerals and their Arabic equivalents
        $chineseNumerals = [
            '一' => '1', '二' => '2', '三' => '3', '四' => '4', '五' => '5',
            '六' => '6', '七' => '7', '八' => '8', '九' => '9', '十' => '10',
            '十一' => '11', '十二' => '12', '十三' => '13', '十四' => '14',
            '十五' => '15', '十六' => '16', '十七' => '17', '十八' => '18',
            '十九' => '19', '二十' => '20', '二十一' => '21', '二十二' => '22',
            '二十三' => '23', '二十四' => '24', '二十五' => '25', '二十六' => '26',
            '二十七' => '27', '二十八' => '28', '二十九' => '29', '三十' => '30',
            '三十一' => '31', '三十二' => '32', '三十三' => '33', '三十四' => '34',
            '三十五' => '35', '三十六' => '36', '三十七' => '37', '三十八' => '38',
            '三十九' => '39', '四十' => '40', '四十一' => '41', '四十二' => '42',
            '四十三' => '43', '四十四' => '44', '四十五' => '45', '四十六' => '46',
            '四十七' => '47', '四十八' => '48', '四十九' => '49', '五十' => '50',
            '五十一' => '51', '五十二' => '52', '五十三' => '53', '五十四' => '54',
            '五十五' => '55', '五十六' => '56', '五十七' => '57', '五十八' => '58',
            '五十九' => '59', '六十' => '60', '六十一' => '61', '六十二' => '62',
            '六十三' => '63', '六十四' => '64', '六十五' => '65', '六十六' => '66',
            '六十七' => '67', '六十八' => '68', '六十九' => '69', '七十' => '70',
            '七十一' => '71', '七十二' => '72', '七十三' => '73', '七十四' => '74',
            '七十五' => '75', '七十六' => '76', '七十七' => '77', '七十八' => '78',
            '七十九' => '79', '八十' => '80', '八十一' => '81', '八十二' => '82',
            '八十三' => '83', '八十四' => '84', '八十五' => '85', '八十六' => '86',
            '八十七' => '87', '八十八' => '88', '八十九' => '89', '九十' => '90',
            '九十一' => '91', '九十二' => '92', '九十三' => '93', '九十四' => '94',
            '九十五' => '95', '九十六' => '96', '九十七' => '97', '九十八' => '98',
            '九十九' => '99', '一百' => '100',
            // Add traditional Chinese numerals support
            '壹' => '1', '貳' => '2', '叁' => '3', '肆' => '4', '伍' => '5',
            '陸' => '6', '柒' => '7', '捌' => '8', '玖' => '9', '拾' => '10',
            '拾壹' => '11', '拾貳' => '12', '拾叁' => '13', '拾肆' => '14',
            '拾伍' => '15', '拾陸' => '16', '拾柒' => '17', '拾捌' => '18',
            '拾玖' => '19', '貳拾' => '20', '貳拾壹' => '21', '貳拾貳' => '22'
        ];

        // Replace Chinese numerals with their Arabic equivalents
        foreach ($chineseNumerals as $chinese => $arabic) {
            $text = str_replace($chinese, $arabic, $text);
        }

        return $text;
    }

    /**
     * Test specific Bible verse references (for debugging)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function testReferences(Request $request)
    {
        $references = $request->input('references', [
            '约一5:13',
            '约 一 5:13',
            '约翰一书 5:13',
            '约一 5：13；',
            '约 3:16',
            '约 3:16-18',
            '约翰福音 3',
            '约 3:16, 18',
            '约 3:16, 18-20',
            '林前2：6-7，13',
            '约 3:16-18, 20, 22-24',
            '约 3:16; 5:1-5; 6:13',
            '创2:17；2:15-3:24',
            '出34:7',
            '出 34:7',
            '出埃及记 34:7',
            '箴1：1',
            '箴 1:1',
            '箴言 1:1',
            '约三1：15',
            '约三 1:15',
            '约翰三书 1:15',
            // Add test cases for traditional Chinese numerals
            '约壹5:13',
            '约壹 5:13',
            '約壹 5:13',
            '约翰壹书 5:13',
            '約壹 5：13；',
            '约贰1:1',
            '约贰 1:1',
            '約貳 1:1',
            '约翰贰书 1:1',
            '约叁1:15',
            '约叁 1:15',
            '約叁 1:15',
            '约翰叁书 1:15'
        ]);
        
        $results = [];
        
        foreach ($references as $reference) {
            try {
                $parsed = $this->parseReferenceString($reference);
                
                $results[$reference] = [
                    'success' => $parsed !== null,
                    'parsed' => $parsed,
                    'encoding_analysis' => [
                        'original_hex' => bin2hex($reference),
                        'contains_chinese' => preg_match('/[\x{4e00}-\x{9fa5}]/u', $reference) ? 'yes' : 'no',
                        'detected_encoding' => mb_detect_encoding($reference, ['UTF-8', 'ASCII', 'GBK', 'GB18030', 'BIG5'], true),
                        'cleaned_hex' => bin2hex($this->cleanupEncoding($reference))
                    ]
                ];
            } catch (\Exception $e) {
                $results[$reference] = [
                    'success' => false,
                    'error' => $e->getMessage(),
                    'encoding_analysis' => [
                        'original_hex' => bin2hex($reference),
                        'contains_chinese' => preg_match('/[\x{4e00}-\x{9fa5}]/u', $reference) ? 'yes' : 'no',
                        'detected_encoding' => mb_detect_encoding($reference, ['UTF-8', 'ASCII', 'GBK', 'GB18030', 'BIG5'], true)
                    ]
                ];
            }
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Test results',
            'data' => $results,
        ]);
    }

    /**
     * Debug the parsing of a specific Bible verse reference with detailed analysis
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function debugParse(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'reference' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid parameters',
                'errors' => $validator->errors(),
            ], 400);
        }

        $reference = $request->input('reference');
        
        Log::info('Debug parsing Bible reference', ['reference' => $reference]);
        
        // Analyze the reference
        $analysis = [
            'original' => [
                'reference' => $reference,
                'hex' => bin2hex($reference),
                'length' => mb_strlen($reference, 'UTF-8'),
                'contains_chinese' => preg_match('/[\x{4e00}-\x{9fa5}]/u', $reference) ? true : false,
                'detected_encoding' => mb_detect_encoding($reference, ['UTF-8', 'ASCII', 'GBK', 'GB18030', 'BIG5'], true),
            ]
        ];
        
        // Clean up the reference
        $cleanedReference = $this->cleanupEncoding($reference);
        $analysis['cleaned'] = [
            'reference' => $cleanedReference,
            'hex' => bin2hex($cleanedReference),
            'length' => mb_strlen($cleanedReference, 'UTF-8'),
            'contains_chinese' => preg_match('/[\x{4e00}-\x{9fa5}]/u', $cleanedReference) ? true : false
        ];
        
        // Handle Chinese punctuation
        $standardizedReference = str_replace(['：', '，', '；', '（', '）'], [':', ',', ';', '(', ')'], $cleanedReference);
        $analysis['standardized'] = [
            'reference' => $standardizedReference,
            'hex' => bin2hex($standardizedReference),
            'length' => mb_strlen($standardizedReference, 'UTF-8'),
            'changed' => $standardizedReference !== $cleanedReference
        ];
        
        // Book identification analysis
        $bookAbbreviations = BibleVerse::getBookAbbreviations();
        $abbrevKeys = array_keys($bookAbbreviations);
        
        // Sort by length
        usort($abbrevKeys, function ($a, $b) {
            return mb_strlen($b, 'UTF-8') - mb_strlen($a, 'UTF-8');
        });
        
        // Find any matching abbreviations
        $possibleMatches = [];
        $exactMatch = null;
        
        foreach ($abbrevKeys as $abbr) {
            $bookId = $bookAbbreviations[$abbr];
            $abbrPattern = preg_quote($abbr, '/');
            $abbrPattern = str_replace(' ', '\s*', $abbrPattern);
            
            if (preg_match('/^' . $abbrPattern . '\s*/u', $standardizedReference, $matches)) {
                $matchDetails = [
                    'abbr' => $abbr,
                    'book_id' => $bookId,
                    'book_name' => BibleVerse::getBookNames()[$bookId] ?? "Book {$bookId}",
                    'matched_text' => $matches[0],
                    'pattern' => '/^' . $abbrPattern . '\s*/u',
                    'remaining' => mb_substr($standardizedReference, mb_strlen($matches[0], 'UTF-8'), null, 'UTF-8')
                ];
                $possibleMatches[] = $matchDetails;
                
                if ($exactMatch === null) {
                    $exactMatch = $matchDetails;
                }
            }
        }
        
        $analysis['book_matching'] = [
            'possible_matches' => $possibleMatches,
            'exact_match' => $exactMatch,
            'total_matches' => count($possibleMatches)
        ];
        
        // Attempt to parse it
        try {
            $parsed = $this->parseReferenceString($reference);
            $analysis['parse_result'] = [
                'success' => $parsed !== null,
                'parsed' => $parsed
            ];
        } catch (\Exception $e) {
            $analysis['parse_result'] = [
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ];
        }
        
        // Check for common issues
        $issues = [];
        
        if (!$analysis['original']['contains_chinese'] && $analysis['original']['detected_encoding'] !== 'UTF-8') {
            $issues[] = 'The reference is not detected as UTF-8, which can cause problems with Chinese characters.';
        }
        
        if (empty($possibleMatches)) {
            $issues[] = 'No matching book abbreviation found. This reference may use an unknown book name format.';
        }
        
        if ($exactMatch && empty($exactMatch['remaining'])) {
            $issues[] = 'No chapter/verse information after the book name.';
        }
        
        if ($exactMatch && !preg_match('/\d/', $exactMatch['remaining'])) {
            $issues[] = 'No digits found in the chapter/verse section.';
        }
        
        $analysis['issues'] = $issues;
        
        return response()->json([
            'success' => true,
            'message' => 'Reference analysis completed',
            'analysis' => $analysis,
        ]);
    }
} 