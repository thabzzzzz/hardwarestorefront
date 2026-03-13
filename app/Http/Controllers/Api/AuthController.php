<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function me(Request $request)
    {
        return response()->json([
            'user' => Auth::user()
        ]);
    }

    public function logout(Request $request)
    {
        $tokenString = $request->bearerToken();
        if ($tokenString) {
            $hashedToken = hash('sha256', $tokenString);
            \App\Models\ApiToken::where('token', $hashedToken)->delete();
        }

        return response()->json(['message' => 'Logged out successfully.']);
    }

    // Email/Password stubs
    public function register(Request $request)
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }
    public function login(Request $request)
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }
}
