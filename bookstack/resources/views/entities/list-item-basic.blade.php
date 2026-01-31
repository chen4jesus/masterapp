<?php $type = $entity->getType(); ?>
<a href="{{ $bookclub ? $bookclub->getUrl() . ($type === 'book' ? '/books/' . $book->slug : '/books/' . $book->slug . ($type === 'chapter' ? '/chapter/' . $entity->slug : '/page/' . $entity->slug) ) : $entity->getUrl() }}" class="{{$type}} {{$type === 'page' && $entity->draft ? 'draft' : ''}} {{$classes ?? ''}} entity-list-item" data-entity-type="{{$type}}" data-entity-id="{{$entity->id}}">
    <span role="presentation" class="icon text-{{$type}}">@icon($type)</span>
    <div class="content">
            <h4 class="entity-list-item-name break-text">{{ $entity->preview_name ?? $entity->name }}</h4>
            {{ $slot ?? '' }}
    </div>
</a>