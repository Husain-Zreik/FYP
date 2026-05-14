<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Reset Spatie's cached roles/permissions so syncs take effect immediately
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $this->syncPermissions();
        $this->syncDefaultRoles();
        $this->createSuperAdmin();
    }

    private function syncPermissions(): void
    {
        $configured = collect(config('permissions'));
        $inDatabase  = Permission::pluck('name');

        // Add permissions that are new in config
        $configured->diff($inDatabase)->each(function (string $name) {
            Permission::create(['name' => $name]);
        });

        // Remove permissions that were deleted from config
        // This also removes them from all roles (default and custom) via cascade
        $inDatabase->diff($configured)->each(function (string $name) {
            Permission::findByName($name)?->delete();
        });
    }

    private function syncDefaultRoles(): void
    {
        $allPermissions = Permission::all();

        foreach (config('roles') as $roleName => $roleConfig) {
            $role = Role::firstOrCreate(['name' => $roleName, 'shelter_id' => null]);

            $permissions = $roleConfig['permissions'] === '*'
                ? $allPermissions
                : collect($roleConfig['permissions']);

            $role->syncPermissions($permissions);
        }
    }

    private function createSuperAdmin(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@nuzuh.com'],
            [
                'name'      => 'Super Admin',
                'password'  => Hash::make('password'),
                'is_active' => true,
            ]
        );

        if (! $admin->hasRole('super_admin')) {
            $admin->assignRole('super_admin');
        }
    }
}
