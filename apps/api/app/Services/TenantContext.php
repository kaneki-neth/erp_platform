<?php

namespace App\Services;

use App\Models\Organization;

class TenantContext
{
    private static ?Organization $tenant = null;

    public static function setTenant(?Organization $tenant): void
    {
        self::$tenant = $tenant;
    }

    public static function getTenant(): ?Organization
    {
        return self::$tenant;
    }

    public static function getTenantId(): ?int
    {
        return self::$tenant?->id;
    }

    public static function clear(): void
    {
        self::$tenant = null;
    }
}
