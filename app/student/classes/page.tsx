'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, MapPin, Users, Camera } from 'lucide-react';
import { Class } from '@/types';
import { ROUTES } from '@/lib/routes';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
}

export default function StudentClassesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      fetchClasses(parsedUser.id);
    } catch {
      router.push(ROUTES.LOGIN);
    }
  }, [router]);

  const fetchClasses = async (studentId: string) => {
    try {
      const response = await fetch(`/api/classes?studentId=${studentId}`);
      const data = await response.json();
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
                <div className="h-6 bg-muted rounded mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
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
            <Card key={classItem.id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{classItem.class_name}</CardTitle>
                    <CardDescription>{classItem.lecturer_name}</CardDescription>
                  </div>
                  <Badge variant="outline">{classItem.class_code}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{classItem.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Lokasi Kampus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>15 mahasiswa</span>
                  </div>
                </div>
                <Button
                  onClick={() => router.push(`/student/attendance/${classItem.id}`)}
                  className="w-full"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Tandai Kehadiran
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </LayoutWrapper>
  );
}
