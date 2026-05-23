<?php

namespace App\Http\Controllers;

use App\Http\Resources\FamilyMemberResource;
use App\Models\FamilyMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FamilyMemberController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $members = $request->user()->familyMembers()->get();

        return response()->json([
            'data'    => FamilyMemberResource::collection($members),
            'message' => 'OK',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'relationship'  => 'required|in:spouse,child,parent,sibling,other',
            'date_of_birth' => 'nullable|date',
            'gender'        => 'nullable|in:male,female',
            'id_type'       => 'nullable|string|max:50',
            'id_number'     => 'nullable|string|max:100',
            'notes'         => 'nullable|string',
        ]);

        $member = $request->user()->familyMembers()->create($validated);

        return response()->json([
            'data'    => new FamilyMemberResource($member),
            'message' => 'Family member added.',
        ], 201);
    }

    public function update(Request $request, FamilyMember $familyMember): JsonResponse
    {
        abort_if($familyMember->user_id !== $request->user()->id, 403);

        $validated = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'relationship'  => 'sometimes|in:spouse,child,parent,sibling,other',
            'date_of_birth' => 'nullable|date',
            'gender'        => 'nullable|in:male,female',
            'id_type'       => 'nullable|string|max:50',
            'id_number'     => 'nullable|string|max:100',
            'notes'         => 'nullable|string',
        ]);

        $familyMember->update($validated);

        return response()->json([
            'data'    => new FamilyMemberResource($familyMember->fresh()),
            'message' => 'Family member updated.',
        ]);
    }

    public function destroy(Request $request, FamilyMember $familyMember): JsonResponse
    {
        abort_if($familyMember->user_id !== $request->user()->id, 403);

        $familyMember->delete();

        return response()->json(['message' => 'Family member removed.']);
    }
}
