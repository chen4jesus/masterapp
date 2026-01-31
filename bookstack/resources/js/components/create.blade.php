<div refs="book-reviews@form-container" hidden class="comment-branch mb-m">
    <div class="comment-box">

        <div class="header p-s">{{ trans('entities.review_new') }}</div>
        <div refs="book-reviews@reply-to-row" hidden class="primary-background-light text-muted px-s py-xs">
            <div class="grid left-focus v-center">
                <div>
                    <a refs="book-reviews@form-reply-link" href="#">{{ trans('entities.review_in_reply_to', ['reviewId' => '1234']) }}</a>
                </div>
                <div class="text-right">
                    <button refs="book-reviews@remove-reply-to-button" class="text-button">{{ trans('common.remove') }}</button>
                </div>
            </div>
        </div>

        <div class="content px-s pt-s">
            <form refs="book-reviews@form" novalidate>
                <div class="form-group description-input">
                <textarea refs="book-reviews@form-input" name="html"
                          rows="3"
                          placeholder="{{ trans('entities.review_placeholder') }}"></textarea>
                </div>
                <div class="form-group text-right">
                    <button type="button" class="button outline"
                            refs="book-reviews@hide-form-button">{{ trans('common.cancel') }}</button>
                    <button type="submit" class="button">{{ trans('entities.review_save') }}</button>
                </div>
            </form>
        </div>

    </div>
</div>