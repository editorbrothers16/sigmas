import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="text-center p-8 bg-white rounded-2xl shadow-xl animate-fade-in">
      <h2 className="text-5xl font-bold text-gray-900 mb-4">
        Welcome to Sigmas Coaching Centre
      </h2>
      <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
        Empowering students to achieve their academic goals with dedication and excellence.
      </p>
      <Link href="/portal">
        <button className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105">
          Get Started
        </button>
      </Link>
    </div>
  );
}