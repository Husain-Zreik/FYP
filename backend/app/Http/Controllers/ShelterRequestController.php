<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\ShelterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShelterRequestController extends Controller
{
    // GET /api/shelter-requests — pending requests for the current shelter
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if(! $user->isShelterScoped(), 403);

        $requests = ShelterRequest::with('civilian')
            ->where('shelter_id', $user->shelter_id)
            ->where('status', 'pending')
            ->latest()
            ->get()
            ->map(fn (ShelterRequest $r) => $this->format($r));

        return response()->json(['data' => $requests, 'message' => 'OK']);
    }

    // POST /api/shelter-requests/invite — shelter invites an unlinked civilian
    public function invite(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if(! $user->isShelterAdmin(), 403);

        $request->validate(['civilian_id' => ['required', 'exists:users,id']]);

        $civilian = User::where('id', $request->civilian_id)
            ->where('role', 'civilian')
            ->whereNull('shelter_id')
            ->firstOrFail();

        $alreadyPending = ShelterRequest::where('civilian_id', $civilian->id)
            ->where('shelter_id', $user->shelter_id)
            ->where('status', 'pending')
            ->exists();

        if ($alreadyPending) {
            return response()->json(['message' => 'An invitation has already been sent to this civilian.'], 422);
        }

        $req = ShelterRequest::create([
            'civilian_id'  => $civilian->id,
            'shelter_id'   => $user->shelter_id,
            'type'         => 'invitation',
            'status'       => 'pending',
            'initiated_by' => $user->id,
        ]);

        return response()->json([
            'data'    => $this->format($req->load('civilian')),
            'message' => 'Invitation sent.',
        ], 201);
    }

    // PATCH /api/shelter-requests/{shelterRequest}/accept
    public function accept(Request $request, ShelterRequest $shelterRequest): JsonResponse
    {
        $user = $request->user();
        abort_if(! $user->isShelterAdmin() || $shelterRequest->shelter_id !== $user->shelter_id, 403);
        abort_if($shelterRequest->status !== 'pending', 422, 'This request is no longer pending.');

        // A civilian can only be in one shelter — reject if already linked
        if ($shelterRequest->civilian->shelter_id !== null) {
            return response()->json(['message' => 'This civilian is already assigned to another shelter.'], 422);
        }

        $shelterRequest->update(['status' => 'accepted', 'responded_at' => now()]);
        $shelterRequest->civilian->update(['shelter_id' => $shelterRequest->shelter_id]);

        return response()->json(['message' => 'Request accepted. Civilian linked to shelter.']);
    }

    // PATCH /api/shelter-requests/{shelterRequest}/reject
    public function reject(Request $request, ShelterRequest $shelterRequest): JsonResponse
    {
        $user = $request->user();
        abort_if(! $user->isShelterAdmin() || $shelterRequest->shelter_id !== $user->shelter_id, 403);
        abort_if($shelterRequest->status !== 'pending', 422, 'This request is no longer pending.');

        $shelterRequest->update(['status' => 'rejected', 'responded_at' => now()]);

        return response()->json(['message' => 'Request rejected.']);
    }

    // GET /api/civilians/available?q= — search civilians not assigned to any shelter
    public function available(Request $request): JsonResponse
    {
        abort_if(! $request->user()->isShelterScoped(), 403);

        $q = $request->query('q', '');

        $civilians = User::where('role', 'civilian')
            ->whereNull('shelter_id')
            ->when($q, fn ($query) =>
                $query->where(fn ($q2) =>
                    $q2->where('name',  'like', "%{$q}%")
                       ->orWhere('email', 'like', "%{$q}%")
                       ->orWhere('phone', 'like', "%{$q}%")
                )
            )
            ->limit(20)
            ->get();

        return response()->json([
            'data'    => UserResource::collection($civilians),
            'message' => 'OK',
        ]);
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private function format(ShelterRequest $r): array
    {
        return [
            'id'          => $r->id,
            'type'        => $r->type,
            'status'      => $r->status,
            'created_at'  => $r->created_at,
            'civilian'    => [
                'id'    => $r->civilian->id,
                'name'  => $r->civilian->name,
                'email' => $r->civilian->email,
                'phone' => $r->civilian->phone,
            ],
        ];
    }
}
