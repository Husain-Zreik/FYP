<?php

namespace App\Http\Controllers;

use App\Http\Requests\Shelter\StoreShelterRequest;
use App\Http\Requests\Shelter\UpdateShelterRequest;
use App\Http\Resources\ShelterResource;
use App\Models\Shelter;
use Illuminate\Http\JsonResponse;

class ShelterController extends Controller
{
    public function index(): JsonResponse
    {
        $shelters = Shelter::withCount([
            'users as civilians_count' => fn ($q) => $q->where('role', 'civilian'),
            'users as staff_count'     => fn ($q) => $q->whereIn('role', ['shelter_admin', 'shelter_staff']),
        ])->orderBy('name')->get();

        return response()->json([
            'data'    => ShelterResource::collection($shelters),
            'message' => 'OK',
        ]);
    }

    public function show(Shelter $shelter): JsonResponse
    {
        $shelter->loadCount([
            'users as civilians_count' => fn ($q) => $q->where('role', 'civilian'),
            'users as staff_count'     => fn ($q) => $q->whereIn('role', ['shelter_admin', 'shelter_staff']),
        ])->load('staff', 'civilians');

        return response()->json([
            'data'    => new ShelterResource($shelter),
            'message' => 'OK',
        ]);
    }

    public function store(StoreShelterRequest $request): JsonResponse
    {
        $shelter = Shelter::create($request->validated());

        return response()->json([
            'data'    => new ShelterResource($shelter),
            'message' => 'Shelter created successfully.',
        ], 201);
    }

    public function update(UpdateShelterRequest $request, Shelter $shelter): JsonResponse
    {
        $shelter->update($request->validated());

        return response()->json([
            'data'    => new ShelterResource($shelter->fresh()),
            'message' => 'Shelter updated successfully.',
        ]);
    }

    public function destroy(Shelter $shelter): JsonResponse
    {
        if ($shelter->civilians()->exists()) {
            return response()->json([
                'message' => 'Cannot delete a shelter that still has civilians. Remove or reassign them first.',
            ], 422);
        }

        // Unlink staff before deleting
        $shelter->staff()->update(['shelter_id' => null]);
        $shelter->delete();

        return response()->json(['message' => 'Shelter deleted.']);
    }
}
