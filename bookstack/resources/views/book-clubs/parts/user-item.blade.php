<li data-id="{{ $user->id }}"
     data-email="{{ $user->email }}"
     data-created="{{ $user->created_at->timestamp }}"
     data-updated="{{ $user->updated_at->timestamp }}"
     class="scroll-box-item">
    <div class="handle px-s">@icon('grip')</div>
    <div class="text-user">@icon('user'){{ $user->email }}</div>
    <div class="buttons flex-container-row items-center ml-auto px-xxs py-xs">
        <button type="button" data-action="move_up" class="icon-button p-xxs"
                title="{{ trans('entities.books_sort_move_up') }}">@icon('chevron-up')</button>
        <button type="button" data-action="move_down" class="icon-button p-xxs"
                title="{{ trans('entities.books_sort_move_down') }}">@icon('chevron-down')</button>
        <button type="button" data-action="remove" class="icon-button p-xxs"
                title="{{ trans('common.remove') }}">@icon('remove')</button>
        <button type="button" data-action="add" class="icon-button p-xxs"
                title="{{ trans('common.add') }}">@icon('add-small')</button>
    </div>
</li>