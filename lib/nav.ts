import {
    Home,
    Camera,
    Calendar,
    BookOpen,
    Users,
    Settings,
    BarChart3,
    MapPin,
    User,
    Plus,
    type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/lib/routes';

export interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: string;
    children?: NavItem[];
}

/**
 * Navigation items for student users
 */
export const studentNavItems: NavItem[] = [
    {
        label: 'Dashboard',
        href: ROUTES.STUDENT.DASHBOARD,
        icon: Home,
    },
    {
        label: 'Absensi',
        href: ROUTES.STUDENT.ATTENDANCE,
        icon: Camera,
        children: [
            {
                label: 'Tandai Kehadiran',
                href: ROUTES.STUDENT.ATTENDANCE,
                icon: Camera,
            },
            {
                label: 'Riwayat Absensi',
                href: ROUTES.STUDENT.ATTENDANCE_HISTORY,
                icon: Calendar,
            },
        ],
    },
    {
        label: 'Kelas Saya',
        href: ROUTES.STUDENT.CLASSES,
        icon: BookOpen,
    },
    {
        label: 'Registrasi Wajah',
        href: ROUTES.STUDENT.FACE_REGISTRATION,
        icon: Users,
    },
    {
        label: 'Lokasi Kampus',
        href: ROUTES.STUDENT.LOCATIONS,
        icon: MapPin,
    },
    {
        label: 'Profil',
        href: ROUTES.STUDENT.PROFILE,
        icon: User,
    },
];

/**
 * Navigation items for lecturer users
 */
export const lecturerNavItems: NavItem[] = [
    {
        label: 'Dashboard',
        href: ROUTES.LECTURER.DASHBOARD,
        icon: Home,
    },
    {
        label: 'Kelas',
        href: ROUTES.LECTURER.CLASSES,
        icon: BookOpen,
        children: [
            {
                label: 'Semua Kelas',
                href: ROUTES.LECTURER.CLASSES,
                icon: BookOpen,
            },
            {
                label: 'Tambah Kelas',
                href: ROUTES.LECTURER.CLASSES_NEW,
                icon: Plus,
            },
        ],
    },
    {
        label: 'Mahasiswa',
        href: ROUTES.LECTURER.STUDENTS,
        icon: Users,
    },
    {
        label: 'Jadwal',
        href: ROUTES.LECTURER.SCHEDULE,
        icon: Calendar,
    },
    {
        label: 'Laporan',
        href: ROUTES.LECTURER.REPORTS,
        icon: BarChart3,
    },
    {
        label: 'Analitik',
        href: ROUTES.LECTURER.ANALYTICS,
        icon: BarChart3,
    },
    {
        label: 'Pengaturan',
        href: ROUTES.LECTURER.SETTINGS,
        icon: Settings,
    },
];

/**
 * Get navigation items based on user type
 */
export function getNavItems(userType: string): NavItem[] {
    switch (userType) {
        case 'student':
            return studentNavItems;
        case 'lecturer':
            return lecturerNavItems;
        default:
            return [];
    }
}
