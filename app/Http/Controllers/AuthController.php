<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    /**
     * Show the login screen.
     */
    public function showLogin()
    {
        // Check if database is empty to inform the user of default credentials
        $isEmptyDb = User::count() === 0;

        return Inertia::render('Auth/Login', [
            'isEmptyDb' => $isEmptyDb,
        ]);
    }

    /**
     * Handle authentication attempt.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // Auto-create default users for first-time setup / empty database
        if (User::count() === 0) {
            if ($credentials['email'] === 'admin@sipalay.gov' && $credentials['password'] === 'password') {
                User::create([
                    'name' => 'Sipalay Admin',
                    'email' => 'admin@sipalay.gov',
                    'password' => 'password',
                    'role' => 'admin',
                ]);
            } elseif ($credentials['email'] === 'bhw@sipalay.gov' && $credentials['password'] === 'password') {
                User::create([
                    'name' => 'Sipalay Health Staff',
                    'email' => 'bhw@sipalay.gov',
                    'password' => 'password',
                    'role' => 'staff',
                ]);
            }
        }

        // Auto-create requested Markian Admin account if it does not exist
        if ($credentials['email'] === 'markianadmin@gmail.com' && $credentials['password'] === 'adminpassword') {
            if (!User::where('email', 'markianadmin@gmail.com')->exists()) {
                User::create([
                    'name' => 'Markian Admin',
                    'email' => 'markianadmin@gmail.com',
                    'password' => 'adminpassword',
                    'role' => 'admin',
                ]);
            }
        }

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            $user = Auth::user();
            if ($user->role === 'admin') {
                return redirect()->route('users.index')->with('success', 'Logged in as Admin.');
            }

            return redirect()->intended('/')->with('success', 'Logged in successfully.');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    /**
     * Log user out of the application session.
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('success', 'Logged out successfully.');
    }
}
