<?php

namespace App\Http\Controllers;

use App\Http\Requests\Shelter\StoreShelterRequest;
use App\Http\Requests\Shelter\UpdateShelterRequest;
use App\Http\Resources\ShelterResource;
use App\Models\Shelter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

        $shelter->staff()->update(['shelter_id' => null]);

        if ($shelter->image_path) {
            Storage::disk('public')->delete($shelter->image_path);
        }

        $shelter->delete();

        return response()->json(['message' => 'Shelter deleted.']);
    }

    // POST /api/shelters/{shelter}/upload-image
    public function uploadImage(Request $request, Shelter $shelter): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'image', 'max:5120'],
        ]);

        if ($shelter->image_path) {
            Storage::disk('public')->delete($shelter->image_path);
        }

        $path = $request->file('image')->store("shelter_images/{$shelter->id}", 'public');
        $shelter->update(['image_path' => $path]);

        return response()->json([
            'data'    => ['url' => Storage::disk('public')->url($path)],
            'message' => 'Image uploaded.',
        ]);
    }
}
