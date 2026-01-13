'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { QuickActions } from '@/components/ui/quick-actions';
import { UserInfoCard } from '@/components/ui/user-info-card';
import { FaceRegistrationAlert } from '@/components/ui/face-registration-alert';
import { ClassCard } from '@/components/ui/class-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, BookOpen } from 'lucide-react';
import { Class } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function StudentDashboard() {
  const { user, hasFaceRegistered, isLoading: authLoading, refreshFaceStatus } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.userType !== 'student') {
      router.push('/login');
      return;
    }

    if (user) {
      fetchClasses(user.id);
    }
  }, [user, authLoading, router]);

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

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const todayClasses = classes.filter(cls => {
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
    return cls.schedule.toLowerCase().includes(today.toLowerCase());
  });

  return (
    <LayoutWrapper 
      title="Dashboard" 
      subtitle={`Selamat datang kembali, ${user.name}`}
      showSearch={true}
    >
      {/* User Info Card */}
      <UserInfoCard 
        user={{
          name: user.name,
          identifier: user.identifier,
          email: user.email,
          program_study: user.program_study,
          photo: user.photo,
        }} 
        className="mb-6"
      />

      {/* Face Registration Status Alert */}
      <FaceRegistrationAlert 
        isRegistered={hasFaceRegistered}
        onRefresh={refreshFaceStatus}
        showRefreshButton={hasFaceRegistered}
        className="mb-6"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas Terdaftar</CardTitle>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{classes.length}</div>
            <p className="text-xs text-gray-600">Semester ini</p>
          </CardContent>
        </Card>
        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas Hari Ini</CardTitle>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{todayClasses.length}</div>
            <p className="text-xs text-gray-600">Jadwal hari ini</p>
          </CardContent>
        </Card>
        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Wajah</CardTitle>
            <div className={`w-10 h-10 ${hasFaceRegistered ? 'bg-green-100' : 'bg-orange-100'} rounded-full flex items-center justify-center`}>
              <User className={`h-5 w-5 ${hasFaceRegistered ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">
              {hasFaceRegistered ? 'Terdaftar' : 'Belum'}
            </div>
            <p className="text-xs text-gray-600">
              {hasFaceRegistered ? 'Siap absensi' : 'Perlu registrasi'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <QuickActions user={user} faceRegistrationStatus={hasFaceRegistered} classes={classes} />
      </div>

      {/* Classes Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Kelas Saya</h2>
          <Badge variant="secondary" className="px-3 py-1">
            {classes.length} Kelas
          </Badge>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
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
          <Card className="shadow-md border-0">
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Kelas</h3>
              <p className="text-gray-600">Anda belum terdaftar di kelas manapun.</p>
            </CardContent>
          </Card>
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
      </div>
    </LayoutWrapper>
  );
}