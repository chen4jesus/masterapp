<?php

namespace BookStack\Entities\Controllers;

use BookStack\Activity\ActivityQueries;
use BookStack\Activity\ActivityType;
use BookStack\Activity\Models\View;
use BookStack\Activity\Tools\UserEntityWatchOptions;
use BookStack\Entities\Models\Page;
use BookStack\Entities\Models\PageTrack;
use BookStack\Entities\Models\Reviews;
use BookStack\Entities\Queries\BookClubQueries;
use BookStack\Entities\Queries\BookQueries;
use BookStack\Entities\Queries\BookshelfQueries;
use BookStack\Entities\Repos\BookRepo;
use BookStack\Entities\Tools\BookContents;
use BookStack\Entities\Tools\Cloner;
use BookStack\Entities\Tools\HierarchyTransformer;
use BookStack\Entities\Tools\ShelfContext;
use BookStack\Exceptions\ImageUploadException;
use BookStack\Exceptions\NotFoundException;
use BookStack\Facades\Activity;
use BookStack\Http\Controller;
use BookStack\References\ReferenceFetcher;
use BookStack\Util\SimpleListOptions;
use Illuminate\Support\Facades\DB;

use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class BookController extends Controller
{
    public function __construct(
        protected ShelfContext $shelfContext,
        protected BookRepo $bookRepo,
        protected BookQueries $queries,
        protected BookshelfQueries $shelfQueries,
        protected ReferenceFetcher $referenceFetcher,
        protected BookClubQueries $bookclubQueries,
        protected $flag = 0,
    ) {}

    /**
     * Display a listing of the book.
     */
    public function index(Request $request)
    {
        $view = setting()->getForCurrentUser('books_view_type');
        $listOptions = SimpleListOptions::fromRequest($request, 'books')->withSortOptions([
            'name' => trans('common.sort_name'),
            'created_at' => trans('common.sort_created_at'),
            'updated_at' => trans('common.sort_updated_at'),
        ]);

        $books = $this->queries->visibleForListWithCover()
            ->orderBy($listOptions->getSort(), $listOptions->getOrder())
            ->paginate(18);
        $recents = $this->isSignedIn() ? $this->queries->recentlyViewedForCurrentUser()->take(4)->get() : false;
        $popular = $this->queries->popularForList()->take(4)->get();
        $new = $this->queries->visibleForList()->orderBy('created_at', 'desc')->take(4)->get();

        $this->shelfContext->clearShelfContext();

        $this->setPageTitle(trans('entities.books'));

        return view('books.index', [
            'books'   => $books,
            'recents' => $recents,
            'popular' => $popular,
            'new'     => $new,
            'view'    => $view,
            'listOptions' => $listOptions,
        ]);
    }

    /**
     * Show the form for creating a new book.
     */
    public function create(?string $shelfSlug = null)
    {
        $this->checkPermission('book-create-all');

        $bookshelf = null;
        if ($shelfSlug !== null) {
            $bookshelf = $this->shelfQueries->findVisibleBySlugOrFail($shelfSlug);
            $this->checkOwnablePermission('bookshelf-update', $bookshelf);
        }

        $this->setPageTitle(trans('entities.books_create'));

        return view('books.create', [
            'bookshelf' => $bookshelf,
        ]);
    }

    /**
     * Store a newly created book in storage.
     *
     * @throws ImageUploadException
     * @throws ValidationException
     */
    public function store(Request $request, ?string $shelfSlug = null)
    {
        $this->checkPermission('book-create-all');
        $validated = $this->validate($request, [
            'name'                => ['required', 'string', 'max:255'],
            'description_html'    => ['string', 'max:2000'],
            'image'               => array_merge(['nullable'], $this->getImageValidationRules()),
            'tags'                => ['array'],
            'default_template_id' => ['nullable', 'integer'],
        ]);

        $bookshelf = null;
        if ($shelfSlug !== null) {
            $bookshelf = $this->shelfQueries->findVisibleBySlugOrFail($shelfSlug);
            $this->checkOwnablePermission('bookshelf-update', $bookshelf);
        }

        $book = $this->bookRepo->create($validated);

        if ($bookshelf) {
            $bookshelf->appendBook($book);
            Activity::add(ActivityType::BOOKSHELF_UPDATE, $bookshelf);
        }

        return redirect($book->getUrl());
    }

    /**
     * Display the specified book.
     */
    public function show(Request $request, ActivityQueries $activities, string $slug)
    {
        $review_id = $request->get('review_id');
        $review = Reviews::find($review_id);
        $book = $this->queries->findVisibleBySlugOrFail($slug);
        $bookChildren = (new BookContents($book))->getTree(true);
        $bookParentShelves = $book->shelves()->scopes('visible')->get();
        $bookParentClubs = $book->bookClubs()->scopes('visible')->get();
        View::incrementFor($book);
        if ($request->has('shelf')) {
            $this->shelfContext->setShelfContext(intval($request->get('shelf')));
        }
        $this->setPageTitle($book->getShortName());
        $reviews = Reviews::where('book_slug', $slug)->latest()->get();


        return view('books.show', [
            'book'              => $book,
            'current'           => $book,
            'review'            => $review,
            'reviews'           => $reviews ?? null,
            'bookclub'          => null,
            'bookChildren'      => $bookChildren,
            'membersPro'      => null,
            'bookParentShelves' => $bookParentShelves,
            'bookParentBookClubs' => $bookParentClubs,
            'watchOptions'      => new UserEntityWatchOptions(user(), $book),
            'activity'          => $activities->entityActivity($book, 20, 1),
            'referenceCount'    => $this->referenceFetcher->getReferenceCountToEntity($book),
        ]);
    }


    public function toReadPage($bookclubSlug, $bookSlug)
    {
        if (!user()->isGuest()) {
            $user_id = auth()->id();
            $lastPage = PageTrack::where('user_id', $user_id)->where("bookclub_slug", $bookclubSlug)->where('book_slug', $bookSlug)->orderBy('created_at', 'desc') // Make sure to order by a timestamp
                ->first();
            if (is_null($lastPage)) {
                return '';
            } else {
                return $lastPage;
            }
        } else {
            return redirect(url('/login'));
        }
    }

    public function progressMemebers($members, $bookclubSlug, $book)
    {
        if (!user()->isGuest()) {
            foreach ($members as $key => $member) {
                $bookId = $book->id;
                $bookslug = $book->slug;
                $memberId = $member->id;
                $pages = Page::where('book_id', $bookId)->get();
                $totalPages = $pages->count(); // Get the total number of pages
                $readPages = PageTrack::where('user_id', $memberId)
                    ->where('bookclub_slug', $bookclubSlug)
                    ->where('book_slug', $bookslug)
                    ->count(); // Get the number of pages read by the user

                $progress = $totalPages > 0 ? (int)(($readPages / $totalPages) * 100) : 0; // Ensure no division by zero
                $members[$key]->progress = $progress;
            }
            return $members;
        } else {
            return redirect(url('/login'));
        }
    }
    public function bookReview(Request $request, $bookslug)
    {
        if (!user()->isGuest()) {
            $this->checkPermission('review-create-all');

            $request->validate([
                'review' => 'required|string|max:1000',
            ]);

            $review_id = $request->get('review_id');
            if($review_id == 0) {
                Reviews::create([
                    'book_slug' => $bookslug,
                    'user_id' => auth()->id(),
                    'review' => $request->review,
                ]);
            }else{
                Reviews::find($review_id)->update([
                    'review' => $request->review
                ]);
            }


            return redirect('/books/'. $bookslug)->with('success', trans('entities.save_review_msg'));
        } else {
            return redirect(url('/login'));
        }
    }
    public function bookclubReview(Request $request, $bookclubSlug, $bookslug)
    {

        if (!user()->isGuest()) {
            $this->checkPermission('review-create-all');
            $review_id = $request->get('review_id');
            
            $request->validate([
                'review' => 'required|string|max:1000',
            ]);

            if($review_id == 0) {
                Reviews::create([
                    'bookclub_slug' => $bookclubSlug,
                    'book_slug' => $bookslug,
                    'user_id' => auth()->id(),
                    'review' => $request->review,
                ]);
            } else {
                Reviews::find($review_id)->update([
                    'review' => $request->review
                ]);
            }


            return redirect('/book-clubs/'.$bookclubSlug.'/books/'.$bookslug)->with('success', trans('entities.save_review_msg'));
        } else {
            return redirect(url('/login'));
        }
    }
    public function deleteReview(Request $request)
    {
        if (!auth()->check()) {
            return redirect(url('/login'));
        }

        $this->checkPermission('review-delete-all');

        $review_id = $request->get('review_id');

        $review = Reviews::find($review_id);

        if (!$review) {
            return redirect()->back()->with('error', trans('entities.review_not_found'));
        }

        $review->delete();

        return redirect()->back()->with('success', trans('entities.delete_review_msg'));
    }

    public function approveReview(Request $request)
    {
        if (!auth()->check()) {
            return redirect(url('/login'));
        }
        
        $this->checkPermission('review-delete-all');
        
        $review_id = $request->get('review_id');
        
        $review = Reviews::find($review_id);
        
        if (!$review) {
            return redirect()->back()->with('error', trans('entities.review_not_found'));
        }

        $review->update(['approved' => 1]);

        return redirect()->back()->with('success', trans('entities.approve_review_msg'));
    }

    public function disapproveReview(Request $request)
    {
        if (!auth()->check()) {
            return redirect(url('/login'));
        }

        $this->checkPermission('review-delete-all');

        $review_id = $request->get('review_id');

        $review = Reviews::find($review_id);

        if (!$review) {
            return redirect()->back()->with('error', trans('entities.review_not_found'));
        }

        $review->update(['approved' => 0]);

        return redirect()->back()->with('success', trans('entities.disapprove_review_msg'));
    }

    public function showBook(Request $request, ActivityQueries $activities, string $bookclubSlug, string $bookslug)
    {

        if (!user()->isGuest()) {
            $review_id = $request->get('review_id');

            $review = Reviews::find($review_id);
            $bookclub = $this->bookclubQueries->findVisibleBySlugOrFail($bookclubSlug);
            $user_id = auth()->id();
            $bookclub_id = $bookclub->id;

            // Ensure you're checking the correct relationship in the database
            $joinUser = DB::table('book_clubs_users')
                ->where('user_id', $user_id)
                ->where('book_clubs_id', $bookclub_id)
                ->exists();  // This will return true if a record exists

            // If user is not part of the book club or is not admin (user_id != 1)
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

            $redirectedKey = "redirected_to_last_page_{$user_id}_{$bookclubSlug}_{$bookslug}";
            // Check if user has already been redirected
            if (!session()->has($redirectedKey)) {
                $lastPage = $this->toReadPage($bookclubSlug, $bookslug);
                if ($lastPage) {
                    // Set session flag to prevent further redirections
                    session()->put($redirectedKey, true);
                    return redirect()->route('pages.show', [
                        'slug' => $bookclubSlug,
                        'bookSlug' => $bookslug,
                        'pageSlug' => $lastPage->page_slug,
                    ]);
                }
            }

            // If already redirected, show the book normally
            $book = $this->queries->findVisibleBySlugOrFail($bookslug);
            $listOptions = SimpleListOptions::fromRequest($request, 'club_books')->withSortOptions([
                'default' => trans('common.sort_default'),
                'name' => trans('common.sort_name'),
                'created_at' => trans('common.sort_created_at'),
                'updated_at' => trans('common.sort_updated_at'),
            ]);
            $reviews = Reviews::where(['book_slug'=> $bookslug, 'bookclub_slug' => $bookclubSlug])->latest()->get();

            $sort = $listOptions->getSort();

            $sortedVisibleClubUsers = $bookclub->visibleBooks()
                ->reorder($sort === 'default' ? 'order' : $sort, $listOptions->getOrder())
                ->get()
                ->values()
                ->all();
            $bookChildren = (new BookContents($book))->getTree(true);
            $bookParentShelves = $book->shelves()->scopes('visible')->get();
            $bookParentClubs = $book->bookClubs()->scopes('visible')->get();

            $progressOfMembers = $this->progressMemebers($sortedVisibleClubUsers, $bookclubSlug, $book);

            if ($request->has('shelf')) {
                $this->shelfContext->setShelfContext(intval($request->get('shelf')));
            }

            $this->setPageTitle($book->getShortName());

            return view('books.show', [
                'book'              => $book,
                'current'           => $book,
                'bookChildren'      => $bookChildren,
                'bookParentShelves' => $bookParentShelves,
                'bookParentBookClubs' => $bookParentClubs,
                'reviews'           => $reviews ?? null,
                'review'           => $review ?? null,
                'bookclub'          => $bookclub ?? null,
                'membersPro'        => $progressOfMembers ?? null,
                'watchOptions'      => new UserEntityWatchOptions(user(), $book),
                'activity'          => $activities->entityActivity($book, 20, 1),
                'referenceCount'    => $this->referenceFetcher->getReferenceCountToEntity($book),
            ]);
        } else {
            return redirect(url('/login'));
        }
    }


    /**
     * Show the form for editing the specified book.
     */
    public function edit(string $slug)
    {
        $book = $this->queries->findVisibleBySlugOrFail($slug);
        $this->checkOwnablePermission('book-update', $book);
        $this->setPageTitle(trans('entities.books_edit_named', ['bookName' => $book->getShortName()]));

        return view('books.edit', ['book' => $book, 'current' => $book]);
    }

    /**
     * Update the specified book in storage.
     *
     * @throws ImageUploadException
     * @throws ValidationException
     * @throws Throwable
     */
    public function update(Request $request, string $slug)
    {
        $book = $this->queries->findVisibleBySlugOrFail($slug);
        $this->checkOwnablePermission('book-update', $book);

        $validated = $this->validate($request, [
            'name'                => ['required', 'string', 'max:255'],
            'description_html'    => ['string', 'max:2000'],
            'image'               => array_merge(['nullable'], $this->getImageValidationRules()),
            'tags'                => ['array'],
            'default_template_id' => ['nullable', 'integer'],
        ]);

        if ($request->has('image_reset')) {
            $validated['image'] = null;
        } elseif (array_key_exists('image', $validated) && is_null($validated['image'])) {
            unset($validated['image']);
        }

        $book = $this->bookRepo->update($book, $validated);

        return redirect($book->getUrl());
    }

    /**
     * Shows the page to confirm deletion.
     */
    public function showDelete(string $bookSlug)
    {
        $book = $this->queries->findVisibleBySlugOrFail($bookSlug);
        $this->checkOwnablePermission('book-delete', $book);
        $this->setPageTitle(trans('entities.books_delete_named', ['bookName' => $book->getShortName()]));

        return view('books.delete', ['book' => $book, 'current' => $book]);
    }

    /**
     * Remove the specified book from the system.
     *
     * @throws Throwable
     */
    public function destroy(string $bookSlug)
    {
        $book = $this->queries->findVisibleBySlugOrFail($bookSlug);
        $this->checkOwnablePermission('book-delete', $book);

        $this->bookRepo->destroy($book);

        return redirect('/books');
    }

    /**
     * Show the view to copy a book.
     *
     * @throws NotFoundException
     */
    public function showCopy(string $bookSlug)
    {
        $book = $this->queries->findVisibleBySlugOrFail($bookSlug);
        $this->checkOwnablePermission('book-view', $book);

        session()->flashInput(['name' => $book->name]);

        return view('books.copy', [
            'book' => $book,
        ]);
    }

    /**
     * Create a copy of a book within the requested target destination.
     *
     * @throws NotFoundException
     */
    public function copy(Request $request, Cloner $cloner, string $bookSlug)
    {
        $book = $this->queries->findVisibleBySlugOrFail($bookSlug);
        $this->checkOwnablePermission('book-view', $book);
        $this->checkPermission('book-create-all');

        $newName = $request->get('name') ?: $book->name;
        $bookCopy = $cloner->cloneBook($book, $newName);
        $this->showSuccessNotification(trans('entities.books_copy_success'));

        return redirect($bookCopy->getUrl());
    }

    /**
     * Convert the chapter to a book.
     */
    public function convertToShelf(HierarchyTransformer $transformer, string $bookSlug)
    {
        $book = $this->queries->findVisibleBySlugOrFail($bookSlug);
        $this->checkOwnablePermission('book-update', $book);
        $this->checkOwnablePermission('book-delete', $book);
        $this->checkPermission('bookshelf-create-all');
        $this->checkPermission('book-create-all');

        $shelf = $transformer->transformBookToShelf($book);

        return redirect($shelf->getUrl());
    }
}
