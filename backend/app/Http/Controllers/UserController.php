<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
            'data'    => new UserResource($user->load('shelter', 'civilianProfile')),
            'message' => 'OK',
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

        $user = User::create($data);

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

        $user->update($data);

        // Update civilian profile if profile fields are provided
        if ($user->role === 'civilian' && $request->has('profile')) {
            $user->civilianProfile()->updateOrCreate(
                ['user_id' => $user->id],
                array_filter($request->input('profile', []), fn ($v) => $v !== null)
            );
        }

        return response()->json([
            'data'    => new UserResource($user->fresh()->load('shelter', 'civilianProfile')),
            'message' => 'User updated successfully.',
        ]);
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

        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }
}
