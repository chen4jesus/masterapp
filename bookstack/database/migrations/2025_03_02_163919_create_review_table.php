<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

use Carbon\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('review', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('user_id');
            $table->string('bookclub_slug');
            $table->string('book_slug');
            $table->boolean('approved');
            $table->text('review');
            $table->timestamps();
        });
        $adminRoleId = DB::table('roles')->where('system_name', '=', 'admin')->first()->id;

        $ops = ['Create All', 'Create Own', 'View All', 'View Own','Update All', 'Update Own', 'Delete All', 'Delete Own'];

        $entity = 'Review';
        foreach ($ops as $op) {
            $permissionId = DB::table('role_permissions')->insertGetId([
                'name'    => strtolower($entity) . '-' . strtolower(str_replace(' ', '-', $op)),
                'display_name' => $op . ' ' . $entity . 's',
                'created_at' => Carbon::now()->toDateTimeString(),
                'updated_at' => Carbon::now()->toDateTimeString(),
            ]);
            DB::table('permission_role')->insert([
                'role_id'  => $adminRoleId,
                'permission_id'  => $permissionId,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('review');

        $ops = ['Create All', 'Create Own', 'View All', 'View Own', 'Update All', 'Update Own', 'Delete All', 'Delete Own'];
        $entity = 'Review';
        foreach ($ops as $op) {
            $permName = strtolower($entity) . '-' . strtolower(str_replace(' ', '-', $op));
            DB::table('role_permissions')->where('name', '=', $permName)->delete();
        }
    }
};
