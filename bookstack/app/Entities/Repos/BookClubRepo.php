<?php

namespace BookStack\Entities\Repos;

use BookStack\Activity\ActivityType;
use BookStack\Entities\Models\BookClub;
use BookStack\Entities\Queries\UserQueries;
use BookStack\Entities\Queries\BookQueries;
use BookStack\Entities\Tools\TrashCan;
use BookStack\Facades\Activity;
use Exception;

class BookClubRepo
{
    public function __construct(
        protected BaseRepo $baseRepo,
        protected BookQueries $bookQueries,
        protected TrashCan $trashCan,
        protected UserQueries $userQueries,
    ) {
    }

    /**
     * Create a new shelf in the system.
     */
    public function create(array $input, array $bookIds, array $userIds): BookClub
    {
        $bookclub = new BookClub();
        $this->baseRepo->create($bookclub, $input);
        $this->baseRepo->updateCoverImage($bookclub, $input['image'] ?? null);
        $this->updateBooks($bookclub, $bookIds);
        $this->updateUsers($bookclub, $userIds);
        Activity::add(ActivityType::BOOKCLUB_CREATE, $bookclub);

        return $bookclub;
    }

    /**
     * Update an existing shelf in the system using the given input.
     */
    public function update(BookClub $bookclub, array $input, ?array $bookIds, ?array $userIds): BookClub
    {
        $this->baseRepo->update($bookclub, $input);

        if (!is_null($bookIds)) {
            $this->updateBooks($bookclub, $bookIds);
        }

        if(!is_null($userIds)) {
            $this->updateUsers($bookclub, $userIds);
        }

        if (array_key_exists('image', $input)) {
            $this->baseRepo->updateCoverImage($bookclub, $input['image'], $input['image'] === null);
        }

        Activity::add(ActivityType::BOOKCLUB_UPDATE, $bookclub);

        return $bookclub;
    }

    /**
     * Update which books are assigned to this shelf by syncing the given book ids.
     * Function ensures the books are visible to the current user and existing.
     */
    protected function updateBooks(BookClub $bookclub, ?array $bookIds)
    {
        $numericIDs = collect($bookIds)->map(function ($id) {
            return intval($id);
        });
        
        $syncData = $this->bookQueries->visibleForList()
        ->whereIn('id', $bookIds)
        ->pluck('id')
        ->mapWithKeys(function ($bookId) use ($numericIDs) {
            return [$bookId => ['order' => $numericIDs->search($bookId)]];
        });
        // dd($syncData);

        $bookclub->books()->sync($syncData);
    }

    protected function updateUsers( BookClub $bookclub, array $userIds ) 
    {
        $numberIds = collect($userIds)->map(function ($id) {
            return intval($id);
        });
        
        $syncDatas = $this->userQueries->visibleForList()
            ->whereIn('id', $userIds)
            ->pluck('id')
            ->mapWithKeys(function ($userId) use ($numberIds) {
                return [$userId => ['order' => $numberIds->search($userId)]];
            });
        $bookclub->users()->sync($syncDatas);
    }
    /**
     * Remove a bookshelf from the system.
     *
     * @throws Exception
     */
    public function destroy(BookClub $bookclub)
    {

        $this->trashCan->softDestroyBookclub($bookclub);
        Activity::add(ActivityType::BOOKSHELF_DELETE, $bookclub);
        $this->trashCan->autoClearOld();
    }
}
