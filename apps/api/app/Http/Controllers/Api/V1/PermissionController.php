<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('permissions.view') && ! $authUser->hasPermission('roles.view') && ! $authUser->hasPermission('roles.manage')) {
            return $this->error('Unauthorized to view permissions.', 403);
        }

        $query = Permission::query();

        if ($moduleKey = $request->input('module_key')) {
            $query->where('module_key', $moduleKey);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $permissions = $query->orderBy('module_key', 'asc')->orderBy('slug', 'asc')->get();

        if ($request->boolean('grouped')) {
            $permissions = $permissions->groupBy('module_key');
        }

        return $this->success($permissions, 'Permissions retrieved successfully.');
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('permissions.view') && ! $authUser->hasPermission('roles.view') && ! $authUser->hasPermission('roles.manage')) {
            return $this->error('Unauthorized to view permissions.', 403);
        }

        $permission = Permission::find($id);
        if (! $permission) {
            return $this->error('Permission not found.', 404);
        }

        return $this->success($permission, 'Permission details retrieved successfully.');
    }
}

