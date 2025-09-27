// src/app/api/user/finalize-signup/route.js

import { NextResponse } from 'next/server';
import { adminDb } from '@/app/firebase/admin'; 

// NOTE: Ensure your import path for adminDb is correct.

/**
 * POST handler to finalize user registration and save class information.
 */
export async function POST(request) {
    try {
        const data = await request.json(); 
        
        // 1. Correct Destructuring: The client sends 'class', so we MUST destructure 'class'
        const { uid, email, name, class: userClass, role } = data; // Renaming 'class' to 'userClass'

        // 2. Data Validation
        if (!uid || !email || !name || !userClass) { // <-- VALIDATING THE CORRECT VARIABLE NAME (userClass)
            console.error("Validation failed. Received data:", data);
            return NextResponse.json(
                { message: 'Missing required profile fields (UID, email, name, or class).' }, 
                { status: 400 } // Bad Request
            );
        }

        // 3. Prepare the user profile data
        const userProfile = {
            email: email,
            name: name,
            role: role || 'student',
            class: userClass,        // <-- Storing the correctly validated class
            createdAt: new Date().toISOString(),
            attendance: [], 
            feesStatus: {
                totalFee: 500,
                paid: 0,
                dueDate: 'N/A',
            }
        };

        // 4. Save the data to the 'students' collection
        await adminDb.collection('students').doc(uid).set(userProfile, { merge: true });

        // 5. Return success response
        return NextResponse.json({ 
            message: 'Registration successfully finalized.', 
            user: { uid, name } 
        }, { status: 200 });

    } catch (error) {
        console.error("API Error: Failed to finalize user sign-up:", error);
        return NextResponse.json(
            { message: 'Internal Server Error during registration finalize.' }, 
            { status: 500 }
        );
    }
}