'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '@/app/firebase/config';
import LoadingSpinner from '@/app/(components)/LoadingSpinner';

// This custom hook dynamically loads the QR code generation library
const useQRCodeLibrary = () => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    document.body.appendChild(script);
    return () => { 
      // Clean up the script when the component unmounts
      document.body.removeChild(script); 
    };
  }, []);
  return isScriptLoaded;
};

export default function StudentDashboardPage() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const router = useRouter();

  const qrCanvasRef = useRef(null);
  const isQrLibLoaded = useQRCodeLibrary();
  
  // This useEffect handles authentication and protects the route
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User is logged in, allow component to proceed
        setUser(currentUser);
      } else {
        // User is not logged in, redirect to the authentication page
        router.push('/auth');
      }
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  // This useEffect fetches the specific student's data once we have a user
  useEffect(() => {
    if (!user) return; // Don't run if the user is not authenticated yet
    
    const docRef = doc(db, 'students', user.uid);
    const unsubscribe = onSnapshot(docRef, 
      (doc) => {
        setStudent(doc.exists() ? { id: doc.id, ...doc.data() } : null);
        setLoading(false); // Data is loaded (or confirmed not to exist), stop loading
      }, 
      (error) => {
        console.error("Firestore snapshot error:", error);
        setMessage({ text: "Could not fetch student data.", type: "error" });
        setLoading(false); 
      }
    );
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user]);

  // This useEffect generates the QR code when the student data is available
  useEffect(() => {
    if (qrCanvasRef.current && student && isQrLibLoaded && window.QRious) {
      new window.QRious({
        element: qrCanvasRef.current,
        value: student.id,
        size: 200,
        background: '#ffffff',
        foreground: '#1E3A8A'
      });
    }
  }, [student, isQrLibLoaded]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener will automatically redirect to '/auth'
    } catch (error) {
      console.error("Error signing out:", error);
      setMessage({ text: "Failed to log out.", type: "error" });
    }
  };

  const registerNewStudent = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'students', user.uid);
      await setDoc(docRef, {
        name: 'Student ' + user.uid.substring(0, 5),
        email: user.email, // Store the user's email
        fees: { amount: 5000, paid: false },
        attendance: [],
        registeredAt: new Date().toISOString()
      });
      setMessage({ text: 'New student account created!', type: 'success' });
    } catch (error) {
      setMessage({ text: 'Error creating student account.', type: 'error' });
    }
  };

  const handlePayment = async (amount) => {
    if (!user || !student) return;
    try {
      const res = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, studentId: user.uid }),
      });
      const order = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Sigmas Coaching',
        description: 'Course Fee Payment',
        order_id: order.id,
        handler: async function (response) {
          const verificationRes = await fetch('/api/razorpay', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              studentId: user.uid,
            }),
          });
          const result = await verificationRes.json();
          setMessage({ text: result.message, type: verificationRes.ok ? 'success' : 'error' });
        },
        prefill: { name: student.name, email: user.email },
        theme: { color: '#3399cc' },
      };
      // Ensure the Razorpay script is loaded before creating a new instance
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        console.error("Razorpay script not loaded");
      }
    } catch (error) {
      setMessage({ text: 'Payment initiation failed.', type: 'error' });
    }
  };

  // Render a loading spinner while waiting for authentication and data
  if (loading) {
    return <LoadingSpinner />;
  }

  // If the user is authenticated but has no student document, show the registration view
  if (user && !student) {
    return (
      <div className="relative text-center p-8 bg-white rounded-2xl shadow-xl max-w-xl mx-auto">
        <button onClick={handleLogout} className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors">Logout</button>
        <h3 className="text-xl font-medium text-gray-800 mb-4">Welcome, {user.email}!</h3>
        <p className="text-gray-600 mb-6">Your profile is not yet registered in our system.</p>
        <button onClick={registerNewStudent} className="bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors">
          Create My Student Profile
        </button>
        {message.text && <p className={`mt-4 text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</p>}
      </div>
    );
  }

  // If the user and student data are loaded, render the full dashboard
  return (
    <div className="relative p-8 bg-white rounded-2xl shadow-xl max-w-3xl mx-auto animate-fade-in">
      <button onClick={handleLogout} className="absolute top-6 right-6 bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-600 transition-colors">Logout</button>
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Student Dashboard</h2>
      {message.text && <p className={`mb-4 text-center text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</p>}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="flex flex-col items-center p-6 bg-gray-50 rounded-xl shadow-inner">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">My Identity QR Code</h3>
          <div className="p-2 bg-white rounded-lg shadow-md">
            <canvas ref={qrCanvasRef} />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-600">Show this for attendance.</p>
        </div>
        <div className="p-6 bg-gray-50 rounded-xl shadow-inner">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Attendance Record</h3>
          <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {student && student.attendance.length > 0 ? (
              [...student.attendance].reverse().map((entry, index) => (
                <li key={index} className="flex justify-between p-3 bg-white rounded-lg shadow-sm">
                  <span className="font-medium text-gray-700">{new Date(entry.date).toLocaleDateString()}</span>
                  <span className="text-sm text-gray-500">{entry.teacherName ? `by ${entry.teacherName}` : ''}</span>
                </li>
              ))
            ) : <li className="text-gray-500">No attendance records.</li>}
          </ul>
        </div>
        <div className="md:col-span-2 p-6 bg-gray-50 rounded-xl shadow-inner">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Fee Status</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">Total: <span className="text-blue-600">₹{student?.fees.amount}</span></p>
              <p className="text-lg font-semibold">Status: <span className={student?.fees.paid ? "text-green-600" : "text-red-600"}>{student?.fees.paid ? 'Paid' : 'Pending'}</span></p>
            </div>
            {!student?.fees.paid && (
              <button onClick={() => handlePayment(student.fees.amount)} className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-green-600 transition-colors">Pay Now</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};