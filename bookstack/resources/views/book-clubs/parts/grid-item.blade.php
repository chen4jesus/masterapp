<a href="{{ !user()->isGuest() ? (Auth::id() == 1 || $bookclub->visibleUsers->contains(Auth::id()) ? $bookclub->getUrl() : ($bookclub->club_type == 'true' ? $bookclub->getUrl('/showjoin') : '')) : '' }}"  class="grid-card"
    
    data-entity-id="{{ $entity->id }}">
    <div class="bg-{{ $entity->getType() }} featured-image-container-wrap">
        <div class="featured-image-container"
            style="background-image: url('{{ $entity->cover ? $entity->getBookCover() : url('/book-club-avatar.png') }}')">
        </div>
        @icon('bookclub')
    </div>
    <div class="grid-card-content text-center">
        <h2 class="text-limit-lines-2">{{ $entity->name }}</h2>
        <p class="text-muted">{{ $entity->getExcerpt(130) }}</p>
    </div>
    <div class="grid-card-footer text-muted ">
        <div class="text-center">
            <p>@icon('star')<span
                    title="{{ $entity->created_at->toDayDateTimeString() }}">{{ trans('entities.meta_created', ['timeLength' => $entity->created_at->diffForHumans()]) }}</span>
            </p>
            <p>@icon('edit')<span
                    title="{{ $entity->updated_at->toDayDateTimeString() }}">{{ trans('entities.meta_updated', ['timeLength' => $entity->updated_at->diffForHumans()]) }}</span>
            </p>
            <p>@icon('users')<span
                    title="{{ trans('entities.description_club_members') }}">{{ trans('entities.book_club_members', ['membersLength' => count($entity->visibleUsers)]) }}</span>
            </p>
        </div>
        <div class="text-center">
            @if (!user()->isGuest())
            @if( Auth::id() == 1 || $entity->visibleUsers->contains(Auth::id()))
            <button class="button flex-1" style = "visibility: hidden">
                {{ trans('entities.book_club_join') }}
            </button>
            @elseif ($entity->club_type == "true")
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
    </div>
</a>

                