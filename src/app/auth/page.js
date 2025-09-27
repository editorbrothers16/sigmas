// src/app/auth/page.js

'use client'; 
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '@/app/firebase/config';

// --- NEW/CORRECTED FUNCTION TO CHECK PROFILE STATUS ---
const checkProfileStatus = async (uid) => {
    try {
        const res = await fetch(`/api/user/check-profile?uid=${uid}`, {
            cache: 'no-store'
        });
        
        if (!res.ok) throw new Error("API check failed.");

        const data = await res.json();
        return data.exists; // Returns true if the profile is complete
    } catch (error) {
        console.error("Error during profile status check:", error);
        return false; // Default to false if API fails, forcing the user to complete signup
    }
};

export default function AuthPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log(`Google sign-in successful for: ${user.email}`);

      // 1. Check the user's profile status in Firestore
      const profileIsComplete = await checkProfileStatus(user.uid);

      if (!profileIsComplete) {
        // 2. NEW/INCOMPLETE USER: Redirect to class selection form
        console.log("Profile incomplete. Redirecting to complete registration.");
        router.push('/auth/complete-signup');
      } else {
        // 3. EXISTING/COMPLETE USER: Proceed directly to the dashboard
        console.log("Profile complete. Redirecting to dashboard.");
        router.push('/student/dashboard'); 
      }

    } catch (err) {
      setError(`Google Sign-In failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-xl text-blue-600">Loading...</div> 
    </div>
  );

  return (
    <div className="flex flex-col items-center p-10 bg-white rounded-2xl shadow-xl max-w-md mx-auto min-h-[300px] justify-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Sign In to SIGMAS</h2>
      <p className="text-gray-500 mb-8">
        Your class/role is verified after login.
      </p>

      {error && (
        <div className="w-full mb-6 p-3 rounded-lg text-sm bg-red-100 text-red-700 text-center">
            {error}
        </div>
      )}

      <button 
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg shadow-md hover:bg-gray-50 transition duration-150 disabled:opacity-50"
      >
        {/* Google SVG Path Data (Retained for completeness) */}
        <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">...</svg> 
        Sign in with Google
      </button>
    </div>
  );
}