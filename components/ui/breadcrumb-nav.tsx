'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbNavProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNav({ items, className }: BreadcrumbNavProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: `/${segments[0]}/dashboard` }
    ];

    // Map path segments to readable labels
    const labelMap: { [key: string]: string } = {
      student: 'Mahasiswa',
      lecturer: 'Dosen',
      dashboard: 'Dashboard',
      classes: 'Kelas',
      students: 'Mahasiswa',
      attendance: 'Absensi',
      schedule: 'Jadwal',
      reports: 'Laporan',
      settings: 'Pengaturan',
      'register-face': 'Registrasi Wajah',
      'face-registration': 'Registrasi Wajah'
    };

    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      const href = '/' + segments.slice(0, i + 1).join('/');
      const label = labelMap[segment] || segment;
      
      // Skip numeric IDs in breadcrumbs
      if (!/^\d+$/.test(segment)) {
        breadcrumbs.push({
          label,
          href: i === segments.length - 1 ? undefined : href,
          current: i === segments.length - 1
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-gray-600", className)}>
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
      >
        <Home className="w-4 h-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {item.href && !item.current ? (
            <Link
              href={item.href}
              className="hover:text-blue-600 transition-colors font-medium"
            >
              {item.label}
            </Link>
          ) : (
            <span className={cn(
              "font-medium",
              item.current ? "text-gray-900" : "text-gray-600"
            )}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}