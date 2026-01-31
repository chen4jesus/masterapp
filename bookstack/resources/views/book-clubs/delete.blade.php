@extends('layouts.simple')

@section('body')

    <div class="container small">

        <div class="my-s">
            @include('entities.breadcrumbs', ['crumbs' => [
                $bookclub,
                $bookclub->getUrl('/delete') => [
                    'text' => trans('entities.club_delete'),
                    'icon' => 'delete',
                ]
            ]])
        </div>

        <div class="card content-wrap auto-height">
            <h1 class="list-heading">{{ trans('entities.club_delete') }}</h1>
            <p>{{ trans('entities.club_delete_explain', ['name' => $bookclub->name]) }}</p>

            <div class="grid half">
                <p class="text-neg">
                    <strong>{{ trans('entities.club_delete_confirmation') }}</strong>
                </p>

                <form action="{{ $bookclub->getUrl() }}" method="POST" class="text-right">
                    {!! csrf_field() !!}
                    <input type="hidden" name="_method" value="DELETE">

                    <a href="{{ $bookclub->getUrl() }}" class="button outline">{{ trans('common.cancel') }}</a>
                    <button type="submit" class="button">{{ trans('common.confirm') }}</button>
                </form>
            </div>
        </div>
    </div>

@stop