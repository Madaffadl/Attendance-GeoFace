'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Plus,
  Search,
  Users,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  Eye,
  Edit,
  Trash2,
  Filter
} from 'lucide-react';
import { Class } from '@/types';
import { mockClasses, mockEnrollments } from '@/lib/mockData';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
}

export default function ClassesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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
    loadClasses(parsedUser.id);
  }, [router]);

  const loadClasses = (lecturerId: string) => {
    const lecturerClasses = mockClasses.filter(cls => cls.lecturer_id === lecturerId);
    setClasses(lecturerClasses);
  };

  const filterClasses = useCallback(() => {
    let filtered = classes;

    if (searchTerm) {
      filtered = filtered.filter(cls =>
        cls.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.class_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClasses(filtered);
  }, [classes, searchTerm]);

  useEffect(() => {
    filterClasses();
  }, [filterClasses]);

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

  const getEnrolledStudentsCount = (classId: string) => {
    return Object.keys(mockEnrollments).filter(studentId => 
      mockEnrollments[studentId].includes(classId)
    ).length;
  };

  if (!user) {
    return null;
  }

  return (
    <LayoutWrapper 
      title="Kelas Saya" 
      subtitle="Kelola semua kelas yang Anda ampu"
      showSearch={true}
      breadcrumbItems={[
        { label: 'Dashboard', href: '/lecturer/dashboard' },
        { label: 'Kelas', current: true }
      ]}
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Kelola Kelas</h2>
          <p className="text-sm text-gray-600">Total {classes.length} kelas aktif</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Tambah Kelas Baru
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mahasiswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes.reduce((total, cls) => total + getEnrolledStudentsCount(cls.id), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Di semua kelas</p>
          </CardContent>
        </Card>
            <div className="text-2xl font-bold">{classes.length}</div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Jadwal mengajar</p>
          </CardContent>
        </Card>
            <p className="text-xs text-muted-foreground">Semester ini</p>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jam Mengajar</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length * 2}</div>
            <p className="text-xs text-muted-foreground">Jam per minggu</p>
          </CardContent>
        </Card>
      </div>
          </CardContent>
      {/* Search and Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Cari Kelas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari berdasarkan nama kelas atau kode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
        </Card>
      {/* Classes List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kelas ({filteredClasses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Tidak Ada Kelas Ditemukan' : 'Belum Ada Kelas'}
              </h3>
              <p className="text-gray-600">
                {searchTerm ? 'Coba ubah kata kunci pencarian.' : 'Mulai dengan membuat kelas pertama Anda.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {filteredClasses.map((classItem) => {
                const enrolledCount = getEnrolledStudentsCount(classItem.id);
                
                return (
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
                          {enrolledCount} mahasiswa terdaftar
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          Kampus
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => router.push(`/lecturer/classes/${classItem.id}`)}
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-2 flex-1"
                        >
                          <Eye className="w-4 h-4" />
                          Detail
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </LayoutWrapper>
  );
}