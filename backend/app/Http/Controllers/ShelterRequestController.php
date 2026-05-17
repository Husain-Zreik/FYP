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
    // GET /api/shelter-requests — pending requests (all for govt, scoped for shelter)
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if(! $user->isShelterScoped() && ! $user->isGovernmentAdmin(), 403);

        $query = ShelterRequest::with('civilian.civilianProfile', 'shelter')
            ->where('status', 'pending')
            ->latest();

        if ($user->isShelterScoped()) {
            $query->where('shelter_id', $user->shelter_id);
        }

        $requests = $query->get()->map(fn (ShelterRequest $r) => $this->format($r));

        return response()->json(['data' => $requests, 'message' => 'OK']);
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

        // Civilian must have their ID on file before they can be invited
        if (! $civilian->civilianProfile?->id_number) {
            return response()->json([
                'message' => 'This civilian has not uploaded their ID yet. Ask them to complete their profile before you can invite them.',
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
        abort_if(
            ! $user->isGovernmentAdmin() &&
            (! $user->isShelterAdmin() || $shelterRequest->shelter_id !== $user->shelter_id),
            403
        );
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

        return response()->json(['message' => 'Request accepted. Civilian linked to shelter.']);
    }

    // PATCH /api/shelter-requests/{shelterRequest}/reject
    public function reject(Request $request, ShelterRequest $shelterRequest): JsonResponse
    {
        $user = $request->user();
        abort_if(
            ! $user->isGovernmentAdmin() &&
            (! $user->isShelterAdmin() || $shelterRequest->shelter_id !== $user->shelter_id),
            403
        );
        abort_if($shelterRequest->status !== 'pending', 422, 'This request is no longer pending.');

        $shelterRequest->update(['status' => 'rejected', 'responded_at' => now()]);

        return response()->json(['message' => 'Request rejected.']);
    }

    // PATCH /api/shelter-requests/{shelterRequest}/cancel — cancel a sent invitation
    public function cancel(Request $request, ShelterRequest $shelterRequest): JsonResponse
    {
        $user = $request->user();
        abort_if(
            ! $user->isGovernmentAdmin() &&
            (! $user->isShelterAdmin() || $shelterRequest->shelter_id !== $user->shelter_id),
            403
        );
        abort_if($shelterRequest->type !== 'invitation', 422, 'Only sent invitations can be cancelled.');
        abort_if($shelterRequest->status !== 'pending', 422, 'This invitation is no longer pending.');

        $shelterRequest->update(['status' => 'rejected', 'responded_at' => now()]);

        return response()->json(['message' => 'Invitation cancelled.']);
    }

    // GET /api/civilians/{user}/requests — active requests for a specific civilian
    public function civilianRequests(Request $request, User $user): JsonResponse
    {
        $auth = $request->user();
        if ($auth->isShelterScoped() && $user->shelter_id !== $auth->shelter_id) abort(403);

        $items = ShelterRequest::with('shelter')
            ->where('civilian_id', $user->id)
            ->where('status', 'pending')
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
            'shelter'    => $r->shelter ? ['id' => $r->shelter->id, 'name' => $r->shelter->name] : null,
            'civilian'   => [
                'id'         => $c->id,
                'name'       => $c->name,
                'email'      => $c->email,
                'phone'      => $c->phone,
                'is_active'  => $c->is_active,
                'profile'    => $profile ? [
                    'date_of_birth'    => $profile->date_of_birth,
                    'gender'           => $profile->gender,
                    'current_location' => $profile->current_location,
                    'notes'            => $profile->notes,
                    'id_type'          => $profile->id_type,
                    'id_number'        => $profile->id_number,
                    'has_id_document'  => (bool) $profile->id_document_path,
                ] : null,
            ],
        ];
    }
}
