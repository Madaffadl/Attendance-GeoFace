'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Clock, MapPin, AlertCircle } from 'lucide-react';
import { Class } from '@/types';
import { ROUTES } from '@/lib/routes';
import { hasFaceData } from '@/lib/faceStorage';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
}

export default function StudentAttendancePage() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFace, setHasFace] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push(ROUTES.LOGIN);
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.userType !== 'student') {
        router.push(ROUTES.LOGIN);
        return;
      }
      setUser(parsedUser);
      setHasFace(hasFaceData(parsedUser.id));
      fetchTodayClasses(parsedUser.id);
    } catch {
      router.push(ROUTES.LOGIN);
    }
  }, [router]);

  const fetchTodayClasses = async (studentId: string) => {
    try {
      const response = await fetch(`/api/classes?studentId=${studentId}`);
      const data = await response.json();
      if (data.success) {
        // Filter to today's classes
        const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
        const todayClasses = data.classes.filter((cls: Class) =>
          cls.schedule.includes(today.charAt(0).toUpperCase() + today.slice(1))
        );
        setClasses(todayClasses);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <LayoutWrapper title="Absensi" subtitle="Tandai kehadiran Anda">
      <PageHeader
        title="Tandai Kehadiran"
        subtitle={today}
        breadcrumbItems={[
          { label: 'Dashboard', href: ROUTES.STUDENT.DASHBOARD },
          { label: 'Absensi', current: true },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.push(ROUTES.STUDENT.ATTENDANCE_HISTORY)}>
            Lihat Riwayat
          </Button>
        }
      />

      {/* Face Registration Warning */}
      {!hasFace && (
        <Card className="mb-6 border-warning bg-warning/10">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Registrasi Wajah Diperlukan</p>
              <p className="text-sm text-muted-foreground">
                Anda harus mendaftarkan wajah terlebih dahulu untuk dapat melakukan absensi.
              </p>
            </div>
            <Button onClick={() => router.push(ROUTES.STUDENT.FACE_REGISTRATION)}>
              Daftar Wajah
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-10 bg-muted rounded mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="Tidak Ada Kelas Hari Ini"
          description="Anda tidak memiliki jadwal kelas untuk hari ini. Nikmati waktu luang Anda!"
          action={{
            label: 'Lihat Semua Kelas',
            onClick: () => router.push(ROUTES.STUDENT.CLASSES),
          }}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {classes.map((classItem) => (
            <Card key={classItem.id} className="hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{classItem.class_name}</CardTitle>
                    <CardDescription>{classItem.lecturer_name}</CardDescription>
                  </div>
                  <Badge variant="secondary">{classItem.class_code}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {classItem.schedule}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Kampus
                  </div>
                </div>
                <Button
                  className="w-full"
                  disabled={!hasFace}
                  onClick={() => router.push(`/student/attendance/${classItem.id}`)}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {hasFace ? 'Tandai Kehadiran' : 'Daftar Wajah Dulu'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </LayoutWrapper>
  );
}
