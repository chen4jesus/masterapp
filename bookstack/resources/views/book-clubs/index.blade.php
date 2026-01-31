@extends('layouts.tri')

@section('body')
    @include('book-clubs.parts.list', [
        'bookclubs' => $bookclubs,
        'view' => $view,
        'listOptions' => $listOptions,
    ])
    @if (Auth::check())
        @include('layouts.parts.audio')
    @endif
@stop

@section('right')

    <div class="actions mb-xl">
        <h5>{{ trans('common.actions') }}</h5>
        <div class="icon-list text-link">
            @if (userCan('bookclub-create-all'))
                <a href="{{ url('/create-book-club') }}" data-shortcut="new" class="icon-list-item">
                    <span>@icon('add')</span>
                    <span>{{ trans('entities.book_club_new_action') }}</span>
                </a>
            @endif

            @include('entities.view-toggle', ['view' => $view, 'type' => 'bookclubs'])

            <a href="{{ url('/tags') }}" class="icon-list-item">
                <span>@icon('tag')</span>
                <span>{{ trans('entities.tags_view_tags') }}</span>
            </a>
        </div>
    </div>

@stop

@section('left')
    @if ($recents)
        <div id="recents" class="mb-xl">
            <h5>{{ trans('entities.recently_viewed') }}</h5>
            @include('entities.list', ['entities' => $recents, 'style' => 'compact'])
        </div>
    @endif

    <div id="popular" class="mb-xl">
        <h5>{{ trans('entities.bookclubs_popular') }}</h5>
        @if (count($popular) > 0)
            @include('entities.list', ['entities' => $popular, 'style' => 'compact'])
        @else
            <p class="text-muted pb-l mb-none">{{ trans('entities.bookclubs_popular_empty') }}</p>
        @endif
    </div>

    <div id="new" class="mb-xl">
        <h5>{{ trans('entities.bookclubs_new') }}</h5>
        @if (count($new) > 0)
            @include('entities.list', ['entities' => $new, 'style' => 'compact'])
        @else
            <p class="text-muted pb-l mb-none">{{ trans('entities.bookclubs_new_empty') }}</p>
        @endif
    </div>
@stop
