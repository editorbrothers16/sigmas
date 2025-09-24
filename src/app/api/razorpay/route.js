import { NextResponse } from 'next/server';
import { adminDb } from '@/app/firebase/admin';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST: Create a new Razorpay Order
export async function POST(req) {
  try {
    const { amount, studentId } = await req.json();
    const options = {
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt_student_${studentId}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error('Razorpay Order API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Verify payment signature and update Firestore
export async function PUT(req) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, studentId } = await req.json();
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
      
    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      const studentDocRef = adminDb.collection('students').doc(studentId);
      await studentDocRef.update({
        'fees.paid': true,
        'fees.paymentId': razorpay_payment_id,
        'fees.orderId': razorpay_order_id,
        'fees.paymentDate': new Date().toISOString(),
      });
      return NextResponse.json({ message: 'Payment verified successfully.' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Payment verification failed. Invalid signature.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Razorpay Verification API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}