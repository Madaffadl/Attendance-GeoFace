'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { QuickActions } from '@/components/ui/quick-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Users, 
  Calendar, 
  Download, 
  GraduationCap,
  Clock,
  MapPin,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { Class } from '@/types';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
}

export default function LecturerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.userType !== 'lecturer') {
      router.push('/login');
      return;
    }

    setUser(parsedUser);
    fetchClasses(parsedUser.id);
  }, [router]);

  const fetchClasses = async (lecturerId: string) => {
    try {
      const response = await fetch(`/api/classes?lecturerId=${lecturerId}`);
      const data = await response.json();
      
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleAddClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAddingClass(true);

    const formData = new FormData(e.currentTarget);
    const classData = {
      class_code: formData.get('class_code') as string,
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
      } else {
        alert(data.message || 'Failed to create class');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setIsAddingClass(false);
    }
  };

  const handleExportAttendance = async (classId: string, className: string) => {
    try {
      const response = await fetch(`/api/attendance?classId=${classId}`);
      const data = await response.json();
      
      if (data.success) {
        // Create CSV content
        const csvContent = [
          ['Student ID', 'Class ID', 'Status', 'Time', 'Location'],
          ...data.attendance.map((att: any) => [
            att.student_id,
            att.class_id,
            att.status,
            new Date(att.time).toLocaleString(),
            att.location ? `${att.location.latitude}, ${att.location.longitude}` : 'N/A'
          ])
        ].map(row => row.join(',')).join('\n');

        // Create and download file
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
      alert('Failed to export attendance data');
    }
  };

  if (!user) {
    return null;
  }

  const todayClasses = classes.filter(cls => {
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
    return cls.schedule.includes(today.charAt(0).toUpperCase() + today.slice(1));
  });
  return (
    <LayoutWrapper 
      title="Dashboard" 
      subtitle={`Selamat datang kembali, ${user.name}`}
      showSearch={true}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">Semester ini</p>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayClasses.length}</div>
            <p className="text-xs text-muted-foreground">Jadwal mengajar</p>
          </CardContent>
        </Card>
          </CardContent>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mahasiswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">Di semua kelas</p>
          </CardContent>
        </Card>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Kehadiran</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Rata-rata bulan ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <QuickActions user={user} />
      {/* Classes Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Kelas Saya</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Tambah Kelas
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Kelas Baru</DialogTitle>
                <DialogDescription>
                  Buat kelas baru untuk mahasiswa bergabung.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddClass} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="class_code">Kode Kelas</Label>
                  <Input
                    id="class_code"
                    name="class_code"
                    placeholder="contoh: CS301"
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
                    Buat Kelas
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
        {classes.length === 0 ? (
          <Card>
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
              <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{classItem.class_name}</CardTitle>
                      <CardDescription>{classItem.class_code}</CardDescription>
                    </div>
                    <Badge variant="outline">{classItem.class_code}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {classItem.schedule}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      15 mahasiswa terdaftar
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      Lokasi Kampus
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => router.push(`/lecturer/classes/${classItem.id}`)}
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Detail Kelas
                    </Button>
                    <Button 
                      onClick={() => handleExportAttendance(classItem.id, classItem.class_name)}
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}