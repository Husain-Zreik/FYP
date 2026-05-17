<?php

namespace App\Http\Controllers;

use App\Http\Requests\Aid\ReviewAidRequestRequest;
use App\Http\Requests\Aid\StoreAidRequestRequest;
use App\Http\Resources\AidRequestResource;
use App\Models\AidRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AidRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = AidRequest::with(['shelter', 'category', 'reviewer'])
            ->orderBy('created_at', 'desc');

        if ($user->isShelterScoped()) {
            $query->where('shelter_id', $user->shelter_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('urgency')) {
            $query->where('urgency', $request->urgency);
        }

        if ($request->filled('aid_category_id')) {
            $query->where('aid_category_id', $request->aid_category_id);
        }

        if (! $user->isShelterScoped() && $request->filled('shelter_id')) {
            $query->where('shelter_id', $request->shelter_id);
        }

        if ($request->filled('q')) {
            $query->whereHas('shelter', fn ($q) => $q->where('name', 'like', '%' . $request->q . '%'));
        }

        return response()->json([
            'data'    => AidRequestResource::collection($query->get()),
            'message' => 'OK',
        ]);
    }

    public function store(StoreAidRequestRequest $request): JsonResponse
    {
        $user = $request->user();
        abort_if(! $user->isShelterScoped(), 403);

        $aidRequest = AidRequest::create([
            ...$request->validated(),
            'shelter_id' => $user->shelter_id,
        ]);

        $aidRequest->load('shelter', 'category');

        return response()->json([
            'data'    => new AidRequestResource($aidRequest),
            'message' => 'Aid request submitted successfully.',
        ], 201);
    }

    public function show(Request $request, AidRequest $aidRequest): JsonResponse
    {
        $user = $request->user();

        if ($user->isShelterScoped()) {
            abort_if($aidRequest->shelter_id !== $user->shelter_id, 403);
        }

        $aidRequest->load('shelter', 'category', 'reviewer');

        return response()->json([
            'data'    => new AidRequestResource($aidRequest),
            'message' => 'OK',
        ]);
    }

    public function update(Request $request, AidRequest $aidRequest): JsonResponse
    {
        $user = $request->user();

        if (! $user->isShelterScoped() && ($user->isGovernmentAdmin() || $user->role === 'government_staff')) {
            abort_if($aidRequest->status !== 'pending', 422, 'This request has already been reviewed.');

            $reviewRequest = ReviewAidRequestRequest::createFrom($request);
            $reviewRequest->setContainer(app())->setRedirector(app('redirect'))->validateResolved();

            $validated = $reviewRequest->validated();

            $aidRequest->update([
                'status'           => $validated['status'],
                'quantity_approved' => in_array($validated['status'], ['approved', 'partially_approved'])
                    ? $validated['quantity_approved']
                    : null,
                'government_notes' => $validated['government_notes'] ?? null,
                'reviewed_by'      => $user->id,
                'reviewed_at'      => now(),
            ]);

            $aidRequest->load('shelter', 'category', 'reviewer');

            return response()->json([
                'data'    => new AidRequestResource($aidRequest),
                'message' => 'Aid request reviewed successfully.',
            ]);
        }

        if ($user->isShelterScoped()) {
            abort_if($aidRequest->shelter_id !== $user->shelter_id, 403);
            abort_if($aidRequest->status !== 'pending', 422, 'Only pending requests can be cancelled.');

            $aidRequest->update([
                'status'           => 'rejected',
                'government_notes' => 'Cancelled by shelter',
            ]);

            $aidRequest->load('shelter', 'category', 'reviewer');

            return response()->json([
                'data'    => new AidRequestResource($aidRequest),
                'message' => 'Aid request cancelled.',
            ]);
        }

        abort(403);
    }
}
