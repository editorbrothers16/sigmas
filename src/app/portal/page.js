'use client';

import { useRouter } from 'next/navigation';

export default function PortalPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center p-10 bg-white rounded-2xl shadow-xl max-w-sm mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Portal</h2>
      <p className="text-gray-600 mb-8 text-center">Click below to access your dashboard, check attendance, and manage your fees.</p>
      
      <button 
        onClick={() => router.push('/student/dashboard')} 
        className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors transform hover:scale-105"
      >
        Enter Student Dashboard
      </button>
    </div>
  );
}