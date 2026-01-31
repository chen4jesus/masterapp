<?php

namespace BookStack\Entities\Models;

use BookStack\App\Model;
use BookStack\Sorting\SortRule;
use BookStack\Uploads\Image;
use Exception;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

/**
 * Class Book.
 *
 * @property string                                   $description
 * @property int                                      $image_id
 * @property ?int                                     $default_template_id
 * @property ?int                                     $sort_rule_id
 * @property Image|null                               $cover
 * @property \Illuminate\Database\Eloquent\Collection $chapters
 * @property \Illuminate\Database\Eloquent\Collection $pages
 * @property \Illuminate\Database\Eloquent\Collection $directPages
 * @property \Illuminate\Database\Eloquent\Collection $shelves
 * @property ?Page                                    $defaultTemplate
 * @property ?SortRule                                 $sortRule
 */
class PageTrack extends Model
{

    protected $table = "histories";
    protected $fillable = ['user_id', 'bookclub_slug', 'book_slug', 'page_slug'];
    
}
