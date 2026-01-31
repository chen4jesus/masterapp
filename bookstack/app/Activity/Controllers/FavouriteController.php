<?php

namespace BookStack\Activity\Controllers;

use BookStack\Activity\Models\Favourite;
use BookStack\Entities\Queries\QueryTopFavourites;
use BookStack\Entities\Queries\EntityQueries;
use BookStack\Entities\Tools\MixedEntityRequestHelper;
use BookStack\Http\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FavouriteController extends Controller
{
    public function __construct(
        protected EntityQueries $entityQueries,
        protected MixedEntityRequestHelper $entityHelper,
    ) {
    }

    /**
     * Show a listing of all favourite items for the current user.
     */
    public function index(Request $request, QueryTopFavourites $topFavourites)
    {
        $viewCount = 20;
        $page = intval($request->get('page', 1));
        $favourites = $topFavourites->run($viewCount + 1, (($page - 1) * $viewCount));

        $hasMoreLink = ($favourites->count() > $viewCount) ? url('/favourites?page=' . ($page + 1)) : null;

        $this->setPageTitle(trans('entities.my_favourites'));
        return view('common.detailed-listing-with-more', [
            'title'       => trans('entities.my_favourites'),
            'entities'    => $favourites->slice(0, $viewCount),
            'hasMoreLink' => $hasMoreLink,
        ]);
    }

    /**
     * Add a new item as a favourite.
     */
    public function add(Request $request)
    {
        $entity_id =$request->get('id');
        $entity_type = $request->get('type');
        $user_id = user()->id;
        $modelInfo = $this->validate($request, $this->entityHelper->validationRules());
        $entity = $this->entityHelper->getVisibleEntityFromRequestData($modelInfo);
        $entity->favourites()->firstOrCreate([
            'user_id' => user()->id,
        ]);
        $newFavourite = Favourite::where([
            'user_id' => $user_id,
            'favouritable_id' => $entity_id,
            'favouritable_type' => $entity_type,
            'favouritable_parent' => null
            ])
            ->latest(); // Orders by the latest 'created_at' timestamp
            $newFavourite = $newFavourite->first();
        if(isset($newFavourite)){
            if (preg_match('/^(book_clubs|bookshelves|books|pages|chapters)\|(.+)$/', $request->get('parent'), $matches)) {
                $parentType = $matches[1]; // bookclub, bookshelf, or book
                $remainingPath = $matches[2]; // book-clubs/12/books/23
                $segments = explode('/', $remainingPath);
                $result = [];
                for ($i = 0; $i < count($segments); $i += 2) {
                    if (isset($segments[$i + 1])) {
                        $result[$segments[$i]] = $segments[$i + 1];
                    }
                }
                $url = '';
                $book_slug = $result['books'] ?? '';
                foreach ($result as $model_type => $model_slug) {
                    $model_id = $this->entityQueries->slugToId($model_type, $model_slug, $book_slug);
                    $url .= '/' . $model_type . '/' . $model_id;
                }
                $newFavourite->favouritable_parent = $parentType . "|" . trim($url, '/');
                $newFavourite->save();
            }            
        }
        $this->showSuccessNotification(trans('activities.favourite_add_notification', [
            'name' => $entity->name,
        ]));
        return redirect('/'.$remainingPath);
    }

    /**
     * Remove an item as a favourite.
     */
    public function remove(Request $request)
    {
        $modelInfo = $this->validate($request, $this->entityHelper->validationRules());
        $entity = $this->entityHelper->getVisibleEntityFromRequestData($modelInfo);
        $entity->favourites()->where([
            'user_id' => user()->id,
        ])->delete();

        $this->showSuccessNotification(trans('activities.favourite_remove_notification', [
            'name' => $entity->name,
        ]));
        if (preg_match('/^(book_clubs|bookshelves|books|pages|chapters)\|(.+)$/', $request->get('parent'), $matches)) {
            $parentType = $matches[1]; // bookclub, bookshelf, or book
            $remainingPath = $matches[2]; // book-clubs/12/books/23
        }
        return redirect('/'.$remainingPath);
    }
}
