<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\ApiToken;
use Illuminate\Support\Facades\Auth;

class AuthenticateWithApiToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tokenString = $request->bearerToken();

        if (!$tokenString) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $hashedToken = hash('sha256', $tokenString);
        $apiToken = ApiToken::where('token', $hashedToken)->with('user')->first();

        if (!$apiToken || !$apiToken->user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Log the user in for the current request
        Auth::login($apiToken->user);

        return $next($request);
    }
}
