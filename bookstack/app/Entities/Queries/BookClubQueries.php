<?php

namespace BookStack\Entities\Queries;

use BookStack\Entities\Models\BookClub;
use BookStack\Exceptions\NotFoundException;
use Illuminate\Database\Eloquent\Builder;

class BookClubQueries implements ProvidesEntityQueries

{
    
    protected static array $listAttributes = [
        'id', 'slug', 'name', 'description',
        'created_at', 'updated_at', 'image_id', 'owned_by', 'club_type',
    ];

    public function start(): Builder
    {
        return BookClub::query();
    }

    public function findVisibleById(int $id): ?BookClub
    {
        return $this->start()->find($id);
    }

    public function findVisibleByIdOrFail(int $id): BookClub
    {
        $bookclub = $this->findVisibleById($id);

        if (is_null($bookclub)) {
            throw new NotFoundException(trans('errors.bookclub_not_found'));
        }

        return $bookclub;
    }

    public function findVisibleBySlugOrFail(string $slug): BookClub
    {
        /** @var ?BookClub $bookclub */
        $bookclub = $this->start()
            ->where('slug', '=', $slug)
            ->first();
        if ($bookclub === null) {
            throw new NotFoundException(trans('errors.bookclub_not_found'));
        }

        return $bookclub;
    }

    public function visibleForList(): Builder
    {

        return $this->start()->select(static::$listAttributes);
    }

    public function visibleForListWithCover(): Builder
    {
        return $this->visibleForList()->with('cover');
    }

    public function recentlyViewedForCurrentUser(): Builder
    {
        return $this->visibleForList()
            ->scopes('withLastView')
            ->having('last_viewed_at', '>', 0)
            ->orderBy('last_viewed_at', 'desc');
    }

    public function popularForList(): Builder
    {
        return $this->visibleForList()
            ->scopes('withViewCount')
            ->having('view_count', '>', 0)
            ->orderBy('view_count', 'desc');
    }
}
