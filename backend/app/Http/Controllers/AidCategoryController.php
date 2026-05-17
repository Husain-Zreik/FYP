<?php

namespace App\Http\Controllers;

use App\Http\Resources\AidCategoryResource;
use App\Models\AidCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AidCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = AidCategory::where('is_active', true)
            ->with('batches')
            ->get();

        return response()->json([
            'data'    => AidCategoryResource::collection($categories),
            'message' => 'OK',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_if(! $request->user()->isGovernmentAdmin(), 403);

        $data = $request->validate([
            'name'        => ['required', 'string', 'max:100'],
            'unit'        => ['required', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
        ]);

        $category = AidCategory::create($data);

        return response()->json([
            'data'    => new AidCategoryResource($category),
            'message' => 'Aid category created successfully.',
        ], 201);
    }

    public function show(Request $request, AidCategory $aidCategory): JsonResponse
    {
        $aidCategory->load('batches');

        return response()->json([
            'data'    => new AidCategoryResource($aidCategory),
            'message' => 'OK',
        ]);
    }

    public function update(Request $request, AidCategory $aidCategory): JsonResponse
    {
        abort_if(! $request->user()->isGovernmentAdmin(), 403);

        $data = $request->validate([
            'name'        => ['sometimes', 'string', 'max:100'],
            'unit'        => ['sometimes', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'is_active'   => ['sometimes', 'boolean'],
        ]);

        $aidCategory->update($data);

        return response()->json([
            'data'    => new AidCategoryResource($aidCategory->fresh()),
            'message' => 'Aid category updated successfully.',
        ]);
    }

    public function destroy(Request $request, AidCategory $aidCategory): JsonResponse
    {
        abort_if(! $request->user()->isGovernmentAdmin(), 403);

        if ($aidCategory->batches()->exists() || $aidCategory->requests()->exists()) {
            abort(422, 'Category in use');
        }

        $aidCategory->delete();

        return response()->json(['message' => 'Aid category deleted.']);
    }
}
