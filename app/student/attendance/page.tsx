'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { FaceRegistrationAlert } from '@/components/ui/face-registration-alert';
import { ClassCard } from '@/components/ui/class-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { Class } from '@/types';
import { ROUTES } from '@/lib/routes';
import { useAuth } from '@/lib/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function StudentAttendancePage() {
  const { user, hasFaceRegistered, isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    if (user && user.userType !== 'student') {
      router.push(ROUTES.LOGIN);
      return;
    }

    if (user) {
      fetchTodayClasses(user.id);
    }
  }, [user, authLoading, router]);

  const fetchTodayClasses = async (studentId: string) => {
    try {
      const response = await fetch(`/api/classes?studentId=${studentId}`);
      const data = await response.json();
      if (data.success) {
        const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
        const todayClasses = data.classes.filter((cls: Class) =>
          cls.schedule.toLowerCase().includes(today.toLowerCase())
        );
        setClasses(todayClasses);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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

      {/* Face Registration Alert */}
      {!hasFaceRegistered && (
        <FaceRegistrationAlert isRegistered={false} className="mb-6" />
      )}

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-10 bg-gray-200 rounded mt-4" />
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
            <ClassCard
              key={classItem.id}
              classItem={classItem}
              variant="student"
              hasFaceRegistered={hasFaceRegistered}
            />
          ))}
        </div>
      )}
    </LayoutWrapper>
  );
}
