'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { QuickActions } from '@/components/ui/quick-actions';
import { ClassCard } from '@/components/ui/class-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Plus, 
  Users, 
  Calendar, 
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { Class } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface LecturerStats {
  totalClasses: number;
  totalStudents: number;
  todayClasses: number;
  attendanceRate: number;
}

export default function LecturerDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [stats, setStats] = useState<LecturerStats>({
    totalClasses: 0,
    totalStudents: 0,
    todayClasses: 0,
    attendanceRate: 0,
  });
  const [classStudentCounts, setClassStudentCounts] = useState<{ [key: string]: number }>({});
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [classCodeInput, setClassCodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.userType !== 'lecturer') {
      router.push('/login');
      return;
    }

    if (user) {
      fetchClasses(user.id);
      fetchStats(user.id);
    }
  }, [user, authLoading, router]);

  const fetchClasses = async (lecturerId: string) => {
    try {
      const response = await fetch(`/api/classes?lecturerId=${lecturerId}`);
      const data = await response.json();
      
      if (data.success) {
        setClasses(data.classes);
        // Fetch student counts for each class
        data.classes.forEach((cls: Class) => {
          fetchClassStats(cls.id);
        });
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async (lecturerId: string) => {
    try {
      const response = await fetch(`/api/stats?lecturerId=${lecturerId}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchClassStats = async (classId: string) => {
    try {
      const response = await fetch(`/api/stats?classId=${classId}`);
      const data = await response.json();
      
      if (data.success) {
        setClassStudentCounts(prev => ({
          ...prev,
          [classId]: data.stats.studentCount,
        }));
      }
    } catch (error) {
      console.error('Error fetching class stats:', error);
    }
  };

  const handleAddClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAddingClass(true);

    const formData = new FormData(e.currentTarget);
    const classData = {
      class_code: classCodeInput, // Already uppercased by state
      class_name: formData.get('class_name') as string,
      schedule: formData.get('schedule') as string,
      lecturer_id: user?.id
    };

    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(classData),
      });

      const data = await response.json();

      if (data.success) {
        setClasses([...classes, data.class]);
        setIsDialogOpen(false);
        (e.target as HTMLFormElement).reset();
        setClassCodeInput('');
        // Refresh stats
        if (user) fetchStats(user.id);
        toast({
          title: 'Berhasil',
          description: 'Kelas berhasil dibuat',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Gagal',
          description: data.message || 'Gagal membuat kelas',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingClass(false);
    }
  };

  const handleExportAttendance = async (classId: string, className: string) => {
    try {
      const response = await fetch(`/api/attendance?classId=${classId}`);
      const data = await response.json();
      
      if (data.success) {
        const csvContent = [
          ['Student ID', 'Class ID', 'Status', 'Time', 'Location'],
          ...data.attendance.map((att: any) => [
            att.student_id,
            att.class_id,
            att.status,
            new Date(att.time).toLocaleString('id-ID'),
            att.location ? `${att.location.latitude}, ${att.location.longitude}` : 'N/A'
          ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${className.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast({
        title: 'Gagal',
        description: 'Gagal mengexport data kehadiran',
        variant: 'destructive',
      });
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

  return (
    <LayoutWrapper 
      title="Dashboard" 
      subtitle={`Selamat datang kembali, ${user.name}`}

    >
      {/* Stats Cards - Now using real data */}
      {/* Stats Cards - Now using real data */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-md border-0">
              <CardContent className="p-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-gray-500">Semester ini</p>
          </CardContent>
        </Card>
        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayClasses}</div>
            <p className="text-xs text-gray-500">Jadwal mengajar</p>
          </CardContent>
        </Card>
        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mahasiswa</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-gray-500">Di semua kelas</p>
          </CardContent>
        </Card>
        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Kehadiran</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            <p className="text-xs text-gray-500">Rata-rata keseluruhan</p>
          </CardContent>
        </Card>
      </div>
      )}

      <div className="mb-8">
        <QuickActions user={user} />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Kelas Saya</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Kelas Baru</DialogTitle>
                <DialogDescription>
                  Buat kelas baru untuk mahasiswa bergabung.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddClass} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="class_code">Kode Kelas *</Label>
                  <Input
                    id="class_code"
                    name="class_code"
                    placeholder="CONTOH: CS301"
                    className="uppercase"
                    value={classCodeInput}
                    onChange={(e) => setClassCodeInput(e.target.value.toUpperCase())}
                    required
                    disabled={isAddingClass}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="class_name">Nama Kelas</Label>
                  <Input
                    id="class_name"
                    name="class_name"
                    placeholder="contoh: Sistem Basis Data Lanjut"
                    required
                    disabled={isAddingClass}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="schedule">Jadwal</Label>
                  <Input
                    id="schedule"
                    name="schedule"
                    placeholder="contoh: Senin 10:00-12:00"
                    required
                    disabled={isAddingClass}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isAddingClass}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isAddingClass}>
                    {isAddingClass ? <LoadingSpinner size="sm" /> : 'Buat Kelas'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {[...Array(4)].map((_, i) => (
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
              <p className="text-gray-600 mb-4">Mulai dengan membuat kelas pertama Anda.</p>
              <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Tambah Kelas
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {classes.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classItem={classItem}
                variant="lecturer"
                studentCount={classStudentCounts[classItem.id]}
                showExportButton={true}
                onExport={() => handleExportAttendance(classItem.id, classItem.class_name)}
              />
            ))}
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}