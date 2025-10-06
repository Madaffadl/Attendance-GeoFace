'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Plus, Users, Calendar, ChartBar as BarChart3, Download, BookOpen, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
      action: () => {
        const firstClass = classes[0];
        if (firstClass) {
          router.push(`/student/register-face/${firstClass.id}`);
        }
      },
      color: faceRegistrationStatus ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600',
      disabled: classes.length === 0
    }
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
      action: () => router.push('/lecturer/classes/new'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      label: 'Lihat Laporan',
      description: 'Analisis kehadiran',
      icon: BarChart3,
      action: () => router.push('/lecturer/reports'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      label: 'Export Data',
      description: 'Download laporan absensi',
      icon: Download,
      action: () => router.push('/lecturer/reports'),
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      label: 'Kelola Mahasiswa',
      description: 'Lihat daftar mahasiswa',
      icon: Users,
      action: () => router.push('/lecturer/students'),
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  const actions = user.userType === 'student' ? studentActions : lecturerActions;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aksi Cepat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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