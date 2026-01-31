<?php

namespace BookStack\Entities\Queries;

use BookStack\Entities\Models\Entity;
use Illuminate\Database\Eloquent\Builder;
use InvalidArgumentException;

class EntityQueries
{
    public function __construct(
        public BookshelfQueries $shelves,
        public BookQueries $books,
        public ChapterQueries $chapters,
        public PageQueries $pages,
        public PageRevisionQueries $revisions,
        public BookClubQueries $bookclubs
    ) {
    }

    /**
     * Find an entity via an identifier string in the format:
     * {type}:{id}
     * Example: (book:5).
     */
    public function findVisibleByStringIdentifier(string $identifier): ?Entity
    {
        $explodedId = explode(':', $identifier);
        $entityType = $explodedId[0];
        $entityId = intval($explodedId[1]);
        $queries = $this->getQueriesForType($entityType);

        return $queries->findVisibleById($entityId);
    }


    public function slugToId($model_type, $model_slug, $book_slug) {
        if($model_type == "book-clubs"){
            return $this->bookclubs->findVisibleBySlugOrFail($model_slug)->id;
        }elseif($model_type == "shelves"){
            return $this->shelves->findVisibleBySlugOrFail($model_slug)->id;
        }elseif($model_type == "books"){
            return $this->books->findVisibleBySlugOrFail($model_slug)->id;
        }elseif($model_type == "chapter"){
            return $this->chapters->findVisibleBySlugsOrFail($book_slug, $model_slug)->id;
        }elseif($model_type == "page"){
            return $this->pages->findVisibleBySlugsOrFail($book_slug, $model_slug)->id;
        }
        return null;
    }
    public function idToSlug($model_type, $model_id ) {
        if($model_type == "book-clubs"){
            return $this->bookclubs->findVisibleByIdOrFail($model_id)->slug;
        }elseif($model_type == "chapter"){
            return $this->chapters->findVisibleByIdOrFail($model_id)->slug;
        }elseif($model_type == "books"){
            return $this->books->findVisibleByIdOrFail($model_id)->slug;
        }elseif($model_type == "shelves"){
            return $this->chapters->findVisibleByIdOrFail($model_id)->slug;
        }elseif($model_type == "page"){
            return $this->pages->findVisibleByIdOrFail($model_id)->slug;
        }
        return null;
    }

    /**
     * Start a query of visible entities of the given type,
     * suitable for listing display.
     */
    public function visibleForList(string $entityType): Builder
    {
        $queries = $this->getQueriesForType($entityType);
        return $queries->visibleForList();
    }

    protected function getQueriesForType(string $type): ProvidesEntityQueries
    {
        /** @var ?ProvidesEntityQueries $queries */
        $queries = match ($type) {
            'page' => $this->pages,
            'chapter' => $this->chapters,
            'book' => $this->books,
            'bookshelf' => $this->shelves,
            'bookclub' => $this->bookclubs,
            default => null,
        };

        if (is_null($queries)) {
            throw new InvalidArgumentException("No entity query class configured for {$type}");
        }

        return $queries;
    }
}
