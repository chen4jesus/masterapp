<?php $type = $entity->getType(); ?>
<a href="{{ $bookclub->getUrl() }}/books/{{ $entity->slug }}/page/{{ $page->slug}}" class="{{$type}} {{$type === 'page' && $entity->draft ? 'draft' : ''}} {{$classes ?? ''}} entity-list-item" data-entity-type="{{$type}}" data-entity-id="{{$entity->id}}">
    <span role="presentation" class="icon text-{{$type}}">@icon($type)</span>
    <div class="content">
            <h4 class="entity-list-item-name break-text">{{ $entity->preview_name ?? $entity->name }}</h4>
            <div class="entity-item-snippet">
                <p class="text-muted break-text">{{ $page->getExcerpt() }}</p>
            </div>
    </div>
</a>