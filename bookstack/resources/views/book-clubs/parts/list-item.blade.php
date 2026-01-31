<a href="{{ !user()->isGuest() ? (Auth::id() == 1 || $bookclub->visibleUsers->contains(Auth::id()) ? $bookclub->getUrl() : ($bookclub->club_type == 'true' ? $bookclub->getUrl('/showjoin') : '')) : '' }}" class="entity-list-item"
    
    data-entity-id="{{ $bookclub->id }}">
<div class="shelf entity-list-item">
    <div class="flex-1 entity-list-item-image bg-bookclub @if ($bookclub->image_id) has-image @endif"
        style="background-image: url('{{ $bookclub->cover ? $bookclub->getBookCover() : url('/book-club-avatar.png') }}')">
        @icon('bookclub')
    </div>
    <div class="content flex-2 ">
        <h4 class="entity-list-item-name break-text">{{ $bookclub->name }}</h4>
        <div class="entity-item-snippet">
            <p class="text-muted break-text mb-none">{{ $bookclub->getExcerpt() }}</p>
        </div>
        <div>
            <p class = "small mb-none">@icon('star')<span class = ""
                    title="{{ $bookclub->created_at->toDayDateTimeString() }}">{{ trans('entities.meta_created', ['timeLength' => $bookclub->created_at->diffForHumans()]) }}</span>
            </p>
            <p class = "small mb-none">@icon('edit')<span
                    title="{{ $bookclub->updated_at->toDayDateTimeString() }}">{{ trans('entities.meta_updated', ['timeLength' => $bookclub->updated_at->diffForHumans()]) }}</span>
            </p>
            <p class = "small mb-none">@icon('users')<span
                    title="{{ trans('entities.description_club_members') }}">{{ trans('entities.book_club_members', ['membersLength' => count($bookclub->visibleUsers)]) }}</span>
            </p>
        </div>
    </div>
    @if (!user()->isGuest())
        
    @if( Auth::id() == 1 || $bookclub->visibleUsers->contains(Auth::id()))
    <button class="button flex-1" style = "visibility: hidden">
        {{ trans('entities.book_club_join') }}
    </button>
    @elseif ($bookclub->club_type == "true")
    <button class="button flex-1">
        {{ trans('entities.book_club_join') }}
    </button>
    @else
    <button class="button flex-1">
        {{ trans('entities.book_club_close_join') }}
    </button>
    @endif
    @else
    <button class="button flex-1" style = "visibility: hidden">
        {{ trans('entities.book_club_join') }}
    </button>
    @endif
</div>
</a>