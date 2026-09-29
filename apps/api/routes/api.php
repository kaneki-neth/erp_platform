<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ModuleController;
use App\Http\Controllers\Api\V1\OrganizationController;
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
    // Public authentication routes
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login']);
    });

    // Protected API routes
    Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
        // Auth management
        Route::prefix('auth')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });

        // Organization profile
        Route::prefix('organizations')->group(function () {
            Route::get('current', [OrganizationController::class, 'current']);
            Route::patch('current', [OrganizationController::class, 'update']);
        });

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
