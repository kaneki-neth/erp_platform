<?php

namespace App\Http\Middleware;

use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            $requestedOrgId = $request->header('X-Organization-Id') ?? $request->header('X-Tenant-Id');

            if ($requestedOrgId) {
                $org = \App\Models\Organization::find($requestedOrgId);

                if (! $org) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Requested organization not found.',
                        'data' => null,
                        'errors' => null,
                    ], 404);
                }

                // Verify access: platform owner or active membership
                $hasAccess = $user->is_owner || 
                    ($user->organization_id == $org->id) ||
                    $user->memberships()->where('organization_id', $org->id)->where('status', 'active')->exists();

                if (! $hasAccess) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized access to this organization.',
                        'data' => null,
                        'errors' => null,
                    ], 403);
                }

                TenantContext::setTenant($org);
            } else {
                // Default tenant context from user's primary organization or first active membership
                $org = $user->organization;

                if (! $org && $user->memberships()->exists()) {
                    $firstMembership = $user->memberships()->with('organization')->where('status', 'active')->first();
                    $org = $firstMembership?->organization;
                }

                TenantContext::setTenant($org);
            }
        }

        return $next($request);
    }
}
