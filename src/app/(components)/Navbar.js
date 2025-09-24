'use client';
import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-sm rounded-b-xl sticky top-0 z-50">
      <div className="container mx-auto flex flex-wrap justify-between items-center p-4">
        <Link href="/">
          <h1 className="text-3xl font-extrabold text-blue-800 cursor-pointer">Sigmas</h1>
        </Link>
        <nav className="flex flex-wrap items-center space-x-2 sm:space-x-4 mt-4 sm:mt-0">
          <Link href="/" className="nav-btn">Home</Link>
          <Link href="/contact" className="nav-btn">Contact Us</Link>
          <Link href="/portal" className="nav-btn-primary">Portal</Link>
        </nav>
      </div>
       <style jsx global>{`
        .nav-btn {
          @apply px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200 transition-all duration-300 font-medium;
        }
        .nav-btn-primary {
          @apply px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 font-medium;
        }
      `}</style>
    </header>
  );
}