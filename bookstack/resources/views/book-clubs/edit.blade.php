@extends('layouts.simple')

@section('body')

    <div class="container small">

        <div class="my-s">
            @include('entities.breadcrumbs', ['crumbs' => [
                $bookclub,
                $bookclub->getUrl('/edit') => [
                    'text' => trans('entities.club_edit'),
                    'icon' => 'edit',
                ]
            ]])
        </div>

        <main class="card content-wrap">
            <h1 class="list-heading">{{ trans('entities.club_edit') }}</h1>
            <form action="{{ $bookclub->getUrl() }}" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="_method" value="PUT">
                @include('book-clubs.parts.form', ['model' => $bookclub])
            </form>
        </main>
    </div>

@stop