<?php
    $type = $entity->getType();
    $entityUrl = $entity->getUrl();

    // If it's a Book inside a Book Club, adjust the URL
    if ($bookclub) {
        if ($type === 'book') {
            $entityUrl = url("/book-clubs/{$bookclub->slug}/books/{$entity->slug}");
        } elseif ($type === 'chapter') {
            $entityUrl = url("/book-clubs/{$bookclub->slug}/books/{$book->slug}/chapters/{$entity->slug}");
        } elseif ($type === 'page') {
            $entityUrl = url("/book-clubs/{$bookclub->slug}/books/{$book->slug}/page/{$entity->slug}");
        }
    }
?>

<a href="{{ $entityUrl }}" class="{{ $type }} {{ $type === 'page' && $entity->draft ? 'draft' : '' }} {{ $classes ?? '' }} entity-list-item" data-entity-type="{{ $type }}" data-entity-id="{{ $entity->id }}">

    <span role="presentation" class="icon text-{{$type}}">@icon($type)</span>
    <div class="content">
        <h4 class="entity-list-item-name break-text">{{ $entity->preview_name ?? $entity->name }}</h4>
        {{ $slot ?? '' }}
    </div>
</a>
