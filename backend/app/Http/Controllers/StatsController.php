<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\AidRequest;
use App\Models\CivilianNeed;
use App\Models\CivilianProfile;
use App\Models\Shelter;
use App\Models\ShelterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    // GET /api/stats/government — full system overview
    public function government(): JsonResponse
    {
        $totalShelters    = Shelter::count();
        $activeShelters   = Shelter::where('status', 'active')->count();
        $totalCivilians      = User::where('role', 'civilian')->count();
        $assignedCivilians   = User::where('role', 'civilian')->whereNotNull('shelter_id')->count();
        $privateCivilians    = CivilianProfile::where('housing_status', 'private')->count();
        $seekingCivilians    = $totalCivilians - $assignedCivilians - $privateCivilians;
        $totalStaff       = User::whereIn('role', ['shelter_admin', 'shelter_staff'])->count();
        $pendingRequests  = ShelterRequest::where('status', 'pending')->count();

        // Recent civilians registered (last 6)
        $recentCivilians = User::where('role', 'civilian')
            ->with('shelter')
            ->latest()
            ->limit(6)
            ->get();

        return response()->json([
            'data' => [
                'total_shelters'     => $totalShelters,
                'active_shelters'    => $activeShelters,
                'total_civilians'    => $totalCivilians,
                'assigned_civilians' => $assignedCivilians,
                'private_civilians'  => $privateCivilians,
                'seeking_civilians'  => max(0, $seekingCivilians),
                'total_staff'        => $totalStaff,
                'pending_requests'     => $pendingRequests,
                'pending_aid_requests' => AidRequest::where('status', 'pending')->count(),
                'recent_civilians'     => UserResource::collection($recentCivilians),
            ],
            'message' => 'OK',
        ]);
    }

    // GET /api/stats/shelter — scoped to the authenticated user's shelter
    public function shelter(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if(! $user->isShelterScoped() || ! $user->shelter_id, 403);

        $shelter = Shelter::withCount([
            'users as civilians_count' => fn ($q) => $q->where('role', 'civilian'),
            'users as staff_count'     => fn ($q) => $q->whereIn('role', ['shelter_admin', 'shelter_staff']),
        ])->findOrFail($user->shelter_id);

        $pendingRequests = ShelterRequest::where('shelter_id', $user->shelter_id)
            ->where('status', 'pending')
            ->count();

        $occupancyPct = $shelter->capacity > 0
            ? min(100, round(($shelter->civilians_count / $shelter->capacity) * 100))
            : 0;

        // Most recently admitted civilians
        $recentCivilians = User::where('role', 'civilian')
            ->where('shelter_id', $user->shelter_id)
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'data' => [
                'shelter_name'       => $shelter->name,
                'shelter_status'     => $shelter->status,
                'capacity'           => $shelter->capacity,
                'civilians_count'    => $shelter->civilians_count,
                'staff_count'        => $shelter->staff_count,
                'occupancy_pct'      => $occupancyPct,
                'pending_requests'       => $pendingRequests,
                'pending_civilian_needs' => CivilianNeed::where('shelter_id', $user->shelter_id)
                    ->where('status', 'pending')
                    ->count(),
                'recent_civilians'       => UserResource::collection($recentCivilians),
            ],
            'message' => 'OK',
        ]);
    }
}
