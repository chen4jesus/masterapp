@extends('layouts.simple')

@section('body')

    <div class="container small">

        <div class="my-s">
            @include('entities.breadcrumbs', ['crumbs' => [
                $bookclub,
                $bookclub->getUrl('/join') => [
                    'text' => trans('entities.club_join'),
                    'icon' => 'editor/direction-ltr',
                ]
            ]])
        </div>

        <div class="card content-wrap auto-height">
            <h1 class="list-heading">{{ trans('entities.club_join') }}</h1>
            <p>{{ trans('entities.club_join_explain', ['name' => $bookclub->name]) }}</p>

            <div class="grid half">
                <p class="text-pos">
                    <strong>{{ trans('entities.club_join_confirmation') }}</strong>
                </p>

                <form action="{{ $bookclub->getUrl('/join') }}" method="POST" class="text-right">
                    {!! csrf_field() !!}
                    <input type="hidden" name="_method" value="GET">

                    <a href="{{url('/book-clubs')}}" class="button outline">{{ trans('common.cancel') }}</a>
                    <button type="submit" class="button">{{ trans('common.confirm') }}</button>
                </form>
            </div>
        </div>
    </div>

@stop