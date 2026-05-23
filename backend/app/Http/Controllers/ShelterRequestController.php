<?php

namespace App\Http\Controllers;

use App\Http\Controllers\UserController;
use App\Http\Resources\UserResource;
use App\Models\Shelter;
use App\Models\ShelterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShelterRequestController extends Controller
{
    // GET /api/shelter-requests — requests (all for govt, scoped for shelter); optional ?status= filter
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if(! $user->isShelterScoped() && ! $user->isGovernmentAdmin(), 403);

        $query = ShelterRequest::with('civilian.civilianProfile', 'shelter')
            ->latest();

        if ($user->isShelterScoped()) {
            $query->where('shelter_id', $user->shelter_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $requests = $query->get()->map(fn (ShelterRequest $r) => $this->format($r));

        return response()->json(['data' => $requests, 'message' => 'OK']);
    }

    // POST /api/shelter-requests — civilian submits a join request
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'civilian') {
            abort(403, 'Only civilians can submit join requests.');
        }

        if ($user->shelter_id) {
            return response()->json(['message' => 'You are already assigned to a shelter.'], 422);
        }

        // Must have both ID number and ID document image
        if (! $user->civilianProfile?->id_number || ! $user->civilianProfile?->id_document_path) {
            return response()->json([
                'message' => 'You must upload your ID document before requesting to join a shelter.',
            ], 422);
        }

        $request->validate(['shelter_id' => 'required|exists:shelters,id']);

        $existing = ShelterRequest::where('civilian_id', $user->id)
            ->where('shelter_id', $request->shelter_id)
            ->where('status', 'pending')
            ->exists();

        if ($existing) {
            return response()->json(['message' => 'You already have a pending request for this shelter.'], 422);
        }

        $req = ShelterRequest::create([
            'civilian_id'  => $user->id,
            'shelter_id'   => $request->shelter_id,
            'type'         => 'request',
            'status'       => 'pending',
            'initiated_by' => $user->id,
        ]);

        return response()->json([
            'data'    => $this->format($req->load('civilian.civilianProfile', 'shelter')),
            'message' => 'Request submitted successfully.',
        ], 201);
    }

    // POST /api/shelter-requests/invite — shelter invites an unlinked civilian
    public function invite(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if(! $user->isShelterAdmin(), 403);

        $request->validate(['civilian_id' => ['required', 'exists:users,id']]);

        $civilian = User::with('civilianProfile')
            ->where('id', $request->civilian_id)
            ->where('role', 'civilian')
            ->whereNull('shelter_id')
            ->firstOrFail();

        // Civilian must have both ID number and document image before they can be invited
        if (! $civilian->civilianProfile?->id_number || ! $civilian->civilianProfile?->id_document_path) {
            return response()->json([
                'message' => 'This civilian has not uploaded their ID document yet. Both ID number and document image are required.',
            ], 422);
        }

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

        if ($user->role === 'civilian') {
            // Civilian accepts an invitation sent to them
            abort_if($shelterRequest->civilian_id !== $user->id, 403);
            abort_if($shelterRequest->type !== 'invitation', 422, 'You can only accept invitations.');
        } else {
            // Shelter admin / govt admin accepts a join request
            abort_if(
                ! $user->isGovernmentAdmin() &&
                (! $user->isShelterAdmin() || $shelterRequest->shelter_id !== $user->shelter_id),
                403
            );
        }

        abort_if($shelterRequest->status !== 'pending', 422, 'This request is no longer pending.');

        // A civilian can only be in one shelter
        if ($shelterRequest->civilian->shelter_id !== null) {
            return response()->json(['message' => 'This civilian is already assigned to another shelter.'], 422);
        }

        // Capacity check
        $shelter = Shelter::find($shelterRequest->shelter_id);
        if ($shelter && $shelter->capacity > 0) {
            $current = User::where('shelter_id', $shelter->id)->where('role', 'civilian')->count();
            if ($current >= $shelter->capacity) {
                return response()->json([
                    'message' => "This shelter has reached its maximum capacity of {$shelter->capacity} civilians.",
                ], 422);
            }
        }

        $shelterRequest->update(['status' => 'accepted', 'responded_at' => now()]);
        $shelterRequest->civilian->update(['shelter_id' => $shelterRequest->shelter_id]);

        // Sync shelter status after admission
        if ($shelterRequest->shelter_id) {
            UserController::syncShelterStatus((int) $shelterRequest->shelter_id);
        }

        // Cancel all other pending requests and invitations for this civilian
        ShelterRequest::where('civilian_id', $shelterRequest->civilian_id)
            ->where('id', '!=', $shelterRequest->id)
            ->where('status', 'pending')
            ->update(['status' => 'rejected', 'responded_at' => now()]);

        return response()->json(['message' => 'Request accepted. Civilian linked to shelter.']);
    }

    // PATCH /api/shelter-requests/{shelterRequest}/reject
    public function reject(Request $request, ShelterRequest $shelterRequest): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'civilian') {
            // Civilian declines an invitation sent to them
            abort_if($shelterRequest->civilian_id !== $user->id, 403);
            abort_if($shelterRequest->type !== 'invitation', 422, 'You can only decline invitations.');
        } else {
            // Shelter admin / govt admin rejects a join request
            abort_if(
                ! $user->isGovernmentAdmin() &&
                (! $user->isShelterAdmin() || $shelterRequest->shelter_id !== $user->shelter_id),
                403
            );
        }

        abort_if($shelterRequest->status !== 'pending', 422, 'This request is no longer pending.');

        $shelterRequest->update(['status' => 'rejected', 'responded_at' => now()]);

        return response()->json(['message' => 'Request rejected.']);
    }

    // PATCH /api/shelter-requests/{shelterRequest}/cancel
    // Civilians cancel their own join requests; shelter/govt admins cancel sent invitations.
    public function cancel(Request $request, ShelterRequest $shelterRequest): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'civilian') {
            abort_if($shelterRequest->civilian_id !== $user->id, 403);
            abort_if($shelterRequest->type !== 'request', 422, 'Only your own join requests can be cancelled.');
            abort_if($shelterRequest->status !== 'pending', 422, 'This request is no longer pending.');
        } else {
            abort_if(
                ! $user->isGovernmentAdmin() &&
                (! $user->isShelterAdmin() || $shelterRequest->shelter_id !== $user->shelter_id),
                403
            );
            abort_if($shelterRequest->type !== 'invitation', 422, 'Only sent invitations can be cancelled.');
            abort_if($shelterRequest->status !== 'pending', 422, 'This invitation is no longer pending.');
        }

        $shelterRequest->update(['status' => 'rejected', 'responded_at' => now()]);

        return response()->json(['message' => 'Request cancelled.']);
    }

    // GET /api/civilians/{user}/requests — active requests for a specific civilian
    public function civilianRequests(Request $request, User $user): JsonResponse
    {
        $auth = $request->user();
        if ($auth->isShelterScoped() && $user->shelter_id !== $auth->shelter_id) abort(403);

        $items = ShelterRequest::with('shelter')
            ->where('civilian_id', $user->id)
            ->latest()
            ->get()
            ->map(fn (ShelterRequest $r) => [
                'id'         => $r->id,
                'type'       => $r->type,
                'status'     => $r->status,
                'created_at' => $r->created_at,
                'shelter'    => ['id' => $r->shelter->id, 'name' => $r->shelter->name],
            ]);

        return response()->json(['data' => $items, 'message' => 'OK']);
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
        $c       = $r->civilian;
        $profile = $c->civilianProfile;

        return [
            'id'         => $r->id,
            'type'       => $r->type,
            'status'     => $r->status,
            'created_at' => $r->created_at,
            'shelter'    => $r->shelter ? [
                'id'          => $r->shelter->id,
                'name'        => $r->shelter->name,
                'governorate' => $r->shelter->governorate,
            ] : null,
            'civilian'   => [
                'id'        => $c->id,
                'name'      => $c->name,
                'email'     => $c->email,
                'phone'     => $c->phone,
                'is_active' => $c->is_active,
                'profile'   => $profile ? [
                    'date_of_birth'    => $profile->date_of_birth,
                    'gender'           => $profile->gender,
                    'current_location' => $profile->current_location,
                    'notes'            => $profile->notes,
                    'id_type'          => $profile->id_type,
                    'id_number'        => $profile->id_number,
                    'has_id_document'  => (bool) $profile->id_document_path,
                    'id_document_url'  => $profile->id_document_path
                        ? \Illuminate\Support\Facades\Storage::disk('public')->url($profile->id_document_path)
                        : null,
                ] : null,
            ],
        ];
    }
}
