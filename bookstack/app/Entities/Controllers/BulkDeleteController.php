<?php

namespace BookStack\Entities\Controllers;

use BookStack\Entities\Models\Book;
use BookStack\Entities\Models\Bookshelf;
use BookStack\Activity\Models\Activity;
use BookStack\Entities\Tools\TrashCan;
use BookStack\Entities\Queries\BookQueries;
use BookStack\Entities\Queries\BookshelfQueries;
use BookStack\Http\ApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use BookStack\Activity\Tools\ActivityLogger;

class BulkDeleteController extends ApiController
{
    protected $trashCan;

    public function __construct(
        protected BookQueries $bookQueries,
        protected BookshelfQueries $shelvesQueries,
        protected ActivityLogger $activityLogger,
    )
    {
        $this->middleware(function ($request, $next) {
            $this->checkPermission('settings-manage');
            $this->checkPermission('restrictions-manage-all');
            $this->trashCan = app(TrashCan::class);
            return $next($request);
        });
    }

    /**
     * Bulk delete books, shelves and empty recycle bin. TBD: can add more resource types for bulk delete.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $deletedCount = [
            'books' => 0,
            'shelves' => 0,
            'recycle_bin_items' => 0,
        ];

        // Delete books
        $books = $this->bookQueries->visibleForList()->get();
        foreach ($books as $book) {
            if ($book && userCan('book-delete', $book)) {
                $this->trashCan->softDestroyBook($book);
                $deletedCount['books']++;
                $this->activityLogger->removeEntity($book);
            }
        }

        // Delete shelves
        $shelves = $this->shelvesQueries->visibleForList()->get();
        foreach ($shelves as $shelf) {
            if ($shelf && userCan('bookshelf-delete', $shelf)) {
                $this->trashCan->softDestroyShelf($shelf);
                $deletedCount['shelves']++;
                $this->activityLogger->removeEntity($shelf);
            }
        }

        Activity::query()->delete();

        // Empty recycle bin if requested
        $deletedCount['recycle_bin_items'] = $this->trashCan->empty();

        return response()->json([
            'message' => 'Bulk deletion completed successfully',
            'deleted' => $deletedCount,
        ]);
    }
} 