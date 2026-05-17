<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\CivilianPrivateHousing;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $auth = $request->user();

        $query = User::with('shelter');

        if ($auth->isShelterScoped()) {
            $query->where('shelter_id', $auth->shelter_id);
        }

        // Optional filters (used for admin-search dropdowns etc.)
        if ($request->query('role')) {
            $query->where('role', $request->query('role'));
        }
        if ($request->query('unassigned') === 'true') {
            $query->whereNull('shelter_id');
        }
        if ($request->query('q')) {
            $q = $request->query('q');
            $query->where(fn ($qb) =>
                $qb->where('name',  'like', "%{$q}%")
                   ->orWhere('email', 'like', "%{$q}%")
            );
        }
        // government roles see all users

        $users = $query->orderBy('name')->get();

        return response()->json([
            'data'    => UserResource::collection($users),
            'message' => 'OK',
        ]);
    }

    public function show(Request $request, User $user): JsonResponse
    {
        $auth = $request->user();

        if ($auth->isShelterScoped() && $user->shelter_id !== $auth->shelter_id) {
            abort(403);
        }

        return response()->json([
            'data'    => new UserResource($user->load('shelter', 'civilianProfile', 'privateHousing')),
            'message' => 'OK',
        ]);
    }

    // POST /api/users/{user}/upload-id — upload ID document image
    public function uploadIdDocument(Request $request, User $user): JsonResponse
    {
        $auth = $request->user();
        if ($auth->isShelterScoped() && $user->shelter_id !== $auth->shelter_id) abort(403);

        $request->validate([
            'document' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        // Delete old document
        if ($user->civilianProfile?->id_document_path) {
            Storage::disk('public')->delete($user->civilianProfile->id_document_path);
        }

        $path = $request->file('document')->store("id_documents/{$user->id}", 'public');

        $user->civilianProfile()->updateOrCreate(
            ['user_id' => $user->id],
            ['id_document_path' => $path]
        );

        return response()->json([
            'data'    => ['url' => Storage::url($path)],
            'message' => 'ID document uploaded.',
        ]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $auth = $request->user();
        $data = $request->validated();

        // Shelter admin always scopes new users to their own shelter
        if ($auth->isShelterAdmin()) {
            $data['shelter_id'] = $auth->shelter_id;
        }

        // Validate shelter capacity when assigning a civilian
        if (($data['role'] ?? '') === 'civilian' && ! empty($data['shelter_id'])) {
            $capacityError = $this->checkCapacity((int) $data['shelter_id']);
            if ($capacityError) return $capacityError;
        }

        $user = User::create($data);

        if ($user->shelter_id) self::syncShelterStatus($user->shelter_id);

        return response()->json([
            'data'    => new UserResource($user->load('shelter')),
            'message' => 'User created successfully.',
        ], 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $auth = $request->user();

        if ($auth->isShelterScoped() && $user->shelter_id !== $auth->shelter_id) {
            abort(403, 'Cannot edit users outside your shelter.');
        }

        // Remove password from update if empty
        $data = collect($request->validated())->filter(fn ($v) => $v !== null)->all();
        if (empty($data['password'])) unset($data['password']);

        // Capacity check when moving a civilian into a new shelter
        $newShelterId = $data['shelter_id'] ?? null;
        if ($newShelterId && $user->role === 'civilian' && $newShelterId != $user->shelter_id) {
            $capacityError = $this->checkCapacity((int) $newShelterId);
            if ($capacityError) return $capacityError;
        }

        $oldShelter = $user->shelter_id;
        $user->update($data);

        // Re-sync capacity status for old and new shelter
        if ($oldShelter) self::syncShelterStatus((int) $oldShelter);
        if ($user->shelter_id) self::syncShelterStatus((int) $user->shelter_id);

        // Update civilian profile if profile fields are provided
        if ($user->role === 'civilian' && $request->has('profile')) {
            $profileData = array_filter($request->input('profile', []), fn ($v) => $v !== null && $v !== '');
            if (! empty($profileData)) {
                $user->civilianProfile()->updateOrCreate(['user_id' => $user->id], $profileData);
            }
        }

        // Update or delete private housing details
        if ($user->role === 'civilian' && $request->has('private_housing')) {
            $housingData = $request->input('private_housing');
            if ($housingData) {
                CivilianPrivateHousing::updateOrCreate(
                    ['civilian_id' => $user->id],
                    array_filter($housingData, fn ($v) => $v !== null && $v !== '')
                );
            } else {
                // null means remove private housing
                $user->privateHousing?->delete();
            }
        }

        return response()->json([
            'data'    => new UserResource($user->fresh()->load('shelter', 'civilianProfile', 'privateHousing')),
            'message' => 'User updated successfully.',
        ]);
    }

    // ─── Capacity helpers ─────────────────────────────────────────────────────

    /**
     * Returns a 422 JSON response if the shelter is at or over capacity,
     * or null if there's space (or no capacity set).
     */
    private function checkCapacity(int $shelterId): ?JsonResponse
    {
        $shelter = Shelter::find($shelterId);
        if (! $shelter || $shelter->capacity <= 0) return null;

        $current = User::where('shelter_id', $shelterId)->where('role', 'civilian')->count();

        if ($current >= $shelter->capacity) {
            return response()->json([
                'message' => "This shelter has reached its maximum capacity of {$shelter->capacity} civilians and cannot accept more.",
            ], 422);
        }

        return null;
    }

    /** Sync shelter status to 'full' or back to 'active' after civilian changes. */
    public static function syncShelterStatus(int $shelterId): void
    {
        $shelter = Shelter::find($shelterId);
        if (! $shelter || $shelter->capacity <= 0) return;

        $current = User::where('shelter_id', $shelterId)->where('role', 'civilian')->count();

        if ($current >= $shelter->capacity && $shelter->status === 'active') {
            $shelter->update(['status' => 'full']);
        } elseif ($current < $shelter->capacity && $shelter->status === 'full') {
            $shelter->update(['status' => 'active']);
        }
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $auth = $request->user();

        if ($user->id === $auth->id) {
            return response()->json(['message' => 'Cannot delete your own account.'], 422);
        }

        if ($auth->isShelterScoped() && $user->shelter_id !== $auth->shelter_id) {
            abort(403);
        }

        // Guard: cannot delete the last government admin
        if ($user->role === 'government_admin') {
            $remaining = User::where('role', 'government_admin')->count();
            if ($remaining <= 1) {
                return response()->json([
                    'message' => 'Cannot delete the last government administrator. Assign another government admin first.',
                ], 422);
            }
        }

        $shelterId = $user->shelter_id;
        $user->delete();

        if ($shelterId) self::syncShelterStatus((int) $shelterId);

        return response()->json(['message' => 'User deleted.']);
    }
}
