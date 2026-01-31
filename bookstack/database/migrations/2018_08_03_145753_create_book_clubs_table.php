<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {

        // Convert the existing entity tables to InnoDB.
        // Wrapped in try-catch just in the event a different database system is used
        // which does not support InnoDB but does support all required features
        // like foreign key references.
        try {
            $prefix = DB::getTablePrefix();
            DB::statement("ALTER TABLE {$prefix}users ENGINE = InnoDB;");
            DB::statement("ALTER TABLE {$prefix}books ENGINE = InnoDB;");
        } catch (Exception $exception) {
        }

        // Here we have table drops before the creations due to upgrade issues
        // people were having due to the book_clubs_books table creation failing.
        if (Schema::hasTable('book_clubs_users')) {
            Schema::drop('book_clubs_users');
        }

        if (Schema::hasTable('book_clubs_books')) {
            Schema::drop('book_clubs_books');
        }

        if (Schema::hasTable('book_clubs')) {
            Schema::drop('book_clubs');
        }

        Schema::create('book_clubs', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 180);
            $table->string('slug', 180);
            $table->text('description');
            $table->integer('created_by')->nullable()->default(null);
            $table->integer('updated_by')->nullable()->default(null);
            $table->boolean('restricted')->default(false);
            $table->integer('image_id')->nullable()->default(null);
            $table->string('club_type', 20);
            $table->timestamps();

            $table->index('slug');
            $table->index('created_by');
            $table->index('updated_by');
            $table->index('restricted');
        });

        Schema::create('book_clubs_books', function (Blueprint $table) {
            $table->integer('book_clubs_id')->unsigned();
            $table->integer('book_id')->unsigned();
            $table->integer('order')->unsigned();

            $table->primary(['book_clubs_id', 'book_id']);

            $table->foreign('book_clubs_id')->references('id')->on('book_clubs')
                ->onUpdate('cascade')->onDelete('cascade');
            $table->foreign('book_id')->references('id')->on('books')
                ->onUpdate('cascade')->onDelete('cascade');
        });
        Schema::create('book_clubs_users', function (Blueprint $table) {
            $table->integer('book_clubs_id')->unsigned();
            $table->integer('user_id')->unsigned();
            $table->integer('order')->unsigned();

            $table->primary(['book_clubs_id', 'user_id']);

            $table->foreign('book_clubs_id')->references('id')->on('book_clubs')
                ->onUpdate('cascade')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')
                ->onUpdate('cascade')->onDelete('cascade');
        });

        // Delete old bookshelf permissions
        // Needed to to issues upon upgrade.
        DB::table('role_permissions')->where('name', 'like', 'bookclub-%')->delete();

        // Copy existing role permissions from Books
        $ops = ['View All', 'View Own', 'Create All', 'Create Own', 'Update All', 'Update Own', 'Delete All', 'Delete Own'];
        foreach ($ops as $op) {
            $dbOpName = strtolower(str_replace(' ', '-', $op));
            $roleIdsWithBookPermission = DB::table('role_permissions')
                ->leftJoin('permission_role', 'role_permissions.id', '=', 'permission_role.permission_id')
                ->leftJoin('roles', 'roles.id', '=', 'permission_role.role_id')
                ->where('role_permissions.name', '=', 'book-' . $dbOpName)->get(['roles.id'])->pluck('id');

            $permId = DB::table('role_permissions')->insertGetId([
                'name'         => 'bookclub-' . $dbOpName,
                'display_name' => $op . ' ' . 'Book Club',
                'created_at'   => Carbon::now()->toDateTimeString(),
                'updated_at'   => Carbon::now()->toDateTimeString(),
            ]);

            $rowsToInsert = $roleIdsWithBookPermission->filter(function ($roleId) {
                return !is_null($roleId);
            })->map(function ($roleId) use ($permId) {
                return [
                    'role_id'       => $roleId,
                    'permission_id' => $permId,
                ];
            })->toArray();

            // Assign view permission to all current roles
            DB::table('permission_role')->insert($rowsToInsert);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop created permissions
        $ops = ['bookclub-create-all', 'bookclub-join-all', 'bookclub-join-own', 'bookclub-create-own', 'bookclub-delete-all', 'bookclub-delete-own', 'bookclub-update-all', 'bookclub-update-own', 'bookclub-view-all', 'bookclub-view-own'];

        $permissionIds = DB::table('role_permissions')->whereIn('name', $ops)
            ->get(['id'])->pluck('id')->toArray();
        DB::table('permission_role')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('role_permissions')->whereIn('id', $permissionIds)->delete();

        // Drop shelves table
        Schema::dropIfExists('book_clubs_books');
        Schema::dropIfExists('book_clubs_users');
        Schema::dropIfExists('book_clubs');

        // Drop related polymorphic items
        DB::table('activities')->where('entity_type', '=', 'BookStack\Entities\Models\BookClub')->delete();
        DB::table('views')->where('viewable_type', '=', 'BookStack\Entities\Models\BookClub')->delete();
        DB::table('entity_permissions')->where('restrictable_type', '=', 'BookStack\Entities\Models\BookClub')->delete();
        DB::table('tags')->where('entity_type', '=', 'BookStack\Entities\Models\BookClub')->delete();
        DB::table('search_terms')->where('entity_type', '=', 'BookStack\Entities\Models\BookClub')->delete();
        DB::table('comments')->where('entity_type', '=', 'BookStack\Entities\Models\BookClub')->delete();
    }
};
