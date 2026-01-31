<div class="flex-container-row item-list-row items-center wrap py-xs">
    <div class="px-m py-xs flex-container-row items-center flex-2 gap-l min-width-m">
        <img class="avatar med" width="40" height="40" src="{{ $user->getAvatar(40)}}" alt="{{ $user->name }}">
        <span>
            {{ $user->name }}
            <br>
            <span class="text-muted">{{ $user->email }}</span>
            @if($user->mfa_values_count > 0)
                <span title="MFA Configured" class="text-pos">@icon('lock')</span>
            @endif
        </span>
    </div>
    <div class="flex-container-row items-center flex-3 min-width-m">
        <div class="px-m py-xs flex">
            
        </div>
        <div class="px-m py-xs flex text-right text-muted">
            @if($user->last_activity_at)
                <small>{{ trans('settings.users_latest_activity') }}</small>
                <br>
                <small title="{{ $user->last_activity_at->format('Y-m-d H:i:s') }}">{{ $user->last_activity_at->diffForHumans() }}</small>
            @endif
        </div>
    </div>
</div>