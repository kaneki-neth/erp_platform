<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'legal_name',
        'slug',
        'code',
        'description',
        'domain',
        'email',
        'phone',
        'website',
        'address',
        'status',
        'timezone',
        'locale',
        'currency',
        'settings',
    ];

    protected $casts = [
        'settings' => 'array',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(OrganizationMembership::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'organization_memberships')
            ->withPivot('role_id', 'status', 'joined_at')
            ->withTimestamps();
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(OrganizationInvitation::class);
    }

    public function roles(): HasMany
    {
        return $this->hasMany(Role::class);
    }

    public function modules(): BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'organization_modules')
            ->withPivot('is_enabled', 'settings')
            ->withTimestamps();
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }
}

