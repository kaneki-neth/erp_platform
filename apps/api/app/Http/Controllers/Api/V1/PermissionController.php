<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class PermissionController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $permissions = Permission::all();

        return $this->success($permissions, 'Permissions retrieved successfully.');
    }
}
