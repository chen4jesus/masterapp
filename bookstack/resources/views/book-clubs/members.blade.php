@extends('layouts.simple')

@section('body')
    <div class="container small mt-m">
        <main class="card content-wrap">
            <div class="grid half v-center">
                <h1 class="list-heading">{{ trans('settings.members_progress') }}</h1>
                <div class="text-right">
                    <a href="{{ $bookclub->getUrl() }}" class="button outline my-none">{{ trans('entities.return_back') }}</a>
                </div>
            </div>

            <div class="flex-container-row items-center justify-space-between gap-m mt-m mb-l wrap">
                <div>
                    <div class="block inline mr-xs">
                        <form method="get" action="">
                            <input type="text" name="search" placeholder="{{ trans('settings.members_search') }}"
                                value="{{ $listOptions->getSearch() }}">
                        </form>
                    </div>
                </div>
                <div class="justify-flex-end">
                    @include('common.sort', $listOptions->getSortControlData())
                </div>
            </div>

            <table class="table no-scroll">
                <thead>
                    <tr>
                        <th class="user-column">{{ trans('settings.members') }}</th>
                        @if (count($users) > 0 && isset($users[0]->books))
                            @foreach ($users[0]->books as $book)
                                <th class="progress-column">{{ $book->name }}</th>
                            @endforeach
                        @endif
                    </tr>
                </thead>
                <tbody>
                    @foreach ($users as $user)
                        <tr>
                            <td class="user-cell">
                                <img class="avatar small" src="{{ $user->getAvatar(30) }}" alt="{{ $user->name }}">
                                <div class="user-info">
                                    <strong>{{ $user->name }}</strong> <br>
                                    <span class="text-muted small-text">{{ $user->email }}</span>
                                </div>
                            </td>
                            @foreach ($user->books as $book)
                                <td class="progress-cell">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: {{ $book->progress }}%;"></div>
                                    </div>
                                    <div class = "progress-text">
                                        <small class="small-text">{{ $book->progress }}%</small>
                                    </div>
                                </td>
                            @endforeach
                        </tr>
                    @endforeach
                </tbody>
            </table>

        </main>
    </div>

    <style>
        /* Table layout */
        .table {
            text-align:center;
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed; /* Prevents table from expanding */
        }
        .progress-text{
            text-align:center;
        }

        .table th, .table td {
            padding: 6px;
            text-align: center;
            font-size: 14px;
            vertical-align: middle;
            word-wrap: break-word;
        }

        /* Ensure no scrolling */
        .no-scroll {
            max-width: 100%;
            overflow: hidden;
        }

        /* Stretch the username column */
        .user-column {
            width: 30%;
        }

        .progress-column {
            width: 15%; /* Reduce book column size */
            text-align: center!important;
        }

        /* User cell styling */
        .user-cell {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .avatar.small {
            width: 30px;
            height: 30px;
            border-radius: 50%;
        }

        .user-info {
            flex-grow: 1; /* Allows username to take more space */
        }

        /* Progress bar */

        .progress-bar {
            width: 50px; /* Reduce width */
            height: 6px;
            background-color: #ddd;
            border-radius: 3px;
            margin: 0 auto;
        }

        .progress-fill {
            height: 100%;
            background-color: green;
            border-radius: 3px;
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
            .table th, .table td {
                font-size: 11px;
                padding: 2px;
            }

            .user-column {
                width: 30%;
            }

            .progress-column {
                width: 12%;
            }

            .avatar.small {
                width: 25px;
                height: 25px;
            }

            .progress-bar {
                width: 40px; /* Reduce further for small screens */
                height: 5px;
            }
        }
    </style>
@stop
