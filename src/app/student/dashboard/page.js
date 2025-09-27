// src/app/student/dashboard/page.js

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '@/app/firebase/config';
import LoadingSpinner from '@/app/(components)/LoadingSpinner';

// --- Helper Functions (No changes needed here) ---

const processAttendanceForCalendar = (attendanceArray) => {
    const datesMap = new Map();
    if (!attendanceArray || attendanceArray.length === 0) return datesMap;

    attendanceArray.forEach(entry => {
        if (entry.date) {
            const dateObj = new Date(entry.date);
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const dateKey = `${yyyy}-${mm}-${dd}`;
            const status = entry.status || 'Present'; 
            
            datesMap.set(dateKey, status);
        }
    });
    return datesMap;
};

// --- ATTENDANCE CALENDAR COMPONENT (No changes needed here) ---
const AttendanceCalendar = React.memo(({ attendanceMap, currentDate, onPrevMonth, onNextMonth }) => {
    const displayDate = currentDate;
    const currentYear = displayDate.getFullYear();
    const currentMonth = displayDate.getMonth();
    const today = new Date(); 

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const renderCalendarDays = () => {
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const mm = String(currentMonth + 1).padStart(2, '0');
            const dd = String(day).padStart(2, '0');
            const dateKey = `${currentYear}-${mm}-${dd}`;
            const status = attendanceMap.get(dateKey);
            
            let styleClass = 'text-gray-900 bg-gray-50';
            let statusText = 'Not Marked';

            if (status === 'Present') {
                styleClass = 'bg-green-500 text-white font-bold shadow-md';
                statusText = 'Present';
            } else if (status === 'Absent') {
                styleClass = 'bg-red-500 text-white font-bold shadow-md';
                statusText = 'Absent';
            } else if (status === 'Late') {
                styleClass = 'bg-yellow-500 text-white font-bold shadow-md';
                statusText = 'Late';
            }

            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

            days.push(
                <div 
                    key={day} 
                    title={`${dateKey} - ${statusText}`}
                    className={`p-2 text-center rounded-lg text-sm cursor-default transition-colors 
                                ${styleClass} ${isToday ? 'border-2 border-indigo-700' : ''}`}
                >
                    {day}
                </div>
            );
        }
        return days;
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-xl font-bold mb-4 text-blue-700">🗓️ Attendance Calendar</h3>
            
            <div className="flex justify-between items-center mb-4">
                <button 
                    onClick={onPrevMonth} 
                    className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                >
                    {'<'}
                </button>
                <p className="text-center font-semibold text-lg">
                    {displayDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>
                <button 
                    onClick={onNextMonth} 
                    className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                >
                    {'>'}
                </button>
            </div>
            
            <div className="grid grid-cols-7 text-center font-bold text-sm text-gray-700 border-b pb-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <span key={day}>{day}</span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {renderCalendarDays()}
            </div>
            
            <div className='mt-4 flex justify-around text-xs'>
                <span className='flex items-center'><span className='w-3 h-3 bg-green-500 rounded-full mr-1'></span>Present</span>
                <span className='flex items-center'><span className='w-3 h-3 bg-red-500 rounded-full mr-1'></span>Absent</span>
                <span className='flex items-center'><span className='w-3 h-3 bg-yellow-500 rounded-full mr-1'></span>Late</span>
            </div>
        </div>
    );
});


export default function StudentDashboardPage() {
    const [user, setUser] = useState(null);
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [displayDate, setDisplayDate] = useState(new Date()); 
    const router = useRouter();

    // --- Month Navigation Handlers (CORRECTED LOGIC) ---
    const handlePrevMonth = useCallback(() => {
        setDisplayDate(prevDate => {
            // FIX: Create a new Date object to avoid side effects
            const newDate = new Date(prevDate);
            // FIX: Set the day to 1 before changing the month to prevent day-rollover bug
            newDate.setDate(1); 
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    }, []);

    const handleNextMonth = useCallback(() => {
        setDisplayDate(prevDate => {
            // FIX: Create a new Date object to avoid side effects
            const newDate = new Date(prevDate);
            // FIX: Set the day to 1 before changing the month to prevent day-rollover bug
            newDate.setDate(1); 
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    }, []);
    // ----------------------------------------------------

    // ... (Authentication and Data Fetching Logic remains the same) ...
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                router.push('/auth');
            }
        });
        return () => unsubscribeAuth();
    }, [router]);

    useEffect(() => {
        if (!user) return;
        const docRef = doc(db, 'students', user.uid);
        const unsubscribeData = onSnapshot(docRef, 
            (doc) => {
                setStudent(doc.exists() ? { id: doc.id, ...doc.data() } : null);
                setLoading(false); 
            }, 
            (error) => {
                console.error("Firestore snapshot error:", error);
                setMessage({ text: "Could not fetch student data.", type: "error" });
                setLoading(false); 
            }
        );
        return () => unsubscribeData();
    }, [user]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
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
                name: user.displayName || 'New Student',
                email: user.email, 
                attendance: [], 
                registeredAt: new Date().toISOString()
            }, { merge: true });
            setMessage({ text: 'New student profile created! Data will load shortly.', type: 'success' });
        } catch (error) {
            setMessage({ text: 'Error creating student account.', type: 'error' });
        }
    };


    // --- Render Logic ---

    if (loading) {
        return <LoadingSpinner />;
    }

    if (user && !student) {
        return (
            <div className="relative text-center p-8 bg-white rounded-2xl shadow-xl max-w-xl mx-auto mt-10">
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

    const attendanceMap = processAttendanceForCalendar(student.attendance);

    return (
        <div className="relative p-8 bg-white rounded-2xl shadow-xl max-w-5xl mx-auto animate-fade-in mt-10">
            <button onClick={handleLogout} className="absolute top-6 right-6 bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-600 transition-colors">Logout</button>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Student Dashboard</h2>
            {message.text && <p className={`mb-4 text-center text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</p>}
            
            <div className="grid lg:grid-cols-3 gap-8">
                
                {/* --- COLUMN 1: Profile --- */}
                <div className="lg:col-span-1 p-6 bg-gray-50 rounded-xl shadow-inner border border-gray-200 h-fit">
                    <h3 className="text-xl font-semibold mb-4 text-indigo-700 border-b pb-2">My Profile</h3>
                    <div className="space-y-3">
                        <p className="text-lg">
                            <span className="font-medium text-gray-700">Name:</span> 
                            <strong className="ml-2">{student.name || user.displayName || 'N/A'}</strong>
                        </p>
                        <p className="text-lg">
                            <span className="font-medium text-gray-700">Email:</span> 
                            <span className="ml-2">{student.email || user.email || 'N/A'}</span>
                        </p>
                        <p className="text-md">
                            <span className="font-medium text-gray-700">Student ID:</span> 
                            <span className="ml-2 text-blue-600">{student.id}</span>
                        </p>
                    </div>
                </div>

                {/* --- COLUMN 2: Attendance Calendar (Updated to use displayDate) --- */}
                <div className="lg:col-span-2">
                    <AttendanceCalendar 
                        attendanceMap={attendanceMap} 
                        currentDate={displayDate}
                        onPrevMonth={handlePrevMonth}
                        onNextMonth={handleNextMonth}
                    />
                </div>
            </div>
        </div>
    );
}