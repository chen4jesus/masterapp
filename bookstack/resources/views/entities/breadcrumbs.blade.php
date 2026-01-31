<nav class="breadcrumbs text-center" aria-label="{{ trans('common.breadcrumb') }}">
    <?php 
        $breadcrumbCount = 0; 
        $bookClubId = null;
    ?>

    {{-- Identify the BookClub ID from the first breadcrumb --}}
    @if (!empty($crumbs) && isset($crumbs[0]))
    @if ($crumbs[0] instanceof \BookStack\Entities\Models\BookClub)
        <?php $bookClubId = $crumbs[0]->slug; ?>
        <a href="{{ url('/book-clubs') }}" class="text-bookshelf icon-list-item outline-hover">
            <span>@icon('book-clubs')</span>
            <span>{{ trans('entities.book_clubs') }}</span>
        </a>
    @elseif ($crumbs[0] instanceof \BookStack\Entities\Models\Bookshelf)
        <a href="{{ url('/shelves') }}" class="text-bookshelf icon-list-item outline-hover">
            <span>@icon('shelf')</span>
            <span>{{ trans('entities.shelves') }}</span>
        </a>
    @elseif ($crumbs[0] instanceof \BookStack\Entities\Models\Book)
        <a href="{{ url('/books') }}" class="text-bookshelf icon-list-item outline-hover">
            <span>@icon('books')</span>
            <span>{{ trans('entities.books') }}</span>
        </a>
    @endif
    <?php $breadcrumbCount++; ?>
@endif

    @foreach ($crumbs as $key => $crumb)
        <?php 
            $isEntity = $crumb instanceof \BookStack\Entities\Models\Entity;
            $entityUrl = $crumb instanceof \BookStack\Entities\Models\Entity ? $crumb->getUrl() : url($key);

            // Ensure correct BookClub breadcrumb structure
            if ($bookClubId) {
                $entityUrl = preg_replace('#/book-clubs/\w+#', '', $entityUrl);
                $parsedUrl = parse_url($entityUrl);
                $entityUrl = url("/book-clubs/{$bookClubId}" . (isset($parsedUrl['path']) ? $parsedUrl['path'] : ''));
            }
        ?>

        @if (is_null($crumb))
            <?php continue; ?>
        @endif

        @if ($breadcrumbCount > 0)
            {{-- <div class="separator">@icon('chevron-right')</div> --}}
        @endif

        <div components="dropdown dropdown-search"
             option:dropdown-search:url="/search/entity/siblings?entity_type={{ $isEntity ? $crumb->getType() : '' }}&entity_id={{ $isEntity ? $crumb->id : '' }}&bookclub_slug={{ $bookClubId ?? '' }}"
             option:dropdown-search:local-search-selector=".entity-list-item"
             class="dropdown-search">

            <div class="dropdown-search-toggle-breadcrumb" refs="dropdown@toggle"
                 aria-haspopup="true" aria-expanded="false" tabindex="0">
                <div class="separator">@icon('chevron-right')</div>
            </div>

            <div refs="dropdown@menu" class="dropdown-search-dropdown card" role="menu">
                <div class="dropdown-search-search">
                    @icon('search')
                    <input refs="dropdown-search@searchInput"
                           aria-label="{{ trans('common.search') }}"
                           autocomplete="off"
                           placeholder="{{ trans('common.search') }}"
                           type="text">
                </div>
                <div refs="dropdown-search@loading">
                    @include('common.loading-icon')
                </div>
                <div refs="dropdown-search@listContainer" class="dropdown-search-list px-m" tabindex="-1"></div>
            </div>
        </div>

        @if (is_string($crumb))
            <a href="{{ $entityUrl }}">{{ $crumb }}</a>
        @elseif (is_array($crumb))
            <a href="{{ $entityUrl }}" class="icon-list-item outline-hover">
                <span>@icon($crumb['icon'])</span>
                <span>{{ $crumb['text'] }}</span>
            </a>
        @elseif ($isEntity)
            <a href="{{ $entityUrl }}" class="text-{{ $crumb->getType() }} icon-list-item outline-hover">
                <span>@icon($crumb->getType())</span>
                <span>{{ $crumb->getShortName() }}</span>
            </a>
        @endif

        <?php $breadcrumbCount++; ?>
    @endforeach
</nav>
