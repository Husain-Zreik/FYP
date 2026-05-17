<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\AidCategory;
use App\Models\AidDispatch;
use App\Models\AidRequest;
use App\Models\AidSchedule;
use App\Models\CivilianNeed;
use App\Models\CivilianProfile;
use App\Models\Shelter;
use App\Models\ShelterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function government(): JsonResponse
    {
        $totalShelters     = Shelter::count();
        $activeShelters    = Shelter::where('status', 'active')->count();
        $totalCivilians    = User::where('role', 'civilian')->count();
        $assignedCivilians = User::where('role', 'civilian')->whereNotNull('shelter_id')->count();
        $privateCivilians  = CivilianProfile::where('housing_status', 'private')->count();
        $totalStaff        = User::whereIn('role', ['shelter_admin', 'shelter_staff'])->count();
        $pendingRequests   = ShelterRequest::where('status', 'pending')->count();

        $pendingAidRequests = AidRequest::where('status', 'pending')->count();
        $pendingDispatches  = AidDispatch::where('status', 'pending')->count();
        $activeSchedules    = AidSchedule::where('is_active', true)->count();
        $stockedCategories  = AidCategory::where('is_active', true)
            ->whereHas('batches', fn ($q) => $q->where('available_quantity', '>', 0))
            ->count();

        $recentCivilians = User::where('role', 'civilian')
            ->with('shelter')
            ->latest()
            ->limit(6)
            ->get();

        $recentAidRequests = AidRequest::with(['shelter', 'category'])
            ->where('status', 'pending')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($r) => [
                'id'         => $r->id,
                'shelter'    => $r->shelter?->name,
                'category'   => $r->category?->name,
                'unit'       => $r->category?->unit,
                'urgency'    => $r->urgency,
                'quantity'   => $r->quantity_requested,
                'created_at' => $r->created_at,
            ]);

        return response()->json([
            'data' => [
                'total_shelters'      => $totalShelters,
                'active_shelters'     => $activeShelters,
                'total_civilians'     => $totalCivilians,
                'assigned_civilians'  => $assignedCivilians,
                'private_civilians'   => $privateCivilians,
                'seeking_civilians'   => max(0, $totalCivilians - $assignedCivilians - $privateCivilians),
                'total_staff'         => $totalStaff,
                'pending_requests'    => $pendingRequests,
                'pending_aid_requests'=> $pendingAidRequests,
                'pending_dispatches'  => $pendingDispatches,
                'active_schedules'    => $activeSchedules,
                'stocked_categories'  => $stockedCategories,
                'recent_civilians'    => UserResource::collection($recentCivilians),
                'recent_aid_requests' => $recentAidRequests,
            ],
            'message' => 'OK',
        ]);
    }

    public function shelter(Request $request): JsonResponse
    {
        $user      = $request->user();
        $shelterId = $user->shelter_id;
        abort_if(! $user->isShelterScoped() || ! $shelterId, 403);

        $shelter = Shelter::withCount([
            'users as civilians_count' => fn ($q) => $q->where('role', 'civilian'),
            'users as staff_count'     => fn ($q) => $q->whereIn('role', ['shelter_admin', 'shelter_staff']),
        ])->findOrFail($shelterId);

        $occupancyPct = $shelter->capacity > 0
            ? min(100, round(($shelter->civilians_count / $shelter->capacity) * 100))
            : 0;

        $pendingRequests      = ShelterRequest::where('shelter_id', $shelterId)->where('status', 'pending')->count();
        $pendingAidRequests   = AidRequest::where('shelter_id', $shelterId)->where('status', 'pending')->count();
        $pendingCivilianNeeds = CivilianNeed::where('shelter_id', $shelterId)->where('status', 'pending')->count();
        $pendingIncomingAid   = AidDispatch::where('shelter_id', $shelterId)
            ->where('level', 'government_shelter')->where('status', 'pending')->count();
        $activeSchedules      = AidSchedule::where('shelter_id', $shelterId)
            ->where('level', 'government_shelter')->where('is_active', true)->count();

        $recentCivilians = User::where('role', 'civilian')
            ->where('shelter_id', $shelterId)
            ->latest()->limit(5)->get();

        $recentDispatches = AidDispatch::with('category')
            ->where('shelter_id', $shelterId)
            ->where('level', 'government_shelter')
            ->latest('dispatched_at')->limit(5)->get()
            ->map(fn ($d) => [
                'id'            => $d->id,
                'category'      => $d->category?->name,
                'unit'          => $d->category?->unit,
                'quantity'      => $d->quantity,
                'status'        => $d->status,
                'dispatched_at' => $d->dispatched_at,
                'received_at'   => $d->received_at,
            ]);

        return response()->json([
            'data' => [
                'shelter_name'          => $shelter->name,
                'shelter_status'        => $shelter->status,
                'capacity'              => $shelter->capacity,
                'civilians_count'       => $shelter->civilians_count,
                'staff_count'           => $shelter->staff_count,
                'occupancy_pct'         => $occupancyPct,
                'pending_requests'      => $pendingRequests,
                'pending_aid_requests'  => $pendingAidRequests,
                'pending_civilian_needs'=> $pendingCivilianNeeds,
                'pending_incoming_aid'  => $pendingIncomingAid,
                'active_schedules'      => $activeSchedules,
                'recent_civilians'      => UserResource::collection($recentCivilians),
                'recent_dispatches'     => $recentDispatches,
            ],
            'message' => 'OK',
        ]);
    }
}
