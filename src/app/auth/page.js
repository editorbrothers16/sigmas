'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { auth } from '@/app/firebase/config';
import LoadingSpinner from '@/app/(components)/LoadingSpinner';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Handle Sign Up
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Handle Login
        await signInWithEmailAndPassword(auth, email, password);
      }
      // On success, redirect to the dashboard
      router.push('/student/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col items-center p-10 bg-white rounded-2xl shadow-xl max-w-md mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        {isSignUp ? 'Create Your Account' : 'Student Login'}
      </h2>
      <p className="text-gray-500 mb-8">
        {isSignUp ? 'Sign up to get started.' : 'Welcome back! Please log in.'}
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input 
            type="email" 
            id="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm py-2 px-3"
          />
        </div>
        <div>
          <label htmlFor="password"className="block text-sm font-medium text-gray-700">Password</label>
          <input 
            type="password" 
            id="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm py-2 px-3"
          />
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button 
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-blue-700"
        >
          {isSignUp ? 'Sign Up' : 'Login'}
        </button>
      </form>

      <div className="mt-6">
        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-blue-600 hover:underline"
        >
          {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}