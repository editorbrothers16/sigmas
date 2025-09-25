import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
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

export async function GET(request) {
    try {
        // 1. Verify the user's identity from their token
        const uid = await getUidFromToken(request);

        // 2. Check if the authenticated user has the 'teacher' role in Firestore
        if (!uid || !(await isTeacher(uid))) {
            return NextResponse.json({ error: 'Unauthorized: You do not have permission to view this data.' }, { status: 403 });
        }

        // 3. If authorized, fetch all documents from the 'students' collection
        const studentsSnapshot = await adminDb.collection('students').orderBy('name').get();
        const students = studentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 4. Return the list of students
        return NextResponse.json(students, { status: 200 });

    } catch (error) {
        console.error("API Error: Failed to fetch students:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}