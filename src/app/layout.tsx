import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmartPlanner — 2D Планувальник Розумного Будинку',
  description: 'Інтерактивний 2D планувальник розумного будинку в стилі Apple Home: планування, датчики, автоматизації та симуляція',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body className="antialiased">{children}</body>
    </html>
  );
}
