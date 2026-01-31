<?php

namespace BookStack\Entities\Tools;

use BookStack\Entities\Models\Book;
use BookStack\Entities\Models\BookClub;
use BookStack\Entities\Models\BookStackUser;
use BookStack\Entities\Queries\BookclubQueries;

class ClubContext
{
    protected string $KEY_CLUB_CONTEXT_ID = 'context_bookclub_id';

    public function __construct(
        protected BookclubQueries $clubQueries,
    ) {
    }

    /**
     * Get the current bookshelf context for the given book.
     */
    public function getContextualClubForBook(Book $book): ?BookClub
    {
        $contextBookclubId = session()->get($this->KEY_CLUB_CONTEXT_ID, null);

        if (!is_int($contextBookclubId)) {
            return null;
        }

        $bookclub = $this->clubQueries->findVisibleById($contextBookclubId);
        $clubContainsBook = $bookclub && $bookclub->contains($book);

        return $clubContainsBook ? $bookclub : null;
    }
    public function getContextualClubForUser(BookStackUser $user): ?BookClub
    {
        $contextUserclubId = session()->get($this->KEY_CLUB_CONTEXT_ID, null);

        if (!is_int($contextUserclubId)) {
            return null;
        }

        $bookclub = $this->clubQueries->findVisibleById($contextUserclubId);
        $clubContainsUser = $bookclub && $bookclub->contains1($user);

        return $clubContainsUser ? $bookclub : null;
    }

    /**
     * Store the current contextual shelf ID.
     */
    public function setClubContext(int $clubId): void
    {
        session()->put($this->KEY_CLUB_CONTEXT_ID, $clubId);
    }

    /**
     * Clear the session stored shelf context id.
     */
    public function clearClubContext(): void
    {
        session()->forget($this->KEY_CLUB_CONTEXT_ID);
    }
}
