import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmartPlanner — 2D Планер Умного Дома',
  description: 'Интерактивный 2D планер умного дома в стиле Apple Home: планировка, датчики, автоматизации и симуляция',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
