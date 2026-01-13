'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Plus, Users, ChartBar as BarChart3, Download, History, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
}

interface QuickActionsProps {
  user: User;
  faceRegistrationStatus?: boolean;
  classes?: any[];
}

export function QuickActions({ user, faceRegistrationStatus = false, classes = [] }: QuickActionsProps) {
  const router = useRouter();

  const studentActions: Array<{
    label: string;
    description: string;
    icon: any;
    action: () => void;
    color: string;
    disabled?: boolean;
  }> = [
    {
      label: 'Registrasi Wajah',
      description: faceRegistrationStatus ? 'Perbarui data wajah Anda' : 'Daftar wajah untuk absensi',
      icon: Camera,
      action: () => router.push(ROUTES.STUDENT.FACE_REGISTRATION),
      color: faceRegistrationStatus ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600',
    },
    {
      label: 'Lihat Kelas',
      description: 'Daftar semua kelas Anda',
      icon: BookOpen,
      action: () => router.push(ROUTES.STUDENT.CLASSES),
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      label: 'Riwayat Absensi',
      description: 'Lihat catatan kehadiran',
      icon: History,
      action: () => router.push(ROUTES.STUDENT.ATTENDANCE_HISTORY),
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  const lecturerActions: Array<{
    label: string;
    description: string;
    icon: any;
    action: () => void;
    color: string;
    disabled?: boolean;
  }> = [
    {
      label: 'Tambah Kelas',
      description: 'Buat kelas baru',
      icon: Plus,
      action: () => router.push(ROUTES.LECTURER.CLASSES_NEW),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      label: 'Lihat Laporan',
      description: 'Analisis kehadiran',
      icon: BarChart3,
      action: () => router.push(ROUTES.LECTURER.REPORTS),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      label: 'Kelola Mahasiswa',
      description: 'Lihat daftar mahasiswa',
      icon: Users,
      action: () => router.push(ROUTES.LECTURER.STUDENTS),
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  const actions = user.userType === 'student' ? studentActions : lecturerActions;

  return (
    <Card className="shadow-md border-0">
      <CardHeader>
        <CardTitle className="text-lg">Aksi Cepat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2 hover:shadow-md transition-all"
              disabled={action.disabled || false}
            >
              <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center mb-2`}>
                <action.icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">{action.label}</div>
                <div className="text-xs text-gray-600">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}