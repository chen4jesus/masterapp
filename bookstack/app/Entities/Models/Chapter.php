<?php

namespace BookStack\Entities\Models;

use BookStack\Entities\Queries\EntityQueries;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Collection;

/**
 * Class Chapter.
 *
 * @property Collection<Page> $pages
 * @property ?int             $default_template_id
 * @property ?Page            $defaultTemplate
 */
class Chapter extends BookChild
{
//     use SoftDeletes;
    use HasFactory;
    use HasHtmlDescription;

    public float $searchFactor = 1.2;
    public string $parent_type = '';


    protected $fillable = ['name', 'description', 'priority'];
    protected $hidden = ['pivot', 'deleted_at', 'description_html'];

    /**
     * Get the pages that this chapter contains.
     *
     * @return HasMany<Page>
     */
    public function pages(string $dir = 'ASC'): HasMany
    {
        return $this->hasMany(Page::class)->orderBy('priority', $dir);
    }

    /**
     * Get the url of this chapter.
     */
    public function getUrl(string $path = ''): string
    {
        // Extract the parent type and the remaining path
        if ($this->parent_type && preg_match('/^(book_clubs|bookshelves|books|chapters|pages)\|(.+)$/', $this->parent_type, $matches)) {
            $parentType = $matches[1]; // bookclub, bookshelf, or book
            $remainingPath = $matches[2]; // book-clubs/12/books/23

            $segments = explode('/', $remainingPath);
            $result = [];

            for ($i = 0; $i < count($segments); $i += 2) {
                if (isset($segments[$i + 1]) && is_numeric($segments[$i + 1])) {
                    $result[$segments[$i]] = (int) $segments[$i + 1];
                }
            }
            $entityQueries = app(EntityQueries::class);

            $url = "";
            foreach ($result as $model_type => $model_id) {
                $model_slug = $entityQueries->idToSlug($model_type, $model_id);
                $url .= '/' . $model_type . '/' . $model_slug;
            }
            return url($url);
        }
        $parts = [
            'books',
            urlencode($this->book_slug ?? $this->book->slug),
            'chapter',
            urlencode($this->slug),
            trim($path, '/'),
        ];

        return url('/' . implode('/', $parts));
    }

    /**
     * Get the Page that is used as default template for newly created pages within this Chapter.
     */
    public function defaultTemplate(): BelongsTo
    {
        return $this->belongsTo(Page::class, 'default_template_id');
    }

    /**
     * Get the visible pages in this chapter.
     * @returns Collection<Page>
     */
    public function getVisiblePages(): Collection
    {
        return $this->pages()
        ->scopes('visible')
        ->orderBy('draft', 'desc')
        ->orderBy('priority', 'asc')
        ->get();
    }
}
