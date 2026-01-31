{{-- Reviews Section --}}
<div class="mt-xl">
    <h2>{{ trans('entities.book_review') }}</h2>

    {{-- Review Submission Form --}}
    @if (!user()->isGuest() && userCan('review-create-all'))
        <form method="POST" action="{{$bookclub ? $bookclub->getUrl() . '/books/' . $book->slug . '/reviews' : $book->getUrl('/reviews') }}">
            @csrf
            <input type="number" hidden name = "review_id" value="{{$review->id ?? 0}}">
            <textarea name="review"  style="width:100%; min-height: 100px" class="input-base w-full" placeholder="{{ trans('entities.write_review') }}">{{$review->review ?? ''}}</textarea>
            <button type="submit" class="button primary mt-s">{{ $review ? trans('common.update') : trans('entities.submit_review') }}</button>
        </form>
    @else
        <p class="text-muted">{{ trans('entities.login_to_review') }}</p>
    @endif

    {{-- Display Reviews --}}
    <div class="mt-m">
        @foreach ($reviews as $review)
            @if(user()->id == 1 || $review->approved == 1)
                <div class="card p-m mb-m">
                    <div class="flex-container-row items-center">
                        <img class="avatar med mr-s" width="40" height="40" src="{{ $review->user->getAvatar(40) }}" alt="{{ $review->user->name }}">
                        <div class="flex items-center">
                            <strong>{{ $review->user->name }}</strong><br>
                            {{ $review->user->email }} <!-- Gmail under the name -->
                        </div>
                        <div class="text-right">
                            @if (user()->id == 1 || user()->id == $review->user->id)
                            <a href="{{$bookclub ? $bookclub->getUrl() . '/books/' . $book->slug . '?review_id='. $review->id : $book->getUrl().'?review_id='.$review->id }}" class="button outline my-none">
                                {{ trans('common.edit')}}
                            </a>
                            @endif
                            @if (user()->id == 1 || user()->id == $review->user->id)
                                <a href="{{ $book->getUrl("review/delete?review_id={$review->id}") }}" class="button outline my-none">
                                    {{ trans('common.delete')}}
                                </a>
                            @endif
                            @if (user()->id == 1)
                                @if($review->approved == 0)
                                    <a href="{{ $book->getUrl("review/approve?review_id={$review->id}") }}" class="button outline my-none">
                                        {{ trans('common.approve')}}
                                    </a>
                                @else
                                    <a href="{{ $book->getUrl("review/disapprove?review_id={$review->id}") }}" class="button outline my-none">
                                        {{ trans('common.disapprove')}}
                                    </a>

                                @endif
                            @endif
                        </div>
                    </div>
                    <span class="text-muted">({{ $review->created_at->diffForHumans() }})</span>
                    <p>{{ $review->review }}</p>
                </div>
            @endif
        @endforeach
    </div>
</div>
