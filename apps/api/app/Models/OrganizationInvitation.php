<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationInvitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'invited_by_user_id',
        'role_id',
        'email',
        'token',
        'status',
        'expires_at',
        'accepted_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by_user_id');
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isPending(): bool
    {
        return $this->status === 'pending' && ! $this->isExpired();
    }

    public function accept(User $user): OrganizationMembership
    {
        $this->update([
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);

        $membership = OrganizationMembership::updateOrCreate(
            [
                'user_id' => $user->id,
                'organization_id' => $this->organization_id,
            ],
            [
                'role_id' => $this->role_id,
                'status' => 'active',
                'joined_at' => now(),
            ]
        );

        // Also associate user role if specified
        if ($this->role_id) {
            $user->roles()->syncWithoutDetaching([$this->role_id]);
        }

        return $membership;
    }
}
