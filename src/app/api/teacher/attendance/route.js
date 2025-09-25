import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminApp } from '@/app/firebase/admin';

/**
 * Verifies the Firebase ID token from the request's Authorization header.
 * @param {Request} request The incoming Next.js request object.
 * @returns {Promise<string|null>} The user's UID if the token is valid, otherwise null.
 */
async function getUidFromToken(request) {
    try {
        const authorization = request.headers.get('Authorization');
        if (authorization?.startsWith('Bearer ')) {
            const idToken = authorization.split('Bearer ')[1];
            const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
            return decodedToken.uid;
        }
        return null;
    } catch (error) {
        console.error("Token verification failed:", error.code);
        return null;
    }
}

/**
 * Checks the 'users' collection in Firestore to see if a user has the 'teacher' role.
 * @param {string} uid The user's UID.
 * @returns {Promise<boolean>} True if the user is a teacher, otherwise false.
 */
async function isTeacher(uid) {
    if (!uid) return false;
    try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        return userDoc.exists && userDoc.data().role === 'teacher';
    } catch (error) {
        console.error("Failed to check teacher role:", error);
        return false;
    }
}

export async function POST(request) {
    try {
        // 1. Verify the user's identity and role
        const uid = await getUidFromToken(request);
        if (!uid || !(await isTeacher(uid))) {
            return NextResponse.json({ error: 'Unauthorized: You do not have permission to perform this action.' }, { status: 403 });
        }

        // 2. Get the list of present students from the request body
        const { presentStudentUids, teacherName } = await request.json();
        if (!Array.isArray(presentStudentUids)) {
            return NextResponse.json({ error: 'Invalid data format: presentStudentUids must be an array.' }, { status: 400 });
        }

        // 3. Use a batch write for efficiency to update all documents at once
        const batch = adminDb.batch();
        const attendanceRecord = {
            date: new Date().toISOString(),
            teacherName: teacherName || 'Teacher' // Use provided name or a default
        };

        presentStudentUids.forEach(studentId => {
            const studentRef = adminDb.collection('students').doc(studentId);
            // Use FieldValue.arrayUnion to add the new record to the attendance array
            batch.update(studentRef, {
                attendance: FieldValue.arrayUnion(attendanceRecord)
            });
        });

        // 4. Commit the batch write to the database
        await batch.commit();

        // 5. Return a success response
        return NextResponse.json({ message: 'Attendance marked successfully.' }, { status: 200 });
        
    } catch (error) {
        console.error("API Error: Failed to mark attendance:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}