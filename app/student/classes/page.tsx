'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ClassCard } from '@/components/ui/class-card';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { Class } from '@/types';
import { ROUTES } from '@/lib/routes';
import { useAuth } from '@/lib/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function StudentClassesPage() {
  const { user, hasFaceRegistered, isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Don't do anything while auth is loading
    if (authLoading) {
      return;
    }

    // Redirect if not logged in
    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    // Redirect if not a student
    if (user.userType !== 'student') {
      router.push(ROUTES.LOGIN);
      return;
    }

    // Only fetch if we haven't fetched yet
    if (!hasFetched) {
      fetchClasses(user.id);
      setHasFetched(true);
    }
  }, [user, authLoading, router, hasFetched]);

  const fetchClasses = async (studentId: string) => {
    try {
      console.log('Classes page: Fetching classes for student:', studentId);
      const response = await fetch(`/api/classes?studentId=${studentId}`);
      const data = await response.json();
      console.log('Classes page: API response:', data);
      
      if (data.success) {
        setClasses(data.classes);
      } else {
        console.error('Classes page: API returned error:', data.message);
      }
    } catch (error) {
      console.error('Classes page: Error fetching classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Return null if redirecting
  if (!user) return null;

  return (
    <LayoutWrapper title="Kelas Saya" subtitle="Daftar kelas yang Anda ikuti">
      <PageHeader
        title="Kelas Saya"
        subtitle="Lihat semua kelas yang Anda ikuti semester ini"
        breadcrumbItems={[
          { label: 'Dashboard', href: ROUTES.STUDENT.DASHBOARD },
          { label: 'Kelas Saya', current: true },
        ]}
      />

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Belum Ada Kelas"
          description="Anda belum terdaftar di kelas manapun semester ini. Hubungi administrator untuk informasi lebih lanjut."
          action={{
            label: 'Kembali ke Dashboard',
            onClick: () => router.push(ROUTES.STUDENT.DASHBOARD),
          }}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
