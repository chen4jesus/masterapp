@extends('layouts.simple')

@section('body')

    <div class="container small">

        <div class="my-s">
            @include('entities.breadcrumbs', ['crumbs' => [
                $bookclub,
                $bookclub->getUrl('/leave') => [
                    'text' => trans('entities.club_leave'),
                    'icon' => 'logout',
                ]
            ]])
        </div>

        <div class="card content-wrap auto-height">
            <h1 class="list-heading">{{ trans('entities.club_leave') }}</h1>
            <p>{{ trans('entities.club_leave_explain', ['name' => $bookclub->name]) }}</p>

            <div class="grid half">
                <p class="text-pos">
                    <strong>{{ trans('entities.club_leave_confirmation') }}</strong>
                </p>

                <form action="{{ $bookclub->getUrl('/leave') }}" method="POST" class="text-right">
                    {!! csrf_field() !!}
                    <input type="hidden" name="_method" value="GET">

                    <a href="{{ $bookclub->getUrl() }}" class="button outline">{{ trans('common.cancel') }}</a>
                    <button type="submit" class="button">{{ trans('common.confirm') }}</button>
                </form>
            </div>
        </div>
    </div>

@stop