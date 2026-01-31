<main class="content-wrap mt-m card">

    <div class="grid half v-center">
        <h1 class="list-heading">{{ trans('entities.book_clubs') }}</h1>
        <div class="text-right">
            @include('common.sort', $listOptions->getSortControlData())
        </div>
    </div>

    @if (count($bookclubs) > 0)

        @if ($view === 'list')
            <div class="entity-list">
                @foreach ($bookclubs as $index => $bookclub)
                    @if ($index !== 0)
                        <hr class="my-m">
                    @endif
                    @include('book-clubs.parts.list-item', ['bookclub' => $bookclub])
                @endforeach
            </div>
        @else
            <div class="grid third">
                @foreach ($bookclubs as $key => $bookclub)
                    @include('book-clubs.parts.grid-item', ['entity' => $bookclub])
                @endforeach
            </div>
        @endif
        <div>
            {!! $bookclubs->render() !!}
        </div>
    @else
        <p class="text-muted">{{ trans('entities.book_clubs_empty') }}</p>
        @if (userCan('bookclub-create-all'))
            <div class="icon-list block inline">
                <a href="{{ url('/create-book-club') }}" class="icon-list-item text-bookclubs">
                    <span>@icon('add')</span>
                    <span>{{ trans('entities.create_now') }}</span>
                </a>
            </div>
        @endif

    @endif
</main>
