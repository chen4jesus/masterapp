@push('head')
    <script src="{{ versioned_asset('libs/tinymce/tinymce.min.js') }}" nonce="{{ $cspNonce }}"></script>
@endpush

{{ csrf_field() }}
<div class="form-group title-input">
    <label for="name">{{ trans('common.name') }}</label>
    @include('form.text', ['name' => 'name', 'autofocus' => true])
</div>

<div class="form-group description-input">
    <label for="description_html">{{ trans('common.description') }}</label>
    @include('form.description-html-input')
</div>

<div component="shelf-sort" class="grid half gap-xl">
    <div class="form-group">
        <label for="books" id="shelf-sort-books-label">{{ trans('entities.bookclubs_books') }}</label>
        <input refs="shelf-sort@input" hidden type="text" name="books"
            value="{{ isset($bookclub) ? $bookclub->visibleBooks->implode('id', ',') : '' }}">
        <div class="scroll-box-header-item flex-container-row items-center py-xs">
            <span class="px-m py-xs">{{ trans('entities.bookclubs_drag_books') }}</span>
            <div class="dropdown-container ml-auto" component="dropdown">
                <button refs="dropdown@toggle" type="button" title="{{ trans('common.more') }}"
                    class="icon-button px-xs py-xxs mx-xs text-bigger" aria-haspopup="true" aria-expanded="false">
                    @icon('more')
                </button>
                <div refs="dropdown@menu shelf-sort@sort-button-container" class="dropdown-menu" role="menu">
                    <button type="button" class="text-item"
                        data-sort="name">{{ trans('entities.books_sort_name') }}</button>
                    <button type="button" class="text-item"
                        data-sort="created">{{ trans('entities.books_sort_created') }}</button>
                    <button type="button" class="text-item"
                        data-sort="updated">{{ trans('entities.books_sort_updated') }}</button>
                </div>
            </div>
        </div>
        <ul refs="shelf-sort@shelf-book-list" aria-labelledby="shelf-sort-books-label"
            class="scroll-box configured-option-list">
            @foreach ($bookclub->visibleBooks ?? [] as $book)
                @include('book-clubs.parts.book-item', ['book' => $book])
            @endforeach
        </ul>
    </div>
    <div class="form-group">
        <label for="books" id="shelf-sort-all-books-label">{{ trans('entities.bookclubs_add_books') }}</label>
        <input type="text" refs="shelf-sort@book-search" class="scroll-box-search"
            placeholder="{{ trans('common.search') }}">
        <ul refs="shelf-sort@all-book-list" aria-labelledby="shelf-sort-all-books-label"
            class="scroll-box available-option-list">
            @foreach ($books as $book)
                @include('book-clubs.parts.book-item', ['book' => $book])
            @endforeach
        </ul>
    </div>
</div>
<div component="shelf-sort" class="grid half gap-xl">
    <div class="form-group">
        <label for="users" id="shelf-sort-books-label">{{ trans('entities.bookclubs_users') }}</label>
        <input refs="shelf-sort@input" type="hidden" name="users"
            value="{{ isset($oldusers) ? $oldusers->implode('id', ',') : '' }}">
        <div class="scroll-box-header-item flex-container-row items-center py-xs">
            <span class="px-m py-xs">{{ trans('entities.bookclubs_drag_users') }}</span>
            <div class="dropdown-container ml-auto" component="dropdown">
                <button refs="dropdown@toggle" type="button" title="{{ trans('common.more') }}"
                    class="icon-button px-xs py-xxs mx-xs text-bigger" aria-haspopup="true" aria-expanded="false">
                    @icon('more')
                </button>
                <div refs="dropdown@menu shelf-sort@sort-button-container" class="dropdown-menu" role="menu">
                    <button type="button" class="text-item"
                        data-sort="name">{{ trans('entities.books_sort_name') }}</button>
                    <button type="button" class="text-item"
                        data-sort="created">{{ trans('entities.books_sort_created') }}</button>
                    <button type="button" class="text-item"
                        data-sort="updated">{{ trans('entities.books_sort_updated') }}</button>
                </div>
            </div>
        </div>
        <ul refs="shelf-sort@shelf-book-list" aria-labelledby="shelf-sort-books-label"
            class="scroll-box configured-option-list">
            @foreach ($oldusers ?? [] as $user)
                @include('book-clubs.parts.user-item', ['user' => $user])
            @endforeach
        </ul>
    </div>
    <div class="form-group">
        <label for="users" id="shelf-sort-all-books-label">{{ trans('entities.bookclubs_add_books') }}</label>
        <input type="text" refs="shelf-sort@book-search" class="scroll-box-search"
            placeholder="{{ trans('common.search') }}">
        <ul refs="shelf-sort@all-book-list" aria-labelledby="shelf-sort-all-books-label"
            class="scroll-box available-option-list">
            @foreach ($users as $user)
                @include('book-clubs.parts.user-item', ['user' => $user])
            @endforeach
        </ul>
    </div>
</div>

<div>
    @include('form.toggle-switch', [
        'name' => 'club_type',
        'value' => isset($bookclub) && ($bookclub->club_type === 'true') ? true : false,
        'label' => trans('entities.bookclub_type'),
    ])
    @include('form.errors', ['name' => 'active'])
</div>
<div class="form-group collapsible" component="collapsible" id="logo-control">
    <button refs="collapsible@trigger" type="button" class="collapse-title text-link" aria-expanded="false">
        <label>{{ trans('common.cover_image') }}</label>
    </button>
    <div refs="collapsible@content" class="collapse-content">
        <p class="small">{{ trans('common.cover_image_description') }}</p>

        @include('form.image-picker', [
            'defaultImage' => url('/book_default_cover.png'),
            'currentImage' =>
                isset($bookclub) && $bookclub->cover ? $bookclub->getBookCover() : url('/book_default_cover.png'),
            'name' => 'image',
            'imageClass' => 'cover',
        ])
    </div>
</div>

<div class="form-group collapsible" component="collapsible" id="tags-control">
    <button refs="collapsible@trigger" type="button" class="collapse-title text-link" aria-expanded="false">
        <label for="tag-manager">{{ trans('entities.bookclub_tags') }}</label>
    </button>
    <div refs="collapsible@content" class="collapse-content">
        @include('entities.tag-manager', ['entity' => $bookclub ?? null])
    </div>
</div>

<div class="form-group text-right">
    <a href="{{ isset($bookclub) ? $bookclub->getUrl() : url('/book-clubs') }}"
        class="button outline">{{ trans('common.cancel') }}</a>
    <button type="submit" class="button">{{ trans('entities.bookclubs_save') }}</button>
</div>

@include('entities.selector-popup')
@include('form.editor-translations')
