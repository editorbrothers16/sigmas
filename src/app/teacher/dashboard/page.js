'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/app/firebase/config';
import LoadingSpinner from '@/app/(components)/LoadingSpinner';

export default function TeacherDashboardPage() {
    const [user, setUser] = useState(null);
    const [students, setStudents] = useState([]);
    const [presentUids, setPresentUids] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const token = await currentUser.getIdToken();
                    const response = await fetch('/api/teacher/students', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (!response.ok) {
                        throw new Error('You do not have permission to view this page.');
                    }
                    const data = await response.json();
                    setStudents(data);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            } else {
                router.push('/auth');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleCheckboxChange = (studentId) => {
        setPresentUids(prevUids => {
            const newUids = new Set(prevUids);
            if (newUids.has(studentId)) {
                newUids.delete(studentId);
            } else {
                newUids.add(studentId);
            }
            return newUids;
        });
    };

    const handleSubmitAttendance = async () => {
        setMessage('');
        setError('');
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/teacher/attendance', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    presentStudentUids: Array.from(presentUids),
                    teacherName: user.email.split('@')[0] // Example teacher name
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            setMessage(result.message);
            setPresentUids(new Set()); // Clear selection after submission
        } catch (err) {
            setError(err.message);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/auth');
    };

    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="text-center text-red-500 p-8 bg-white rounded-xl shadow-md">
                <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                <p>{error}</p>
                <button onClick={handleLogout} className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg">Go to Login</button>
            </div>
        );
    }

    return (
        <div className="relative p-8 bg-white rounded-2xl shadow-xl max-w-4xl mx-auto">
            <button onClick={handleLogout} className="absolute top-6 right-6 bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-600">Logout</button>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Teacher Dashboard</h2>
            <p className="text-center text-gray-600 mb-8">Mark attendance for today.</p>

            {message && <p className="text-center text-green-600 mb-4">{message}</p>}
            {error && <p className="text-center text-red-500 mb-4">{error}</p>}

            <div className="space-y-3 max-h-96 overflow-y-auto pr-4">
                {students.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm">
                        <div>
                            <p className="font-semibold text-gray-800">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <label htmlFor={`present-${student.id}`} className="text-sm font-medium text-gray-700">Present:</label>
                            <input
                                id={`present-${student.id}`}
                                type="checkbox"
                                checked={presentUids.has(student.id)}
                                onChange={() => handleCheckboxChange(student.id)}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 text-center">
                <button onClick={handleSubmitAttendance} className="bg-green-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-green-700 disabled:bg-gray-400" disabled={presentUids.size === 0}>
                    Submit Attendance ({presentUids.size} selected)
                </button>
            </div>
        </div>
    );
}