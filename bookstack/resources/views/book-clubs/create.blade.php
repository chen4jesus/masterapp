@extends('layouts.simple')

@section('body')

    <div class="container small">

        <div class="my-s">
            @include('entities.breadcrumbs', ['crumbs' => [
                '/book-clubs' => [
                    'text' => trans('entities.book_clubs'),
                    'icon' => 'bookshelf',
                ],
                '/create-book-club' => [
                    'text' => trans('entities.book_club_create'),
                    'icon' => 'add',
                ]
            ]])
        </div>

        <main class="card content-wrap">
            <h1 class="list-heading">{{ trans('entities.book_club_create') }}</h1>
            <form action="{{ url("/book-clubs") }}" method="POST" enctype="multipart/form-data">
                @include('book-clubs.parts.form', ['bookclub' => null, 'books' => $books, 'users' => $users])
            </form>
        </main>

    </div>

@stop