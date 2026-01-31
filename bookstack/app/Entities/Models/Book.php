<?php

namespace BookStack\Entities\Models;

use BookStack\Sorting\SortRule;
use BookStack\Uploads\Image;
use Exception;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use BookStack\Entities\Queries\EntityQueries;


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
class Book extends Entity implements HasCoverImage
{
    // use SoftDeletes;
    use HasFactory;
    use HasHtmlDescription;

    public float $searchFactor = 1.2;
    public string $parent_type = '';

    protected $fillable = ['name'];
    protected $hidden = ['pivot', 'image_id', 'deleted_at', 'description_html'];

    /**
     * Get the url for this book.
     */
    public function getUrl(string $path = ''): string
    {
        // Extract the parent type and the remaining path
        if ($this->parent_type && preg_match('/^(book_clubs|bookshelves|books|chapter|pages)\|(.+)$/', $this->parent_type, $matches)) {

            $parentType = $matches[1]; // bookclub, bookshelf, or book
            $remainingPath = $matches[2]; // book-clubs/12/books/23

            $segments = explode('/', $remainingPath);
            $result = [];

            for ($i = 0; $i < count($segments); $i += 2) {
                if (isset($segments[$i + 1]) && is_numeric($segments[$i + 1])) {
                    $result[$segments[$i]] = (int) $segments[$i + 1];
                }
            }
            $url = "";
            $entityQueries = app(EntityQueries::class);

            foreach ($result as $model_type => $model_id) {
                $model_slug = $entityQueries->idToSlug($model_type, $model_id);
                $url .= '/' . $model_type . '/' . $model_slug;
            }
            return url($url);
        }
        return url('/books/' . implode('/', [urlencode($this->slug), trim($path, '/')]));
    }

    /**
     * Returns book cover image, if book cover not exists return default cover image.
     */
    public function getBookCover(int $width = 440, int $height = 250): string
    {
        $default = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
        if (!$this->image_id || !$this->cover) {
            return $default;
        }

        try {
            return $this->cover->getThumb($width, $height, false) ?? $default;
        } catch (Exception $err) {
            return $default;
        }
    }

    /**
     * Get the cover image of the book.
     */
    public function cover(): BelongsTo
    {
        return $this->belongsTo(Image::class, 'image_id');
    }

    /**
     * Get the type of the image model that is used when storing a cover image.
     */
    public function coverImageTypeKey(): string
    {
        return 'cover_book';
    }

    /**
     * Get the Page that is used as default template for newly created pages within this Book.
     */
    public function defaultTemplate(): BelongsTo
    {
        return $this->belongsTo(Page::class, 'default_template_id');
    }

    /**
     * Get the sort set assigned to this book, if existing.
     */
    public function sortRule(): BelongsTo
    {
        return $this->belongsTo(SortRule::class);
    }

    /**
     * Get all pages within this book.
     */
    public function pages(): HasMany
    {
        return $this->hasMany(Page::class);
    }

    /**
     * Get the direct child pages of this book.
     */
    public function directPages(): HasMany
    {
        return $this->pages()->where('chapter_id', '=', '0');
    }

    /**
     * Get all chapters within this book.
     */
    public function chapters(): HasMany
    {
        return $this->hasMany(Chapter::class);
    }

    /**
     * Get the shelves this book is contained within.
     */
    public function shelves(): BelongsToMany
    {
        return $this->belongsToMany(Bookshelf::class, 'bookshelves_books', 'book_id', 'bookshelf_id');
    }
    public function bookClubs(): BelongsToMany
    {
        return $this->belongsToMany(BookClub::class, 'book_clubs_books', 'book_id', 'book_clubs_id')
            ->withPivot('order')
            ->orderBy('order', 'asc');
    }

    /**
     * Get the direct child items within this book.
     */
    public function getDirectVisibleChildren(): Collection
    {
        $pages = $this->directPages()->scopes('visible')->get();
        $chapters = $this->chapters()->scopes('visible')->get();

        return $pages->concat($chapters)->sortBy('priority')->sortByDesc('draft');
    }
}
