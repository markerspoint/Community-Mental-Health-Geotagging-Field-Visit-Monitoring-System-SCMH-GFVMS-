<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of user accounts.
     */
    public function index()
    {
        if (auth()->user()->role !== 'admin') {
            return redirect()->route('dashboard')->with('error', 'Unauthorized access.');
        }

        $users = User::latest()->get();

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'currentUser' => auth()->user(),
        ]);
    }

    /**
     * Store a newly created user account.
     */
    public function store(Request $request)
    {
        if (auth()->user()->role !== 'admin') {
            return redirect()->route('dashboard')->with('error', 'Unauthorized access.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'role' => 'staff', // manually added users are staff (BHW/Health personnel)
        ]);

        return redirect()->route('users.index')->with('success', 'User account created successfully.');
    }

    /**
     * Remove the specified user account.
     */
    public function destroy(User $user)
    {
        if (auth()->user()->role !== 'admin') {
            return redirect()->route('dashboard')->with('error', 'Unauthorized access.');
        }

        if ($user->id === auth()->id()) {
            return back()->withErrors([
                'name' => 'You cannot delete your own active account.'
            ]);
        }

        $user->delete();

        return redirect()->route('users.index')->with('success', 'User account deleted successfully.');
    }
}
