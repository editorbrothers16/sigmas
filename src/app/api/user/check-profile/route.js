// src/app/api/user/check-profile/route.js

import { NextResponse } from 'next/server';
import { adminDb } from '@/app/firebase/admin'; 
// NOTE: Assuming your project uses a single collection for user data, 
// let's check the 'students' collection as it holds all the final data.

/**
 * GET handler to check if a full profile exists for a given UID.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
        return NextResponse.json({ exists: false, message: 'Missing UID parameter.' }, { status: 400 });
    }

    try {
        // Check if the document exists in the 'students' collection
        const userDoc = await adminDb.collection('students').doc(uid).get();

        if (userDoc.exists && userDoc.data().class) {
            // Profile exists AND has the required 'class' field
            return NextResponse.json({ exists: true, message: 'Profile complete.' }, { status: 200 });
        } else {
            // Profile does not exist or is incomplete
            return NextResponse.json({ exists: false, message: 'Profile incomplete, requires class selection.' }, { status: 200 });
        }

    } catch (error) {
        console.error("API Error: Failed to check user profile:", error);
        return NextResponse.json({ exists: false, message: 'Internal Server Error' }, { status: 500 });
    }
}