<?php

namespace BookStack\Entities\Models;

use Illuminate\Database\Eloquent\Model;

class BibleVerse extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'bible_verses_chinese_union_simp';

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'book',
        'chapter',
        'verse',
        'text',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'book' => 'integer',
        'chapter' => 'integer',
        'verse' => 'integer',
    ];

    /**
     * Get verses by reference
     *
     * @param int $book
     * @param int $chapter
     * @param int|null $verse
     * @param int|null $endVerse
     * @param array|null $verseRanges Array of verse ranges, each with 'start' and 'end' keys
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getVersesByReference($book, $chapter, $verse = null, $endVerse = null, $verseRanges = null)
    {
        $query = self::where('book', $book)
            ->where('chapter', $chapter);
        
        // If verse ranges are provided, use them
        if ($verseRanges && is_array($verseRanges) && !empty($verseRanges)) {
            $query->where(function($q) use ($verseRanges) {
                foreach ($verseRanges as $index => $range) {
                    $method = $index === 0 ? 'where' : 'orWhere';
                    
                    if ($range['start'] === $range['end']) {
                        // Single verse
                        $q->$method('verse', $range['start']);
                    } else {
                        // Verse range
                        $q->$method(function($subQuery) use ($range) {
                            $subQuery->whereBetween('verse', [$range['start'], $range['end']]);
                        });
                    }
                }
            });
        } 
        // Otherwise use the traditional verse and endVerse parameters
        else if ($verse !== null) {
            if ($endVerse !== null) {
                $query->whereBetween('verse', [$verse, $endVerse]);
            } else {
                $query->where('verse', $verse);
            }
        }
        
        return $query->orderBy('verse')->get();
    }

    /**
     * Get book names mapping
     *
     * @return array
     */
    public static function getBookNames()
    {
        return [
            1 => '创世记',
            2 => '出埃及记',
            3 => '利未记',
            4 => '民数记',
            5 => '申命记',
            6 => '约书亚记',
            7 => '士师记',
            8 => '路得记',
            9 => '撒母耳记上',
            10 => '撒母耳记下',
            11 => '列王纪上',
            12 => '列王纪下',
            13 => '历代志上',
            14 => '历代志下',
            15 => '以斯拉记',
            16 => '尼希米记',
            17 => '以斯帖记',
            18 => '约伯记',
            19 => '诗篇',
            20 => '箴言',
            21 => '传道书',
            22 => '雅歌',
            23 => '以赛亚书',
            24 => '耶利米书',
            25 => '耶利米哀歌',
            26 => '以西结书',
            27 => '但以理书',
            28 => '何西阿书',
            29 => '约珥书',
            30 => '阿摩司书',
            31 => '俄巴底亚书',
            32 => '约拿书',
            33 => '弥迦书',
            34 => '那鸿书',
            35 => '哈巴谷书',
            36 => '西番雅书',
            37 => '哈该书',
            38 => '撒迦利亚书',
            39 => '玛拉基书',
            40 => '马太福音',
            41 => '马可福音',
            42 => '路加福音',
            43 => '约翰福音',
            44 => '使徒行传',
            45 => '罗马书',
            46 => '哥林多前书',
            47 => '哥林多后书',
            48 => '加拉太书',
            49 => '以弗所书',
            50 => '腓立比书',
            51 => '歌罗西书',
            52 => '帖撒罗尼迦前书',
            53 => '帖撒罗尼迦后书',
            54 => '提摩太前书',
            55 => '提摩太后书',
            56 => '提多书',
            57 => '腓利门书',
            58 => '希伯来书',
            59 => '雅各书',
            60 => '彼得前书',
            61 => '彼得后书',
            62 => '约翰一书',
            63 => '约翰二书',
            64 => '约翰三书',
            65 => '犹大书',
            66 => '启示录',
        ];
    }

    /**
     * Get book abbreviations mapping
     *
     * @return array
     */
    public static function getBookAbbreviations()
    {
        return [
            '创' => 1, '创世记' => 1, 'Gen' => 1, 'Genesis' => 1,
            '出' => 2, '出埃及记' => 2, 'Exo' => 2, 'Exodus' => 2,
            '利' => 3, '利未记' => 3, 'Lev' => 3, 'Leviticus' => 3,
            '民' => 4, '民数记' => 4, 'Num' => 4, 'Numbers' => 4,
            '申' => 5, '申命记' => 5, 'Deu' => 5, 'Deuteronomy' => 5,
            '书' => 6, '约书亚记' => 6, 'Jos' => 6, 'Joshua' => 6,
            '士' => 7, '士师记' => 7, 'Jdg' => 7, 'Judges' => 7,
            '得' => 8, '路得记' => 8, 'Rut' => 8, 'Ruth' => 8,
            '撒上' => 9, '撒母耳记上' => 9, '1 Sam' => 9, '1 Samuel' => 9,
            '撒下' => 10, '撒母耳记下' => 10, '2 Sam' => 10, '2 Samuel' => 10,
            '王上' => 11, '列王纪上' => 11, '1 Kgs' => 11, '1 Kings' => 11,
            '王下' => 12, '列王纪下' => 12, '2 Kgs' => 12, '2 Kings' => 12,
            '代上' => 13, '历代志上' => 13, '1 Chr' => 13, '1 Chronicles' => 13,
            '代下' => 14, '历代志下' => 14, '2 Chr' => 14, '2 Chronicles' => 14,
            '拉' => 15, '以斯拉记' => 15, 'Ezr' => 15, 'Ezra' => 15,
            '尼' => 16, '尼希米记' => 16, 'Neh' => 16, 'Nehemiah' => 16,
            '斯' => 17, '以斯帖记' => 17, 'Est' => 17, 'Esther' => 17,
            '伯' => 18, '约伯记' => 18, 'Job' => 18, 'Job' => 18,
            '诗' => 19, '诗篇' => 19, 'Psa' => 19, 'Psalms' => 19,
            '箴' => 20, '箴言' => 20, 'Pro' => 20, 'Proverbs' => 20,
            '传' => 21, '传道书' => 21, 'Ecc' => 21, 'Ecclesiastes' => 21,
            '歌' => 22, '雅歌' => 22, 'Song' => 22, 'Song of Solomon' => 22,
            '赛' => 23, '以赛亚书' => 23, 'Isa' => 23, 'Isaiah' => 23,
            '耶' => 24, '耶利米书' => 24, 'Jer' => 24, 'Jeremiah' => 24,
            '哀' => 25, '耶利米哀歌' => 25, 'Lam' => 25, 'Lamentations' => 25,
            '结' => 26, '以西结书' => 26, 'Eze' => 26, 'Ezekiel' => 26,
            '但' => 27, '但以理书' => 27, 'Dan' => 27, 'Daniel' => 27,
            '何' => 28, '何西阿书' => 28, 'Hos' => 28, 'Hosea' => 28,
            '珥' => 29, '约珥书' => 29, 'Joe' => 29, 'Joel' => 29,
            '摩' => 30, '阿摩司书' => 30, 'Amo' => 30, 'Amos' => 30,
            '俄' => 31, '俄巴底亚书' => 31, 'Oba' => 31, 'Obadiah' => 31,
            '拿' => 32, '约拿书' => 32, 'Jon' => 32, 'Jonah' => 32,
            '弥' => 33, '弥迦书' => 33, 'Mic' => 33, 'Micah' => 33,
            '鸿' => 34, '那鸿书' => 34, 'Nah' => 34, 'Nahum' => 34,
            '哈' => 35, '哈巴谷书' => 35, 'Hab' => 35, 'Habakkuk' => 35,
            '番' => 36, '西番雅书' => 36, 'Zep' => 36, 'Zephaniah' => 36,
            '该' => 37, '哈该书' => 37, 'Hag' => 37, 'Haggai' => 37,
            '亚' => 38, '撒迦利亚书' => 38, 'Zec' => 38, 'Zechariah' => 38,
            '玛' => 39, '玛拉基书' => 39, 'Mal' => 39, 'Malachi' => 39,
            '太' => 40, '马太福音' => 40, 'Mat' => 40, 'Matthew' => 40,
            '可' => 41, '马可福音' => 41, 'Mar' => 41, 'Mark' => 41,
            '路' => 42, '路加福音' => 42, 'Luk' => 42, 'Luke' => 42,
            '约' => 43, '约翰福音' => 43, 'Jhn' => 43, 'John' => 43,
            '徒' => 44, '使徒行传' => 44, 'Act' => 44, 'Acts' => 44,
            '罗' => 45, '罗马书' => 45, 'Rom' => 45, 'Romans' => 45,
            '林前' => 46, '哥林多前书' => 46, '1 Cor' => 46, '1 Corinthians' => 46,
            '林后' => 47, '哥林多后书' => 47, '2 Cor' => 47, '2 Corinthians' => 47,
            '加' => 48, '加拉太书' => 48, 'Gal' => 48, 'Galatians' => 48,
            '弗' => 49, '以弗所书' => 49, 'Eph' => 49, 'Ephesians' => 49,
            '腓' => 50, '腓立比书' => 50, 'Php' => 50, 'Philippians' => 50,
            '西' => 51, '歌罗西书' => 51, 'Col' => 51, 'Colossians' => 51,
            '帖前' => 52, '帖撒罗尼迦前书' => 52, '1 Thes' => 52, '1 Thessalonians' => 52,
            '帖后' => 53, '帖撒罗尼迦后书' => 53, '2 Thes' => 53, '2 Thessalonians' => 53,
            '提前' => 54, '提摩太前书' => 54, '1 Tim' => 54, '1 Timothy' => 54,
            '提后' => 55, '提摩太后书' => 55, '2 Tim' => 55, '2 Timothy' => 55,
            '多' => 56, '提多书' => 56, 'Tit' => 56, 'Titus' => 56,
            '门' => 57, '腓利门书' => 57, 'Phm' => 57, 'Philemon' => 57,
            '来' => 58, '希伯来书' => 58, 'Heb' => 58, 'Hebrews' => 58,
            '雅' => 59, '雅各书' => 59, 'Jas' => 59, 'James' => 59,
            '彼前' => 60, '彼得前书' => 60, '1 Pet' => 60, '1 Peter' => 60,
            '彼后' => 61, '彼得后书' => 61, '2 Pet' => 61, '2 Peter' => 61,
            '约一' => 62, '约翰一书' => 62, '1 Jhn' => 62, '1 John' => 62,
            '约二' => 63, '约翰二书' => 63, '2 Jhn' => 63, '2 John' => 63,
            '约三' => 64, '约翰三书' => 64, '3 Jhn' => 64, '3 John' => 64,
            '犹' => 65, '犹大书' => 65, 'Jud' => 65, 'Jude' => 65,
            '启' => 66, '启示录' => 66, 'Rev' => 66, 'Revelation' => 66,
            // Add traditional Chinese numeral abbreviations
            '约壹' => 62, '約壹' => 62, '约翰壹书' => 62, '約翰壹書' => 62,
            '约贰' => 63, '約貳' => 63, '约翰贰书' => 63, '約翰貳書' => 63,
            '约叁' => 64, '約叁' => 64, '约翰叁书' => 64, '約翰叁書' => 64,
        ];
    }
} 