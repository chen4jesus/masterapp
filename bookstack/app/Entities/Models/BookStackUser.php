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
class BookStackUser extends Entity
{
    use HasFactory;
    use HasHtmlDescription;

    protected $table = 'users';

    public float $searchFactor = 1.2;

    protected $fillable = ['email', 'name', 'slug'];
    protected $hidden = ['image_id', 'deleted_at'];

    /**
     * Get the url for this book.
     */
    public function getUrl(string $path = ''): string
    {
        return url('/users/' . implode('/', [urlencode($this->slug), trim($path, '/')]));
    }

    public function bookClubs(): BelongsToMany
    {
        return $this->belongsToMany(BookClub::class, 'book_clubs_users', 'user_id', 'book_clubs_id')
            ->withPivot('order')
            ->orderBy('order', 'asc');
    }

    /**
     * Get the books associated with the user (e.g., books they own or manage).
     */
    public function books(): HasMany
    {
        return $this->hasMany(Book::class, 'created_by'); // Assuming 'created_by' is the user ID in the books table
    }

    /**
     * Get the user's visible books.
     */
    public function getVisibleBooks(): Collection
    {
        return $this->books()->scopes('visible')->get();
    }

    public function getAvatar(int $size = 50): string
    {
        $default = url('/user_avatar.png');
        $imageId = $this->image_id;
        if ($imageId === 0 || $imageId === '0' || $imageId === null) {
            return $default;
        }

        if (!empty($this->avatarUrl)) {
            return $this->avatarUrl;
        }

        try {
            $avatar = $this->avatar?->getThumb($size, $size, false) ?? $default;
        } catch (Exception $err) {
            $avatar = $default;
        }

        $this->avatarUrl = $avatar;

        return $avatar;
    }
    /**
     * Get the sort set assigned to this book, if existing.
     */
    public function sortRule(): BelongsTo
    {
        return $this->belongsTo(SortRule::class);
    }

}
