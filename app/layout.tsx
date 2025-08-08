import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Attendance-GeoFace',
  description: 'Face recognition and geolocation-based attendance system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
