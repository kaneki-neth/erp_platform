<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ModuleController;
use App\Http\Controllers\Api\V1\OrganizationController;
use App\Http\Controllers\Api\V1\OrganizationInvitationController;
use App\Http\Controllers\Api\V1\OrganizationMemberController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API V1 Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Public routes
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login']);
    });

    Route::get('invitations/{token}', [OrganizationInvitationController::class, 'show']);

    // Protected API routes
    Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
        // Auth management
        Route::prefix('auth')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });

        // Organization Management & Context Switching
        Route::prefix('organizations')->group(function () {
            Route::get('current', [OrganizationController::class, 'current']);
            Route::patch('current', [OrganizationController::class, 'update']);
            Route::put('current/settings', [OrganizationController::class, 'updateCurrentSettings']);
            Route::post('switch', [OrganizationController::class, 'switch']);
            Route::get('user-organizations', [OrganizationController::class, 'userOrganizations']);
            Route::patch('{id}/status', [OrganizationController::class, 'updateStatus']);

            // Members
            Route::get('{id}/members', [OrganizationMemberController::class, 'index']);
            Route::post('{id}/members', [OrganizationMemberController::class, 'store']);
            Route::get('{id}/members/{userId}', [OrganizationMemberController::class, 'show']);
            Route::put('{id}/members/{userId}', [OrganizationMemberController::class, 'update']);
            Route::delete('{id}/members/{userId}', [OrganizationMemberController::class, 'destroy']);

            // Invitations
            Route::get('{id}/invitations', [OrganizationInvitationController::class, 'index']);
            Route::post('{id}/invitations', [OrganizationInvitationController::class, 'store']);
            Route::delete('{id}/invitations/{invitationId}', [OrganizationInvitationController::class, 'cancel']);
        });
        Route::apiResource('organizations', OrganizationController::class);

        // Accept Invitation
        Route::post('invitations/{token}/accept', [OrganizationInvitationController::class, 'accept']);

        // Users CRUD & User-Role Assignments
        Route::get('users/{id}/roles', [UserController::class, 'getRoles']);
        Route::put('users/{id}/roles', [UserController::class, 'syncRoles']);
        Route::apiResource('users', UserController::class);

        // Roles CRUD & Role-Permission Assignments
        Route::get('roles/{id}/permissions', [RoleController::class, 'getPermissions']);
        Route::put('roles/{id}/permissions', [RoleController::class, 'syncPermissions']);
        Route::apiResource('roles', RoleController::class);

        // Permissions
        Route::apiResource('permissions', PermissionController::class)->only(['index', 'show']);

        // Module Management
        Route::prefix('modules')->group(function () {
            Route::get('/', [ModuleController::class, 'index']);
            Route::post('{key}/toggle', [ModuleController::class, 'toggle']);
        });
    });
});

