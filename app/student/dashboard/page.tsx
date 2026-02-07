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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar, User, BookOpen, Trash2, AlertTriangle, Plus, Loader2 } from 'lucide-react';
import { Class } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';

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

  // Join class state
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  // Testing functions
  const [testingMessage, setTestingMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      setJoinError('Masukkan kode kelas');
      return;
    }

    setIsJoining(true);
    setJoinError('');
    setJoinSuccess('');

    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user?.id,
          class_code: classCode.trim().toUpperCase()
        })
      });

      const data = await response.json();

      if (data.success) {
        setJoinSuccess(data.message);
        setClassCode('');
        // Refresh classes list
        if (user) {
          await fetchClasses(user.id);
        }
        // Close dialog after 1.5s
        setTimeout(() => {
          setIsJoinDialogOpen(false);
          setJoinSuccess('');
        }, 1500);
      } else {
        setJoinError(data.message || 'Gagal bergabung ke kelas');
      }
    } catch (error) {
      console.error('Error joining class:', error);
      setJoinError('Terjadi kesalahan saat bergabung ke kelas');
    } finally {
      setIsJoining(false);
    }
  };

  const deleteFaceData = async () => {
    if (!user) return;
    if (!confirm('Yakin ingin menghapus data wajah? Anda harus register ulang.')) return;
    
    setIsDeleting(true);
    setTestingMessage('Menghapus data wajah...');
    
    try {
      // Delete from Supabase
      const response = await fetch(`/api/face-registration?studentId=${user.id}`, {
        method: 'DELETE',
      });
      
      // Clear localStorage
      localStorage.removeItem('attendance_face_data');
      
      // Refresh face status
      await refreshFaceStatus();
      
      setTestingMessage('✓ Data wajah berhasil dihapus!');
      setTimeout(() => setTestingMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting face data:', error);
      setTestingMessage('✗ Gagal menghapus data wajah');
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteAttendanceData = async () => {
    if (!user) return;
    if (!confirm('Yakin ingin menghapus semua data absensi Anda?')) return;
    
    setIsDeleting(true);
    setTestingMessage('Menghapus data absensi...');
    
    try {
      const response = await fetch(`/api/attendance?studentId=${user.id}`, {
        method: 'DELETE',
      });
      
      setTestingMessage('✓ Data absensi berhasil dihapus!');
      setTimeout(() => setTestingMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting attendance data:', error);
      setTestingMessage('✗ Gagal menghapus data absensi');
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Count total sessions for today (not just unique classes)
  const todaySessionsCount = (() => {
    const now = new Date();
    const todayDayName = now.toLocaleDateString('id-ID', { weekday: 'long' }).toLowerCase();
    let count = 0;
    
    classes.forEach((cls: any) => {
      // Check specific dates in schedule_details from API
      if (cls.schedule_details && Array.isArray(cls.schedule_details) && cls.schedule_details.length > 0) {
        count += cls.schedule_details.filter((d: any) => {
          const dDate = new Date(d.date);
          return dDate.getDate() === now.getDate() &&
                 dDate.getMonth() === now.getMonth() &&
                 dDate.getFullYear() === now.getFullYear();
        }).length;
      } else if (cls.schedule?.toLowerCase().includes(todayDayName)) {
        // Fallback: Check day name (legacy format counts as 1 session)
        count++;
      }
    });
    
    return count;
  })();

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <LayoutWrapper 
      title="Dashboard" 
      subtitle={`Selamat datang kembali, ${user.name}`}

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
            <div className="text-2xl font-bold text-gray-900">{todaySessionsCount}</div>
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
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-1/3 mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <div className="mt-4">
                    <Skeleton className="h-10 w-full" />
                  </div>
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