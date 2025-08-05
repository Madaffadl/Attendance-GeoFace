import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Calendar, 
  FileText, 
  Settings,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  user: {
    id: string;
    name: string;
    userType: string;
    identifier: string;
  };
  onLogout: () => void;
}

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/lecturer/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Kelas Saya',
    href: '/lecturer/classes',
    icon: BookOpen
      active: pathname === '/lecturer/dashboard'
  },
  {
    title: 'Mahasiswa',
    href: '/lecturer/students',
    icon: Users
      active: pathname.startsWith('/lecturer/classes')
  },
  {
    title: 'Jadwal',
    href: '/lecturer/schedule',
    icon: Calendar
      active: pathname.startsWith('/lecturer/students')
  },
  {
    title: 'Laporan',
    href: '/lecturer/reports',
    icon: FileText
      active: pathname === '/lecturer/schedule'
  },
  {
    title: 'Pengaturan',
    href: '/lecturer/settings',
    icon: Settings
      active: pathname === '/lecturer/reports'
  }
];

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      active: pathname === '/lecturer/settings'

  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-gray-200">
        <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">AttendanceTracker</h2>
          <p className="text-xs text-gray-600">Lecturer Portal</p>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-emerald-700">
              {user.name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-600">{user.identifier}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    item.active 
                      ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start text-gray-600 hover:text-gray-900"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}