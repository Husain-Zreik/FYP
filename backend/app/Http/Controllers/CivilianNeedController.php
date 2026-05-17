<?php

namespace App\Http\Controllers;

use App\Http\Requests\Aid\ReviewCivilianNeedRequest;
use App\Http\Requests\Aid\StoreCivilianNeedRequest;
use App\Http\Resources\CivilianNeedResource;
use App\Models\CivilianNeed;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CivilianNeedController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = CivilianNeed::with(['civilian', 'reviewer'])
            ->orderBy('created_at', 'desc');

        if ($user->role === 'civilian') {
            $query->where('civilian_id', $user->id);
        } elseif ($user->isShelterScoped()) {
            $query->where('shelter_id', $user->shelter_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('urgency')) {
            $query->where('urgency', $request->urgency);
        }

        return response()->json([
            'data'    => CivilianNeedResource::collection($query->get()),
            'message' => 'OK',
        ]);
    }

    public function store(StoreCivilianNeedRequest $request): JsonResponse
    {
        $user = $request->user();
        abort_if($user->role !== 'civilian', 403);
        abort_if(! $user->shelter_id, 422, 'You are not assigned to a shelter yet');

        $need = CivilianNeed::create([
            ...$request->validated(),
            'civilian_id' => $user->id,
            'shelter_id'  => $user->shelter_id,
        ]);

        $need->load('civilian');

        return response()->json([
            'data'    => new CivilianNeedResource($need),
            'message' => 'Need submitted successfully.',
        ], 201);
    }

    public function show(Request $request, CivilianNeed $civilianNeed): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'civilian') {
            abort_if($civilianNeed->civilian_id !== $user->id, 403);
        } elseif ($user->isShelterScoped()) {
            abort_if($civilianNeed->shelter_id !== $user->shelter_id, 403);
        }

        $civilianNeed->load('civilian', 'reviewer');

        return response()->json([
            'data'    => new CivilianNeedResource($civilianNeed),
            'message' => 'OK',
        ]);
    }

    public function update(ReviewCivilianNeedRequest $request, CivilianNeed $civilianNeed): JsonResponse
    {
        $user = $request->user();
        abort_if(! $user->isShelterScoped(), 403);
        abort_if($civilianNeed->shelter_id !== $user->shelter_id, 403);
        abort_if(
            in_array($civilianNeed->status, ['fulfilled', 'rejected']),
            422,
            'Already reviewed'
        );

        $civilianNeed->update([
            ...$request->validated(),
            'reviewed_by' => $user->id,
            'reviewed_at' => now(),
        ]);

        $civilianNeed->load('civilian', 'reviewer');

        return response()->json([
            'data'    => new CivilianNeedResource($civilianNeed),
            'message' => 'Civilian need updated successfully.',
        ]);
    }
}
