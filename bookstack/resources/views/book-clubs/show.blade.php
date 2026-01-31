@extends('layouts.tri')

@push('social-meta')
    <meta property="og:description" content="{{ Str::limit($bookclub->description, 100, '...') }}">
    @if($bookclub->cover)
        <meta property="og:image" content="{{ $bookclub->getBookCover() }}">
    @endif
@endpush

@include('entities.body-tag-classes', ['entity' => $bookclub])

@section('body')

    <div class="mb-s print-hidden">
        @include('entities.breadcrumbs', ['crumbs' => [
            $bookclub,
        ]])
    </div>

    <main class="card content-wrap">

        <div class="flex-container-row wrap v-center">
            <h1 class="flex fit-content break-text">{{ $bookclub->name }}</h1>
            <div class="flex"></div>
            <div class="flex fit-content text-m-right my-m ml-m">
                @include('common.sort', $listOptions->getSortControlData())
            </div>
        </div>

        <div class="book-content">
            {{-- <div class="text-muted break-text">{!! $bookclub->descriptionHtml() !!}</div> --}}
            @if(count($sortedVisibleClubBooks) > 0)
                @if($view === 'list')
                    <div class="entity-list">
                        @foreach($sortedVisibleClubBooks as $book)
                            @include('book-clubs.list-item', ['entity' => $book, 'bookclub' => $bookclub])
                        @endforeach
                    </div>
                @else
                    <div class="grid third">
                        @foreach($sortedVisibleClubBooks as $book)
                            @include('book-clubs.grid-item', ['entity' => $book, 'bookclub' => $bookclub])
                        @endforeach
                    </div>
                @endif
            @else
                <div class="mt-xl">
                    <hr>
                    <p class="text-muted italic mt-xl mb-m">{{ trans('entities.club_empty_contents') }}</p>
                    <div class="icon-list inline block">
                        @if(userCan('book-create-all') && userCan('bookshelf-update', $bookclub))
                            <a href="{{ $bookclub->getUrl('/edit') }}" class="icon-list-item text-book">
                                <span class="icon">@icon('edit')</span>
                                <span>{{ trans('entities.club_edit_add_book_user') }}</span>
                            </a>
                        @endif
                        
                    </div>
                </div>
            @endif
        </div>
    </main>
    @if (Auth::check())
        @include('layouts.parts.audio')
    @endif

@stop

@section('left')

    @if($bookclub->tags->count() > 0)
        <div id="tags" class="mb-xl">
            @include('entities.tag-list', ['entity' => $bookclub])
        </div>
    @endif

    <div id="details" class="mb-xl">
        <h5>{{ trans('common.details') }}</h5>
        <div class="blended-links">
            @include('entities.meta', ['entity' => $bookclub, 'watchOptions' => null])
            @if($bookclub->hasPermissions())
                <div class="active-restriction">
                    @if(userCan('restrictions-manage', $bookclub))
                        <a href="{{ $bookclub->getUrl('/permissions') }}" class="entity-meta-item">
                            @icon('lock')
                            <div>{{ trans('entities.shelves_permissions_active') }}</div>
                        </a>
                    @else
                        <div class="entity-meta-item">
                            @icon('lock')
                            <div>{{ trans('entities.shelves_permissions_active') }}</div>
                        </div>
                    @endif
                </div>
            @endif
        </div>
    </div>

    @if(count($activity) > 0)
        <div id="recent-activity" class="mb-xl">
            <h5>{{ trans('entities.recent_activity') }}</h5>
            @include('common.activity-list', ['activity' => $activity])
        </div>
    @endif
@stop

@section('right')
    <div class="actions mb-xl">
        <h5>{{ trans('common.actions') }}</h5>
        <div class="icon-list text-link">

            {{-- @if(userCan('book-create-all') && userCan('bookshelf-update', $bookclub)) --}}
                <a href="{{ $bookclub->getUrl('/members') }}" data-shortcut="new" class="icon-list-item">
                    <span class="icon">@icon('users')</span>
                    <span>{{ trans('settings.members_progress') }}</span>
                </a>
                <a href="{{ $bookclub->getUrl('/showleave') }}" data-shortcut="new" class="icon-list-item">
                    <span class="icon">@icon('logout')</span>
                    <span>{{ trans('entities.leave_club') }}</span>
                </a>
            {{-- @endif --}}

            @include('entities.view-toggle', ['view' => $view, 'type' => 'bookclub'])

            <hr class="primary-background">

            @if(userCan('bookclub-update', $bookclub))
                <a href="{{ $bookclub->getUrl('/edit') }}" data-shortcut="edit" class="icon-list-item">
                    <span>@icon('edit')</span>
                    <span>{{ trans('common.edit') }}</span>
                </a>
            @endif

            {{-- @if(userCan('restrictions-manage', $bookclub))
                <a href="{{ $bookclub->getUrl('/permissions') }}" data-shortcut="permissions" class="icon-list-item">
                    <span>@icon('lock')</span>
                    <span>{{ trans('entities.permissions') }}</span>
                </a>
            @endif --}}

            @if(userCan('bookclub-delete', $bookclub))
                <a href="{{ $bookclub->getUrl('/delete') }}" data-shortcut="delete" class="icon-list-item">
                    <span>@icon('delete')</span>
                    <span>{{ trans('common.delete') }}</span>
                </a>
            @endif

            @if(!user()->isGuest())
                <hr class="primary-background">
                @include('entities.favourite-action', ['entity' => $bookclub])
            @endif

        </div>
    </div>
@stop




