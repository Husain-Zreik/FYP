<?php

namespace App\Http\Controllers;

use App\Http\Requests\Aid\StoreAidBatchRequest;
use App\Http\Resources\AidBatchResource;
use App\Models\AidBatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AidBatchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if(
            ! $user->isGovernmentAdmin() && $user->role !== 'government_staff',
            403
        );

        $batches = AidBatch::with(['category', 'creator'])
            ->orderBy('received_at', 'desc')
            ->get();

        $summary = AidBatch::with('category')
            ->get()
            ->groupBy('aid_category_id')
            ->map(function ($group) {
                $first = $group->first();
                return [
                    'aid_category_id'         => $first->aid_category_id,
                    'category_name'           => $first->category?->name,
                    'unit'                    => $first->category?->unit,
                    'total_available_quantity' => $group->sum('available_quantity'),
                    'total_quantity'           => $group->sum('quantity'),
                ];
            })
            ->values();

        return response()->json([
            'data'    => AidBatchResource::collection($batches),
            'summary' => $summary,
            'message' => 'OK',
        ]);
    }

    public function store(StoreAidBatchRequest $request): JsonResponse
    {
        $user = $request->user();
        abort_if(
            ! $user->isGovernmentAdmin() && $user->role !== 'government_staff',
            403
        );

        $validated                     = $request->validated();
        $validated['available_quantity'] = $validated['quantity'];
        $validated['created_by']         = $user->id;

        $batch = AidBatch::create($validated);
        $batch->load('category', 'creator');

        return response()->json([
            'data'    => new AidBatchResource($batch),
            'message' => 'Aid batch created successfully.',
        ], 201);
    }

    public function show(Request $request, AidBatch $aidBatch): JsonResponse
    {
        $user = $request->user();
        abort_if(
            ! $user->isGovernmentAdmin() && $user->role !== 'government_staff',
            403
        );

        $aidBatch->load('category', 'creator');

        return response()->json([
            'data'    => new AidBatchResource($aidBatch),
            'message' => 'OK',
        ]);
    }

    public function destroy(Request $request, AidBatch $aidBatch): JsonResponse
    {
        abort_if(! $request->user()->isGovernmentAdmin(), 403);

        if ($aidBatch->available_quantity !== $aidBatch->quantity) {
            abort(422, 'Cannot delete a batch that has already been allocated.');
        }

        $aidBatch->delete();

        return response()->json(['message' => 'Aid batch deleted.']);
    }
}
