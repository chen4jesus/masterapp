<section component="book-reviews"
         option:book-reviews:book-id="{{ $book->id }}"
         option:book-reviews:created-text="{{ trans('entities.review_created_success') }}"
         option:book-reviews:count-text="{{ trans('entities.review_count') }}"
         option:book-reviews:wysiwyg-language="{{ $locale->htmlLang() }}"
         option:book-reviews:wysiwyg-text-direction="{{ $locale->htmlDirection() }}"
         class="comments-list"
         aria-label="{{ trans('entities.reviews') }}">

    <div refs="book-reviews@review-count-bar" class="grid half left-focus v-center no-row-gap">
        <h5 refs="book-reviews@reviews-title">{{ trans_choice('entities.review_count', $reviewTree->count(), ['count' => $reviewTree->count()]) }}</h5>
        @if ($reviewTree->empty() && userCan('review-create-all'))
            <div class="text-m-right" refs="book-reviews@add-button-container">
                <button type="button"
                        refs="book-reviews@add-review-button"
                        class="button outline">{{ trans('entities.review_add') }}</button>
            </div>
        @endif
    </div>

    <div refs="book-reviews@reviewContainer" class="comment-container">
        @foreach($reviewTree->get() as $branch)
            @include('reviews.review-branch', ['branch' => $branch, 'readOnly' => false])
        @endforeach
    </div>

    @if(userCan('review-create-all'))
        @include('reviews.create')
        @if (!$reviewTree->empty())
            <div refs="book-reviews@addButtonContainer" class="text-right">
                <button type="button"
                        refs="book-reviews@add-review-button"
                        class="button outline">{{ trans('entities.review_add') }}</button>
            </div>
        @endif
    @endif

    @if(userCan('review-create-all') || $reviewTree->canUpdateAny())
        @push('body-end')
            <script src="{{ versioned_asset('libs/tinymce/tinymce.min.js') }}" nonce="{{ $cspNonce }}" defer></script>
            @include('form.editor-translations')
            @include('entities.selector-popup')
        @endpush
    @endif

</section>