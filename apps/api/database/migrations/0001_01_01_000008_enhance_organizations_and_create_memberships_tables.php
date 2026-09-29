<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Enhance organizations table
        Schema::table('organizations', function (Blueprint $table) {
            $table->string('legal_name')->nullable()->after('name');
            $table->string('code')->nullable()->unique()->after('slug');
            $table->text('description')->nullable()->after('code');
            $table->string('email')->nullable()->after('domain');
            $table->string('phone')->nullable()->after('email');
            $table->string('website')->nullable()->after('phone');
            $table->text('address')->nullable()->after('website');
            $table->string('timezone')->default('UTC')->after('address');
            $table->string('locale')->default('en')->after('timezone');
            $table->string('currency', 10)->default('USD')->after('locale');
        });

        // 2. Create organization_memberships table
        Schema::create('organization_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('role_id')->nullable()->constrained('roles')->nullOnDelete();
            $table->string('status')->default('active'); // active, invited, suspended, removed
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'organization_id']);
        });

        // 3. Create organization_invitations table
        Schema::create('organization_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('invited_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('role_id')->nullable()->constrained('roles')->nullOnDelete();
            $table->string('email');
            $table->string('token', 64)->unique();
            $table->string('status')->default('pending'); // pending, accepted, expired, cancelled
            $table->dateTime('expires_at');
            $table->dateTime('accepted_at')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'email', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_invitations');
        Schema::dropIfExists('organization_memberships');

        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn([
                'legal_name',
                'code',
                'description',
                'email',
                'phone',
                'website',
                'address',
                'timezone',
                'locale',
                'currency',
            ]);
        });
    }
};
