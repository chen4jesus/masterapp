<a href="/book-clubs/{{ $bookclub->slug }}/books/{{ $entity->slug }}" class="book entity-list-item" data-entity-type="book"
    data-entity-id="{{ $book->id }}">
    <div class="entity-list-item-image bg-book" style="background-image: url('{{ $book->getBookCover() }}')">
        @icon('book')
    </div>
    <div class="content flex-2">
        <h4 class="entity-list-item-name break-text">{{ $book->name }}</h4>
        <div class="entity-item-snippet">
            <p class="text-muted break-text mb-s text-limit-lines-1">{{ $book->description }}</p>
        </div>
        <div>
            <p>@icon('star')<span
                    title="{{ $entity->created_at->toDayDateTimeString() }}">{{ trans('entities.meta_created', ['timeLength' => $entity->created_at->diffForHumans()]) }}</span>
            </p>
            <p>@icon('edit')<span
                    title="{{ $entity->updated_at->toDayDateTimeString() }}">{{ trans('entities.meta_updated', ['timeLength' => $entity->updated_at->diffForHumans()]) }}</span>
            </p>
            <strong>
                <p>@icon('progress-percentage')<span>{{ trans('entities.progress_percentage', ['progress' => $entity->progress]) }}</span></p>
            </strong>
        </div>
    </div>
</a>
