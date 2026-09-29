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
            ['slug' => 'organizations.view', 'name' => 'View Organization', 'module_key' => 'core', 'description' => 'View organization profile and directory'],
            ['slug' => 'organizations.create', 'name' => 'Create Organization', 'module_key' => 'core', 'description' => 'Create new tenant organizations'],
            ['slug' => 'organizations.update', 'name' => 'Update Organization', 'module_key' => 'core', 'description' => 'Modify organization profile and details'],
            ['slug' => 'organizations.delete', 'name' => 'Delete Organization', 'module_key' => 'core', 'description' => 'Remove or deactivate tenant organizations'],
            ['slug' => 'organizations.manage', 'name' => 'Manage Organizations', 'module_key' => 'core', 'description' => 'Full administrative control over tenant organizations and statuses'],

            // Organization Members
            ['slug' => 'organizations.members.view', 'name' => 'View Members', 'module_key' => 'core', 'description' => 'View organization member roster'],
            ['slug' => 'organizations.members.create', 'name' => 'Add Members', 'module_key' => 'core', 'description' => 'Add or invite members to organization'],
            ['slug' => 'organizations.members.update', 'name' => 'Update Members', 'module_key' => 'core', 'description' => 'Modify member status and role assignments'],
            ['slug' => 'organizations.members.delete', 'name' => 'Remove Members', 'module_key' => 'core', 'description' => 'Remove members from organization'],

            // Organization Settings
            ['slug' => 'organizations.settings.view', 'name' => 'View Settings', 'module_key' => 'core', 'description' => 'View organization configuration and preferences'],
            ['slug' => 'organizations.settings.update', 'name' => 'Update Settings', 'module_key' => 'core', 'description' => 'Modify organization localization and settings'],

            // Organization Invitations
            ['slug' => 'organizations.invitations.view', 'name' => 'View Invitations', 'module_key' => 'core', 'description' => 'View pending member invitations'],
            ['slug' => 'organizations.invitations.create', 'name' => 'Create Invitations', 'module_key' => 'core', 'description' => 'Generate member invitation links'],
            ['slug' => 'organizations.invitations.cancel', 'name' => 'Cancel Invitations', 'module_key' => 'core', 'description' => 'Revoke pending invitations'],

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
                'legal_name' => 'Acme Retail Enterprises Inc.',
                'code' => 'ACM-001',
                'description' => 'Flagship multi-store retail chain with omnichannel operations.',
                'domain' => 'acme.local',
                'email' => 'info@acmeretail.com',
                'phone' => '+1 (555) 234-5678',
                'website' => 'https://acmeretail.example.com',
                'address' => '100 Enterprise Way, Suite 400, New York, NY 10001',
                'status' => 'active',
                'timezone' => 'America/New_York',
                'locale' => 'en',
                'currency' => 'USD',
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
            $permissionModels['organizations.members.view']->id,
            $permissionModels['organizations.settings.view']->id,
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

        // Acme Memberships
        \App\Models\OrganizationMembership::updateOrCreate(
            ['user_id' => $acmeOwner->id, 'organization_id' => $orgAcme->id],
            ['role_id' => $acmeAdminRole->id, 'status' => 'active', 'joined_at' => now()]
        );
        \App\Models\OrganizationMembership::updateOrCreate(
            ['user_id' => $acmeStaff->id, 'organization_id' => $orgAcme->id],
            ['role_id' => $acmeStaffRole->id, 'status' => 'active', 'joined_at' => now()]
        );

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
                'legal_name' => 'Global Dynamics International Ltd.',
                'code' => 'GLB-001',
                'description' => 'European supply chain and consulting holding firm.',
                'domain' => 'global.local',
                'email' => 'contact@globaldynamics.example.com',
                'phone' => '+44 20 7946 0912',
                'website' => 'https://globaldynamics.example.com',
                'address' => '25 Bank Street, Canary Wharf, London E14 5JP',
                'status' => 'active',
                'timezone' => 'Europe/London',
                'locale' => 'en',
                'currency' => 'EUR',
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

        // Global Memberships
        \App\Models\OrganizationMembership::updateOrCreate(
            ['user_id' => $globalOwner->id, 'organization_id' => $orgGlobal->id],
            ['role_id' => $globalAdminRole->id, 'status' => 'active', 'joined_at' => now()]
        );

        // Multi-tenant membership: Acme Administrator is also an Auditor in Global Dynamics
        \App\Models\OrganizationMembership::updateOrCreate(
            ['user_id' => $acmeOwner->id, 'organization_id' => $orgGlobal->id],
            ['role_id' => $globalAdminRole->id, 'status' => 'active', 'joined_at' => now()]
        );

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
