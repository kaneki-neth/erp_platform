<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\Organization;
use App\Models\OrganizationModule;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PlatformSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Core & Available Modules
        $modules = [
            [
                'key' => 'pos',
                'name' => 'Point of Sale (POS)',
                'description' => 'Fast retail cashier checkout, offline register sync, barcode scanning, receipt printing.',
                'is_core' => false,
                'status' => 'available',
            ],
            [
                'key' => 'inventory',
                'name' => 'Inventory Management',
                'description' => 'Stock tracking, multi-warehouse management, low-stock alerts, movement event logging.',
                'is_core' => false,
                'status' => 'available',
            ],
            [
                'key' => 'purchasing',
                'name' => 'Purchasing & Procurement',
                'description' => 'Purchase orders, supplier bills, receiving workflows, automated restock calculations.',
                'is_core' => false,
                'status' => 'available',
            ],
            [
                'key' => 'crm',
                'name' => 'CRM & Customer Loyalty',
                'description' => 'Customer profiles, purchase history, reward points, contact segmentation.',
                'is_core' => false,
                'status' => 'available',
            ],
            [
                'key' => 'accounting',
                'name' => 'Accounting & Finance',
                'description' => 'General ledger, charts of accounts, financial reports, tax rate management.',
                'is_core' => false,
                'status' => 'available',
            ],
            [
                'key' => 'hr',
                'name' => 'HR & Employee Management',
                'description' => 'Staff rosters, shift scheduling, commission tracking, timesheets.',
                'is_core' => false,
                'status' => 'available',
            ],
            [
                'key' => 'rentals',
                'name' => 'Equipment & Vehicle Rental',
                'description' => 'Booking calendar, security deposit tracking, return inspections, overdue alerts.',
                'is_core' => false,
                'status' => 'coming_soon',
            ],
        ];

        foreach ($modules as $mod) {
            Module::updateOrCreate(['key' => $mod['key']], $mod);
        }

        // 2. Seed System Permissions
        $permissions = [
            // Organizations
            ['slug' => 'organizations.view', 'name' => 'View Organization', 'module_key' => 'core', 'description' => 'View organization profile and settings'],
            ['slug' => 'organizations.update', 'name' => 'Update Organization', 'module_key' => 'core', 'description' => 'Update organization profile and settings'],
            
            // Users
            ['slug' => 'users.view', 'name' => 'View Users', 'module_key' => 'core', 'description' => 'View organization user roster'],
            ['slug' => 'users.create', 'name' => 'Create Users', 'module_key' => 'core', 'description' => 'Invite or create new organization users'],
            ['slug' => 'users.update', 'name' => 'Update Users', 'module_key' => 'core', 'description' => 'Modify organization user permissions & details'],
            ['slug' => 'users.delete', 'name' => 'Delete Users', 'module_key' => 'core', 'description' => 'Remove or deactivate organization users'],
            
            // Roles
            ['slug' => 'roles.view', 'name' => 'View Roles', 'module_key' => 'core', 'description' => 'View available access roles'],
            ['slug' => 'roles.create', 'name' => 'Create Roles', 'module_key' => 'core', 'description' => 'Create new organization roles'],
            ['slug' => 'roles.update', 'name' => 'Update Roles', 'module_key' => 'core', 'description' => 'Modify role details and permissions'],
            ['slug' => 'roles.delete', 'name' => 'Delete Roles', 'module_key' => 'core', 'description' => 'Remove custom organization roles'],
            ['slug' => 'roles.manage', 'name' => 'Manage Roles', 'module_key' => 'core', 'description' => 'Full control over role permissions and assignments'],

            // Permissions
            ['slug' => 'permissions.view', 'name' => 'View Permissions', 'module_key' => 'core', 'description' => 'View available platform permissions list'],

            // Modules
            ['slug' => 'modules.view', 'name' => 'View Modules', 'module_key' => 'core', 'description' => 'View enabled organization modules'],
            ['slug' => 'modules.manage', 'name' => 'Manage Modules', 'module_key' => 'core', 'description' => 'Enable or disable organization business modules'],
        ];

        $permissionModels = [];
        foreach ($permissions as $perm) {
            $permissionModels[$perm['slug']] = Permission::updateOrCreate(['slug' => $perm['slug']], $perm);
        }

        // 3. Demo Organization A: Acme Retail Solutions
        $orgAcme = Organization::updateOrCreate(
            ['slug' => 'acme'],
            [
                'name' => 'Acme Retail Solutions',
                'domain' => 'acme.local',
                'status' => 'active',
                'settings' => [
                    'currency' => 'USD',
                    'timezone' => 'America/New_York',
                    'tax_rate' => 8.5,
                ],
            ]
        );

        // Acme Roles
        $acmeAdminRole = Role::updateOrCreate(
            ['organization_id' => $orgAcme->id, 'slug' => 'admin'],
            [
                'name' => 'Administrator',
                'description' => 'Full administrative access to organization resources',
                'is_system' => true,
            ]
        );
        $acmeAdminRole->permissions()->sync(array_values(array_map(fn ($p) => $p->id, $permissionModels)));

        $acmeStaffRole = Role::updateOrCreate(
            ['organization_id' => $orgAcme->id, 'slug' => 'staff'],
            [
                'name' => 'Staff Member',
                'description' => 'General operational access without admin configuration rights',
                'is_system' => false,
            ]
        );
        $acmeStaffRole->permissions()->sync([
            $permissionModels['users.view']->id,
            $permissionModels['modules.view']->id,
        ]);

        // Acme Users
        $acmeOwner = User::withoutGlobalScopes()->updateOrCreate(
            ['organization_id' => $orgAcme->id, 'email' => 'admin@acme.com'],
            [
                'name' => 'Acme Administrator',
                'password' => Hash::make('password'),
                'is_owner' => true,
                'status' => 'active',
            ]
        );
        $acmeOwner->roles()->sync([$acmeAdminRole->id]);

        $acmeStaff = User::withoutGlobalScopes()->updateOrCreate(
            ['organization_id' => $orgAcme->id, 'email' => 'staff@acme.com'],
            [
                'name' => 'Sarah Connor',
                'password' => Hash::make('password'),
                'is_owner' => false,
                'status' => 'active',
            ]
        );
        $acmeStaff->roles()->sync([$acmeStaffRole->id]);

        // Acme Enabled Modules (POS, Inventory, Purchasing)
        foreach (['pos', 'inventory', 'purchasing'] as $key) {
            $mod = Module::where('key', $key)->first();
            if ($mod) {
                OrganizationModule::updateOrCreate(
                    ['organization_id' => $orgAcme->id, 'module_id' => $mod->id],
                    ['is_enabled' => true, 'settings' => ['enabled_at' => now()->toIso8601String()]]
                );
            }
        }

        // 4. Demo Organization B: Global Dynamics Corp (Tenant Isolation Demo)
        $orgGlobal = Organization::updateOrCreate(
            ['slug' => 'global'],
            [
                'name' => 'Global Dynamics Corp',
                'domain' => 'global.local',
                'status' => 'active',
                'settings' => [
                    'currency' => 'EUR',
                    'timezone' => 'Europe/London',
                ],
            ]
        );

        $globalAdminRole = Role::updateOrCreate(
            ['organization_id' => $orgGlobal->id, 'slug' => 'admin'],
            [
                'name' => 'Administrator',
                'description' => 'Full administrative access',
                'is_system' => true,
            ]
        );
        $globalAdminRole->permissions()->sync(array_values(array_map(fn ($p) => $p->id, $permissionModels)));

        $globalOwner = User::withoutGlobalScopes()->updateOrCreate(
            ['organization_id' => $orgGlobal->id, 'email' => 'admin@global.com'],
            [
                'name' => 'Global Corp Director',
                'password' => Hash::make('password'),
                'is_owner' => true,
                'status' => 'active',
            ]
        );
        $globalOwner->roles()->sync([$globalAdminRole->id]);

        // Global Enabled Modules (CRM, Accounting)
        foreach (['crm', 'accounting'] as $key) {
            $mod = Module::where('key', $key)->first();
            if ($mod) {
                OrganizationModule::updateOrCreate(
                    ['organization_id' => $orgGlobal->id, 'module_id' => $mod->id],
                    ['is_enabled' => true, 'settings' => ['enabled_at' => now()->toIso8601String()]]
                );
            }
        }
    }
}
