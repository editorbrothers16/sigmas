import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from './(components)/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Sigmas Coaching Centre',
  description: 'Empowering students to achieve their academic goals.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-800`}>
        
          <Navbar />
          <main className="container mx-auto px-4 py-12">
            {children}
          </main>
      </body>
    </html>
  );
}