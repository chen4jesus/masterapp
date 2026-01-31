<?php

namespace BookStack\Entities\Controllers;

use BookStack\Activity\ActivityQueries;
use BookStack\Activity\Models\View;
use BookStack\Entities\Models\BookClub;
use BookStack\Entities\Models\Page;
use BookStack\Entities\Models\PageTrack;
use BookStack\Entities\Queries\BookQueries;
use BookStack\Entities\Queries\UserQueries;
use BookStack\Entities\Queries\BookClubQueries;
use BookStack\Entities\Queries\BookShelfQueries;
use BookStack\Entities\Repos\BookClubRepo;
use BookStack\Entities\Tools\BookContents;
use BookStack\Entities\Tools\ClubContext;
use BookStack\Exceptions\ImageUploadException;
use Illuminate\Support\Facades\DB;

use BookStack\Exceptions\NotFoundException;
use BookStack\Http\Controller;
use BookStack\References\ReferenceFetcher;
use BookStack\Util\SimpleListOptions;
use Exception;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BookClubsController extends Controller
{
    public function __construct(
        protected BookClubRepo $bookclubRepo,
        // protected BookShelfQueries $queries,

        protected BookClubQueries $queries,
        protected BookQueries $bookQueries,
        protected UserQueries $userQueries,


        protected ClubContext $clubContext,
        protected ReferenceFetcher $referenceFetcher,
    ) {}

    /**
     * Display a listing of bookshelves.
     */
    public function index(Request $request)
    {
        $view = setting()->getForCurrentUser('bookclubs_view_type');
        $listOptions = SimpleListOptions::fromRequest($request, 'bookclubs')->withSortOptions([
            'name'       => trans('common.sort_name'),
            'created_at' => trans('common.sort_created_at'),
            'updated_at' => trans('common.sort_updated_at'),
        ]);

        $bookclubs = $this->queries->visibleForListWithCover()
            ->orderBy($listOptions->getSort(), $listOptions->getOrder())
            ->paginate(18);

        $recents = $this->isSignedIn() ? $this->queries->recentlyViewedForCurrentUser()->get() : false;
        $popular = $this->queries->popularForList()->get();
        $new = $this->queries->visibleForList()
            ->orderBy('created_at', 'desc')
            ->take(4)
            ->get();

        $this->clubContext->clearClubContext();
        $this->setPageTitle(trans('entities.book_clubs'));

        return view('book-clubs.index', [
            'bookclubs'   => $bookclubs,
            'recents'     => $recents,
            'popular'     => $popular,
            'new'         => $new,
            'view'        => $view,
            'listOptions' => $listOptions,
        ]);
    }

    /**
     * Show the form for creating a new bookshelf.
     */
    public function create()
    {
        if (!user()->isGuest()) {
            $this->checkPermission('bookclub-create-all');

            $books = $this->bookQueries->visibleForList()->orderBy('name')->get(['name', 'id', 'slug', 'created_at', 'updated_at']);
            $users = $this->userQueries->visibleForList()->orderBy('name')->get(['name', 'id', 'slug', 'email', 'created_at', 'updated_at']);
            $this->setPageTitle(trans('entities.book_club_create'));

            return view('book-clubs.create', ['books' => $books, 'users' => $users]);
        } else {
            return redirect(url('/login'));
        }
    }

    /**
     * Store a newly created bookshelf in storage.
     *
     * @throws ValidationException
     * @throws ImageUploadException
     */
    public function store(Request $request)
    {
        if (!user()->isGuest()) {
            $this->checkPermission('bookclub-create-all');
            $validated = $this->validate($request, [
                'name'             => ['required', 'string', 'max:255'],
                'description_html' => ['string', 'max:2000'],
                'image'            => array_merge(['nullable'], $this->getImageValidationRules()),
                'tags'             => ['array'],
                'club_type'        => ['string', 'max:20'],
            ]);


            $bookIds = explode(',', $request->get('books', ''));

            $userIds = explode(',', $request->get('users', ''));

            $bookclub = $this->bookclubRepo->create($validated, $bookIds, $userIds);


            return redirect($bookclub->getUrl());
        } else {
            return redirect(url('/login'));
        }
    }

    public function myprogress($books, $slug)
    {
        if (!user()->isGuest()) {

            $user_id = auth()->id();
            foreach ($books as $key => $book) {
                $pages = Page::where('book_id', $book->id)->get();
                $totalPages = $pages->count(); // Get the total number of pages
                $readPages = PageTrack::where('user_id', $user_id)
                    ->where('bookclub_slug', $slug)
                    ->where('book_slug', $book->slug)
                    ->count(); // Get the number of pages read by the user

                $progress = $totalPages > 0 ? (int)(($readPages / $totalPages) * 100) : 0; // Ensure no division by zero
                $books[$key]->progress = $progress;
            }

            return $books;
        } else {
            return redirect(url('/login'));
        }
    }

    /**
     * Display the bookshelf of the given slug.
     *
     * @throws NotFoundException
     */
    public function show(Request $request, ActivityQueries $activities, string $slug)
    {
        if (!user()->isGuest()) {
            $bookclub = $this->queries->findVisibleBySlugOrFail($slug);
            $user_id = auth()->id();
            $bookclub_id = $bookclub->id;

            // Check if user is already a member
            $joinUser = DB::table('book_clubs_users')
                ->where('user_id', $user_id)
                ->where('book_clubs_id', $bookclub_id)
                ->exists(); // Returns true if a record exists

            // If the user is not a member AND is not admin, redirect them
            if (!$joinUser && $user_id != 1) {
                return redirect(url('/book-clubs'));
            }

            // If the user is an admin and not already a member, add them to the book club
            if ($user_id == 1 && !$joinUser) {
                DB::table('book_clubs_users')->insert([
                    'user_id' => $user_id,
                    'book_clubs_id' => $bookclub_id
                ]);
            }

            $this->checkOwnablePermission('bookclub-view', $bookclub);
            $listOptions = SimpleListOptions::fromRequest($request, 'club_books')->withSortOptions([
                'default' => trans('common.sort_default'),
                'name' => trans('common.sort_name'),
                'created_at' => trans('common.sort_created_at'),
                'updated_at' => trans('common.sort_updated_at'),
            ]);

            $sort = $listOptions->getSort();

            $sortedVisibleClubBooks = $bookclub->visibleBooks()
                ->reorder($sort === 'default' ? 'order' : $sort, $listOptions->getOrder())
                ->get()
                ->values()
                ->all();
            $sortedVisibleClubBooks = $this->myprogress($sortedVisibleClubBooks, $slug);
            $sortedVisibleClubUsers = $bookclub->visibleUsers()
                ->reorder($sort === 'default' ? 'order' : $sort, $listOptions->getOrder())
                ->get()
                ->values()
                ->all();
            $this->clubContext->setClubContext($bookclub->id);
            $view = setting()->getForCurrentUser('bookclub_view_type');
            $this->setPageTitle($bookclub->getShortName());
            return view('book-clubs.show', [
                'bookclub'               => $bookclub,
                'sortedVisibleClubBooks' => $sortedVisibleClubBooks,
                'sortedVisibleClubUsers' => $sortedVisibleClubUsers,
                'view'                    => $view,
                'activity'                => $activities->entityActivity($bookclub, 20, 1),
                'listOptions'             => $listOptions,
                'referenceCount'          => $this->referenceFetcher->getReferenceCountToEntity($bookclub),
            ]);
        } else {
            return redirect(url('/login'));
        }
    }

    /**
     * Show the form for editing the specified bookshelf.
     */
    public function edit(string $slug)
    {
        if (!user()->isGuest()) {

            $bookclub = $this->queries->findVisibleBySlugOrFail($slug);
            $this->checkOwnablePermission('bookclub-update', $bookclub);

            $clubBookIds = $bookclub->books()->get(['id'])->pluck('id');
            $books = $this->bookQueries->visibleForList()
                ->whereNotIn('id', $clubBookIds)
                ->orderBy('name')
                ->get(['name', 'id', 'slug', 'created_at', 'updated_at']);

            $clubUserIds = $bookclub->users()->get(['id'])->pluck('id');
            $users = $this->userQueries->visibleForList()
                ->whereNotIn('id', $clubUserIds)
                ->orderBy('name')
                ->get(['name', 'id', 'email', 'slug', 'created_at', 'updated_at']);
            $this->setPageTitle(trans('entities.clubs_edit_named', ['name' => $bookclub->getShortName()]));

            $oldusers = $this->userQueries->visibleForList()
                ->whereIn('id', $clubUserIds)
                ->orderBy('name')
                ->get(['name', 'id', 'email', 'slug', 'created_at', 'updated_at']);

            return view('book-clubs.edit', [
                'bookclub' => $bookclub,
                'books' => $books,
                'users' => $users,
                'oldusers' => $oldusers,
            ]);
        } else {
            return redirect(url('/login'));
        }
    }

    /**
     * Update the specified bookshelf in storage.
     *
     * @throws ValidationException
     * @throws ImageUploadException
     * @throws NotFoundException
     */
    public function update(Request $request, string $slug)
    {
        if (!user()->isGuest()) {

            $bookclub = $this->queries->findVisibleBySlugOrFail($slug);
            $this->checkOwnablePermission('bookclub-update', $bookclub);
            $validated = $this->validate($request, [
                'name'             => ['required', 'string', 'max:255'],
                'description_html' => ['string', 'max:2000'],
                'image'            => array_merge(['nullable'], $this->getImageValidationRules()),
                'tags'             => ['array'],
                'club_type'         => ['string', 'max:20'],
            ]);

            if ($request->has('image_reset')) {
                $validated['image'] = null;
            } elseif (array_key_exists('image', $validated) && is_null($validated['image'])) {
                unset($validated['image']);
            }

            $bookIds = explode(',', $request->get('books', ''));
            $userIds = explode(',', $request->get('users', ''));
            $bookclub = $this->bookclubRepo->update($bookclub, $validated, $bookIds, $userIds);

            return redirect($bookclub->getUrl());
        } else {
            return redirect(url('/login'));
        }
    }

    /**
     * Shows the page to confirm deletion.
     */
    public function showDelete(string $slug)
    {
        if (!user()->isGuest()) {

            $bookclub = $this->queries->findVisibleBySlugOrFail($slug);
            $this->checkOwnablePermission('bookclub-delete', $bookclub);

            $this->setPageTitle(trans('entities.club_delete_named', ['name' => $bookclub->getShortName()]));

            return view('book-clubs.delete', ['bookclub' => $bookclub]);
        } else {
            return redirect(url('/login'));
        }
    }

    public function showJoin(string $slug)
    {
        if (!user()->isGuest()) {
            $bookclub = $this->queries->findVisibleBySlugOrFail($slug);
            $id = auth()->id();
            $isJoin = $id == 1 || $bookclub->visibleUsers->contains($id);
            if ($isJoin) {
                return redirect($bookclub->getUrl());
            } else {
                $this->setPageTitle(trans('entities.club_join_named', ['name' => $bookclub->getShortName()]));
                return view('book-clubs.join', ['bookclub' => $bookclub]);
            }
        } else {
            return redirect(url('/login'));
        }
        // $this->checkOwnablePermission('bookclub-join', $bookclub);
    }

    public function showLeave(string $slug)
    {
        if (!user()->isGuest()) {
            $bookclub = $this->queries->findVisibleBySlugOrFail($slug);
            $id = auth()->id();
            $isUser = $bookclub->visibleUsers->contains($id);
            if ($isUser) {
                $this->setPageTitle(trans('entities.club_join_named', ['name' => $bookclub->getShortName()]));
                return view('book-clubs.leave', ['bookclub' => $bookclub]);
            } else {
                return redirect(url('/book-clubs'));
            }
        } else {
            return redirect(url('/login'));
        }
        // $this->checkOwnablePermission('bookclub-join', $bookclub);
    }

    /**
     * Remove the specified bookbookclub from storage.
     *
     * @throws Exception
     */
    public function destroy(string $slug)
    {
        if (!user()->isGuest()) {
            $bookclub = $this->queries->findVisibleBySlugOrFail($slug);
            $this->checkOwnablePermission('bookclub-delete', $bookclub);

            $this->bookclubRepo->destroy($bookclub);

            return redirect('/book-clubs');
        } else {
            return redirect(url('/login'));
        }
    }

    public function join(string $slug)
    {
        if (!user()->isGuest()) {
            $bookclub = $this->queries->findVisibleBySlugOrFail($slug);
            $bookclub_id = $bookclub->id;
            $user_id = auth()->id();
            DB::table('book_clubs_users')->insert([
                'user_id' => $user_id,
                'book_clubs_id' => $bookclub_id,
            ]);
            return redirect($bookclub->getUrl());
        } else {
            return redirect(url('/login'));
        }
    }
    public function leave(string $slug)
    {
        if (!auth()->check()) {  // Corrected guest check
            return redirect()->to('/login');
        }

        $bookclub = $this->queries->findVisibleBySlugOrFail($slug);
        $bookclub_id = $bookclub->id;
        $user_id = auth()->id();

        // Remove user from the book club
        DB::table('book_clubs_users')
            ->where('user_id', $user_id)
            ->where('book_clubs_id', $bookclub_id)
            ->delete();

        // Remove all PageTrack records for this book club
        PageTrack::where('user_id', $user_id)
            ->where('bookclub_slug', $slug)
            ->delete(); // Removed all()

        return redirect()->to('/book-clubs');
    }

    public function members(Request $request, string $slug)
    {
        if (!user()->isGuest()) {

            $bookclub = $this->queries->findVisibleBySlugOrFail($slug);

            $listOptions = SimpleListOptions::fromRequest($request, 'club_books')->withSortOptions([
                'default' => trans('common.sort_default'),
                'name' => trans('common.sort_name'),
                'created_at' => trans('common.sort_created_at'),
                'updated_at' => trans('common.sort_updated_at'),
            ]);

            $sort = $listOptions->getSort();

            // Get search query from request
            $search = $request->input('search');

            // Get all members with search filtering
            $membersQuery = $bookclub->visibleUsers()
                ->reorder($sort === 'default' ? 'order' : $sort, $listOptions->getOrder());

            if ($search) {
                $membersQuery->where('name', 'like', "%{$search}%");
            }

            $members = $membersQuery->get()->values()->all();

            // Get all books
            $books = $bookclub->visibleBooks()
                ->reorder($sort === 'default' ? 'order' : $sort, $listOptions->getOrder())
                ->get()
                ->values()
                ->all();

            // Assign books with progress
            foreach ($members as $memberKey => $member) {
                $userBooks = [];

                foreach ($books as $bookKey => $book) {
                    $bookId = $book->id;
                    $bookslug = $book->slug;
                    $memberId = $member->id;

                    $totalPages = Page::where('book_id', $bookId)->count();
                    $readPages = PageTrack::where('user_id', $memberId)
                        ->where('bookclub_slug', $slug)
                        ->where('book_slug', $bookslug)
                        ->count();

                    $progress = $totalPages > 0 ? (int)(($readPages / $totalPages) * 100) : 0;

                    $bookCopy = clone $book;
                    $bookCopy->progress = $progress;
                    $userBooks[] = $bookCopy;
                }

                $members[$memberKey]->books = $userBooks;
            }

            return view('book-clubs.members', [
                'users'       => $members,
                'bookclub'    => $bookclub,
                'listOptions' => $listOptions,
                'search'      => $search, // Pass search term to the view
            ]);
        } else {
            return redirect(url('/login'));
        }
    }
}
