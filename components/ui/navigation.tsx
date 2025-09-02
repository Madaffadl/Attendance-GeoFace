'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Menu,
  X,
  Home,
  Users,
  Calendar,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  GraduationCap,
  Camera,
  MapPin,
  ChevronRight,
  Search,
  Bell,
  User // Import the User icon here
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
  email?: string;
  program_study?: string;
  photo?: string;
}

interface NavigationProps {
  user: User;
  onLogout: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
}

const studentNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/student/dashboard',
    icon: Home
  },
  {
    label: 'Absensi',
    href: '/student/attendance',
    icon: Camera,
    children: [
      {
        label: 'Tandai Kehadiran',
        href: '/student/attendance',
        icon: Camera
      },
      {
        label: 'Riwayat Absensi',
        href: '/student/attendance/history',
        icon: Calendar
      }
    ]
  },
  {
    label: 'Kelas Saya',
    href: '/student/classes',
    icon: BookOpen
  },
  {
    label: 'Registrasi Wajah',
    href: '/student/face-registration',
    icon: Users
  },
  {
    label: 'Profil',
    href: '/student/profile',
    icon: Settings
  }
];

const lecturerNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/lecturer/dashboard',
    icon: Home
  },
  {
    label: 'Kelas',
    href: '/lecturer/classes',
    icon: BookOpen,
    children: [
      {
        label: 'Semua Kelas',
        href: '/lecturer/classes',
        icon: BookOpen
      },
      {
        label: 'Tambah Kelas',
        href: '/lecturer/classes/new',
        icon: BookOpen
      }
    ]
  },
  {
    label: 'Mahasiswa',
    href: '/lecturer/students',
    icon: Users
  },
  {
    label: 'Jadwal',
    href: '/lecturer/schedule',
    icon: Calendar
  },
  {
    label: 'Laporan',
    href: '/lecturer/reports',
    icon: BarChart3,
    badge: 'Baru'
  },
  {
    label: 'Pengaturan',
    href: '/lecturer/settings',
    icon: Settings
  }
];

export function Navigation({ user, onLogout }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();

  const navItems = user.userType === 'student' ? studentNavItems : lecturerNavItems;

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    if (href === `/${user.userType}/dashboard`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const NavItemComponent = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.href);
    const active = isActive(item.href);

    return (
      <div>
        <div className="relative">
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(item.href)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                level > 0 && "ml-4",
                active 
                  ? "bg-blue-100 text-blue-700 border-r-2 border-blue-600" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <ChevronRight 
                className={cn(
                  "w-4 h-4 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            </button>
          ) : (
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                level > 0 && "ml-4",
                active 
                  ? "bg-blue-100 text-blue-700 border-r-2 border-blue-600" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-xs ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => (
              <NavItemComponent key={child.href} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-md"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:transform-none",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">AttendanceTracker</h2>
                <p className="text-xs text-gray-600">
                  {user.userType === 'student' ? 'Portal Mahasiswa' : 'Portal Dosen'}
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {user.photo ? (
                  <img src={user.photo} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-600 truncate">
                  {user.userType === 'student' ? `NIM: ${user.identifier}` : `Kode: ${user.identifier}`}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari menu..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Button
              onClick={onLogout}
              variant="outline"
              className="w-full flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Spacer for Desktop */}
      <div className="hidden lg:block w-72 flex-shrink-0" />
    </>
  );
}