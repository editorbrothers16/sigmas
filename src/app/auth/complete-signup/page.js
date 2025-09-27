// src/app/auth/complete-signup/page.js

'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Import the initialized client-side Auth object directly
import { auth } from '@/app/firebase/config'; 
// Use onAuthStateChanged for reliable user session checking

export default function CompleteSignupPage() {
    const [className, setClassName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null); // State to hold the current user object
    const router = useRouter();

    // 1. Check Auth State to reliably get the current user
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                // User is authenticated via Google
                setUser(currentUser);
            } else {
                // User is not logged in, redirect them to the main auth page
                router.push('/auth');
            }
        });

        return () => unsubscribe(); // Cleanup subscription
    }, [router]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!user || !className) {
            setError("Missing user session or class selection.");
            setLoading(false);
            return;
        }

        const userData = {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            class: className, // <-- The collected data
            role: 'student', 
        };

        try {
            // CRITICAL STEP: Call an API route to securely save the full user profile to Firestore
            // This API route will use your Firebase Admin SDK to perform the secure write.
            const res = await fetch('/api/user/finalize-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to save profile data.");
            }

            // Success! Redirect to the dashboard
            router.push('/student/dashboard');

        } catch (err) {
            setError(`Failed to complete registration: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !user) return <div className="p-8 text-center text-blue-600">Loading user session...</div>;

    return (
        <div className="flex flex-col items-center p-10 bg-white rounded-2xl shadow-xl max-w-md mx-auto mt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user.displayName}!</h2>
            <p className="text-gray-600 mb-8">
                Please select your class to finish setting up your account.
            </p>

            {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

            <form onSubmit={handleFormSubmit} className="w-full space-y-6">
                <div>
                    <label htmlFor="class" className="block text-sm font-medium text-gray-700">Your Class/Grade</label>
                    <select 
                        id="class" 
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        required
                        className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm py-2 px-3"
                    >
                        <option value="">-- Select Your Class --</option>
                        <option value="10A">Class 10-A</option>
                        <option value="10B">Class 10-B</option>
                        <option value="11Sci">Class 11 Science</option>
                        {/* Add all valid classes here */}
                    </select>
                </div>

                <button 
                    type="submit"
                    disabled={loading || !className}
                    className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50"
                >
                    Complete Registration
                </button>
            </form>
        </div>
    );
}