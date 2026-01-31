@php
 $isFavourite = $entity->isFavourite();
@endphp
<form action="{{ url('/favourites/' . ($isFavourite ? 'remove' : 'add')) }}" method="POST">
    {{ csrf_field() }}
    <input type="hidden" name="type" value="{{ $entity->getMorphClass() }}">
    <input type="hidden" name="id" value="{{ $entity->id }}">
    <input type="hidden" name='parent' value = "{{ $entity->getTable() }}|{{trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/')}}">
    <button type="submit" data-shortcut="favourite" class="icon-list-item text-link">
        <span>@icon($isFavourite ? 'star' : 'star-outline')</span>
        <span>{{ $isFavourite ? trans('common.unfavourite') : trans('common.favourite') }}</span>
    </button>
</form>