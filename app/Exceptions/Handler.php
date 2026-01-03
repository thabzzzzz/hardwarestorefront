<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use Illuminate\Http\JsonResponse;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [];

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $exception)
    {
        // Provide a JSON response for CSRF token mismatches on API requests
        if ($exception instanceof \Illuminate\Session\TokenMismatchException) {
            $message = 'CSRF token mismatch. This usually means your request is missing a CSRF token or the session expired. For API requests, ensure you call the `/api` endpoints (not web routes) or exclude API routes from CSRF verification.';
            $payload = [
                'message' => $message,
                'error' => 'token_mismatch',
            ];

            if ($request->wantsJson() || str_starts_with($request->path(), 'api')) {
                return new JsonResponse($payload, 419);
            }
        }

        return parent::render($request, $exception);
    }
}
