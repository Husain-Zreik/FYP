<?php

namespace App\Http\Controllers;

use App\Models\RoleCapability;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleCapabilityController extends Controller
{
    // GET /api/role-capabilities
    public function index(): JsonResponse
    {
        $config = config('capabilities');
        $stored = RoleCapability::all()->groupBy('role');

        $result = [];
        foreach ($config as $role => $capabilities) {
            $roleStored = $stored->get($role, collect())->keyBy('capability');

            $result[$role] = array_map(function (array $cap) use ($roleStored) {
                $record = $roleStored->get($cap['key']);
                return [
                    'key'     => $cap['key'],
                    'label'   => $cap['label'],
                    'group'   => $cap['group'],
                    'enabled' => $record ? $record->enabled : true, // default on
                ];
            }, $capabilities);
        }

        return response()->json(['data' => $result, 'message' => 'OK']);
    }

    // PATCH /api/role-capabilities
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'role'         => ['required', 'in:government_staff,shelter_staff'],
            'capabilities' => ['required', 'array'],
            'capabilities.*.key'     => ['required', 'string'],
            'capabilities.*.enabled' => ['required', 'boolean'],
        ]);

        $role = $request->role;

        foreach ($request->capabilities as $cap) {
            RoleCapability::updateOrCreate(
                ['role' => $role, 'capability' => $cap['key']],
                ['enabled' => $cap['enabled']]
            );
        }

        RoleCapability::clearCache($role);

        return response()->json(['message' => 'Capabilities updated.']);
    }
}
