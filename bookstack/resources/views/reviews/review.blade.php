@php
    $reviewHtml = $review->safeHtml();
@endphp
<div component="{{ $readOnly ? '' : 'book-review' }}"
     option:book-review:review-id="{{ $review->id }}"
     option:book-review:review-local-id="{{ $review->local_id }}"
     option:book-review:review-parent-id="{{ $review->parent_id }}"
     option:book-review:updated-text="{{ trans('entities.review_updated_success') }}"
     option:book-review:deleted-text="{{ trans('entities.review_deleted_success') }}"
     option:book-review:wysiwyg-language="{{ $locale->htmlLang() }}"
     option:book-review:wysiwyg-text-direction="{{ $locale->htmlDirection() }}"
     id="review{{$review->local_id}}"
     class="comment-box">
    <div class="header">
        <div class="flex-container-row wrap items-center gap-x-xs">
            @if ($review->createdBy)
                <div>
                    <img width="50" src="{{ $review->createdBy->getAvatar(50) }}" class="avatar block mr-xs" alt="{{ $review->createdBy->name }}">
                </div>
            @endif
            <div class="meta text-muted flex-container-row wrap items-center flex text-small">
                @if ($review->createdBy)
                    <a href="{{ $review->createdBy->getProfileUrl() }}">{{ $review->createdBy->getShortName(16) }}</a>
                @else
                    {{ trans('common.deleted_user') }}
                @endif
                <span title="{{ $review->created_at }}">&nbsp;{{ trans('entities.review_created', ['createDiff' => $review->created]) }}</span>
                @if($review->isUpdated())
                    <span class="mx-xs">&bull;</span>
                    <span title="{{ trans('entities.review_updated', ['updateDiff' => $review->updated_at, 'username' => $review->updatedBy->name ?? trans('common.deleted_user')]) }}">
                 {{ trans('entities.review_updated_indicator') }}
                    </span>
                @endif
            </div>
            <div class="right-meta flex-container-row justify-flex-end items-center px-s">
                @if(!$readOnly && (userCan('review-create-all') || userCan('review-update', $review) || userCan('review-delete', $review)))
                <div class="actions mr-s">
                    @if(userCan('review-create-all'))
                        <button refs="book-review@reply-button" type="button" class="text-button text-muted hover-underline text-small p-xs">@icon('reply') {{ trans('common.reply') }}</button>
                    @endif
                    @if(userCan('review-update', $review))
                        <button refs="book-review@edit-button" type="button" class="text-button text-muted hover-underline text-small p-xs">@icon('edit') {{ trans('common.edit') }}</button>
                    @endif
                    @if(userCan('review-delete', $review))
                        <div component="dropdown" class="dropdown-container">
                            <button type="button" refs="dropdown@toggle" aria-haspopup="true" aria-expanded="false" class="text-button text-muted hover-underline text-small p-xs">@icon('delete') {{ trans('common.delete') }}</button>
                            <ul refs="dropdown@menu" class="dropdown-menu" role="menu">
                                <li class="px-m text-small text-muted pb-s">{{trans('entities.review_delete_confirm')}}</li>
                                <li>
                                    <button refs="book-review@delete-button" type="button" class="text-button text-neg icon-item">
                                        @icon('delete')
                                        <div>{{ trans('common.delete') }}</div>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    @endif
                    <span class="text-muted">
                        &nbsp;&bull;&nbsp;
                    </span>
                </div>
                @endif
                <div>
                    <a class="bold text-muted text-small" href="#review{{$review->local_id}}">#{{$review->local_id}}</a>
                </div>
            </div>
        </div>

    </div>

    <div refs="book-review@content-container" class="content">
        @if ($review->parent_id)
            <p class="review-reply">
                <a class="text-muted text-small" href="#review{{ $review->parent_id }}">@icon('reply'){{ trans('entities.review_in_reply_to', ['reviewId' => '#' . $review->parent_id]) }}</a>
            </p>
        @endif
        {!! $reviewHtml  !!}
    </div>

    @if(!$readOnly && userCan('review-update', $review))
        <form novalidate refs="book-review@form" hidden class="content pt-s px-s block">
            <div class="form-group description-input">
                <textarea refs="book-review@input" name="html" rows="3" placeholder="{{ trans('entities.review_placeholder') }}">{{ $reviewHtml }}</textarea>
            </div>
            <div class="form-group text-right">
                <button type="button" class="button outline" refs="book-review@form-cancel">{{ trans('common.cancel') }}</button>
                <button type="submit" class="button">{{ trans('entities.review_save') }}</button>
            </div>
        </form>
    @endif

</div>