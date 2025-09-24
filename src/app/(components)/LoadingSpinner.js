// ❌ REMOVED: import { adminDb } from '@/app/firebase/admin';

// ✅ CORRECT: A simple component with no server-side imports.
// ✅ CORRECT: Added "default" to the export.
export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
    </div>
  );
}