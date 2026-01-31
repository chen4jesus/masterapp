<?php

namespace BookStack\Entities\Queries;

use BookStack\Entities\Models\BookStackUser;
use BookStack\Exceptions\NotFoundException;
use Illuminate\Database\Eloquent\Builder;

class UserQueries implements ProvidesEntityQueries
{
    protected static array $listAttributes = [
        'id', 'slug', 'name', 'email',
        'created_at', 'updated_at', 'image_id', 
    ];

    public function start(): Builder
    {
        return BookStackUser::query();
    }

    public function findVisibleById(int $id): ?BookStackUser

    {
        return $this->start()->find($id);
    }

    public function findVisibleByIdOrFail(int $id): BookStackUser
    {
        return $this->start()->findOrFail($id);
    }

    public function findVisibleByEmailOrFail(string $email): BookStackUser
    {
        /** @var ?BookStackUser $BookStackBookStackUser */
        $user = $this->start()
            // ->scopes('visible')
            ->where('email', '=', $email)
            ->first();

        if ($user === null) {
            throw new NotFoundException(trans('errors.user_not_found'));
        }

        return $user;
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
