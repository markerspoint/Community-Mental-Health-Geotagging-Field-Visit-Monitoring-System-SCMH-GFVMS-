<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectAdmin
{
    /**
     * Handle an incoming request.
     *
     * If the user is authenticated and has the role of 'admin',
     * redirect them to the user management dashboard.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->role === 'admin') {
            return redirect()->route('users.index');
        }

        return $next($request);
    }
}
