<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, BelongsToTenant;

    protected $fillable = [
        'organization_id',
        'name',
        'email',
        'password',
        'is_owner',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_owner' => 'boolean',
        ];
    }

    public function memberships(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(OrganizationMembership::class);
    }

    public function organizations(): BelongsToMany
    {
        return $this->belongsToMany(Organization::class, 'organization_memberships')
            ->withPivot('role_id', 'status', 'joined_at')
            ->withTimestamps();
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user');
    }

    public function getActiveOrganizations()
    {
        return $this->organizations()->wherePivot('status', 'active')->get();
    }

    public function hasPermission(string $permissionSlug, ?int $organizationId = null): bool
    {
        if ($this->is_owner) {
            return true;
        }

        $orgId = $organizationId ?? \App\Services\TenantContext::getTenantId() ?? $this->organization_id;

        // Check if user has permission through organization roles
        return $this->roles()
            ->where(function ($query) use ($orgId) {
                $query->where('roles.organization_id', $orgId)
                    ->orWhereNull('roles.organization_id');
            })
            ->whereHas('permissions', function ($query) use ($permissionSlug) {
                $query->where('slug', $permissionSlug);
            })
            ->exists();
    }
}
