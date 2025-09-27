// components/GoogleSignIn.jsx
"use client";

import React, { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import { auth } from '@/app/firebase/config';
import { useRouter } from "next/navigation";

function GoogleSignIn() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState(null);

  const router = useRouter();

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    setUserDisplayName(null);

    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      
      // The signed-in user info.
      const user = result.user;
      setUserDisplayName(user.displayName);
      router.push('/teacher/dashboard')
      // Optionally, you can redirect the user or perform other actions here
      console.log("Successfully signed in with Google:", user);

    } catch (error) {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      
      console.error("Google Sign-In Error:", errorCode, errorMessage);
      setError(errorMessage);
      setUserDisplayName(null); // Clear user display name on error

    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      await auth.signOut();
      setUserDisplayName(null);
      setError(null);
      console.log("User signed out.");
    } catch (error) {
      console.error("Sign Out Error:", error);
      setError("Failed to sign out.");
    }
  };

  // Basic styling for demonstration
  const buttonStyle = {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
    backgroundColor: "#4285F4",
    color: "white",
    border: "none",
    borderRadius: "4px",
    margin: "10px",
  };

  const signOutButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#DB4437",
  };

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px", maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
      <h2>Firebase Google Authentication</h2>
      
      {userDisplayName ? (
        <div>
          <p>Welcome, **{userDisplayName}**! 🎉</p>
         
        </div>
      ) : (
        <button 
          style={buttonStyle} 
          onClick={signInWithGoogle} 
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In with Google"}
        </button>
      )}

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {/* Optional: Add a listener for auth state changes for a more robust application */}
      {/* <AuthStatusListener /> */}

    </div>
  );
}

export default GoogleSignIn;