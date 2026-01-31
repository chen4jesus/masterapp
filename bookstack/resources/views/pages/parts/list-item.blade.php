@component('entities.list-item-basic', ['entity' => $page, 'bookclub' => $bookclub ?? null, 'book' => $book ?? null])
    <div class="entity-item-snippet">
        <p class="text-muted break-text">{{ $page->getExcerpt() }}</p>
    </div>
@endcomponent