import './globals.css';
import Shell from '@/components/Shell';

export const metadata = {
  title: 'FoodHub – Food Delivery DBMS',
  description: 'Smart Multi-Vendor Food Delivery & Logistics Management System (MySQL + MongoDB + Next.js)',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rubik:wght@500;600;700&family=Nunito+Sans:wght@400;600;700;800&display=swap" />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
