<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class OrganizationModule extends Pivot
{
    protected $table = 'organization_modules';

    protected $fillable = [
        'organization_id',
        'module_id',
        'is_enabled',
        'settings',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'settings' => 'array',
    ];
}
