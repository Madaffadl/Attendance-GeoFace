/**
 * Centralized route constants to avoid magic strings throughout the app.
 * Use these constants instead of hardcoded paths.
 */
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',

    // Student Routes
    STUDENT: {
        DASHBOARD: '/student/dashboard',
        CLASSES: '/student/classes',
        SCHEDULE: '/student/schedule',
        ATTENDANCE: '/student/attendance',
        ATTENDANCE_HISTORY: '/student/attendance/history',
        ATTENDANCE_MARK: (classId: string) => `/student/attendance/${classId}`,
        REGISTER_FACE: '/student/register-face',
        REGISTER_FACE_CLASS: (classId: string) => `/student/register-face/${classId}`,
        FACE_REGISTRATION: '/student/face-registration',
        PROFILE: '/student/profile',
        LOCATIONS: '/student/locations',
    },

    // Lecturer Routes
    LECTURER: {
        DASHBOARD: '/lecturer/dashboard',
        CLASSES: '/lecturer/classes',
        CLASSES_NEW: '/lecturer/classes/new',
        CLASS_DETAIL: (classId: string) => `/lecturer/classes/${classId}`,
        STUDENTS: '/lecturer/students',
        STUDENT_DETAIL: (studentId: string) => `/lecturer/students/${studentId}`,
        SCHEDULE: '/lecturer/schedule',
        REPORTS: '/lecturer/reports',
        ANALYTICS: '/lecturer/analytics',
        SETTINGS: '/lecturer/settings',
    },

    // Admin Routes (placeholder for future)
    ADMIN: {
        DASHBOARD: '/admin/dashboard',
        USERS: '/admin/users',
        SETTINGS: '/admin/settings',
    },
} as const;

/**
 * Helper to get the dashboard route based on user type
 */
export function getDashboardRoute(userType: string): string {
    switch (userType) {
        case 'student':
            return ROUTES.STUDENT.DASHBOARD;
        case 'lecturer':
            return ROUTES.LECTURER.DASHBOARD;
        case 'admin':
            return ROUTES.ADMIN.DASHBOARD;
        default:
            return ROUTES.HOME;
    }
}
